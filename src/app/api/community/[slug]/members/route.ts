import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resolveCommunityCollegeId, normalizeCollegeRelation } from '@/lib/community-stats'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

type MemberRow = {
  id: string
  full_name: string
  avatar_url?: string | null
  role: string
  unique_id?: string
  is_verified?: boolean
  created_at?: string
  member_category: 'own_student' | 'own_senior' | 'other_college'
  membership_type?: string | null
  joined_at?: string | null
  college_name?: string
  college_short_name?: string
}

function mapUser(
  user: any,
  category: MemberRow['member_category'],
  extra?: { membership_type?: string; joined_at?: string }
): MemberRow {
  const college = user.colleges
  const collegeObj = Array.isArray(college) ? college[0] : college
  return {
    id: user.id,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    role: user.role,
    unique_id: user.unique_id,
    is_verified: user.is_verified,
    created_at: user.created_at,
    member_category: category,
    membership_type: extra?.membership_type ?? null,
    joined_at: extra?.joined_at ?? null,
    college_name: collegeObj?.name || '',
    college_short_name: collegeObj?.short_name || '',
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select(`
        id,
        college_id,
        slug,
        colleges ( id, name, short_name, slug )
      `)
      .eq('slug', slug)
      .maybeSingle()

    if (communityError || !community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const collegeId = await resolveCommunityCollegeId(
      supabase,
      community,
      normalizeCollegeRelation(community.colleges)
    )

    const userSelect = `
      id,
      full_name,
      avatar_url,
      role,
      unique_id,
      is_verified,
      created_at,
      college_id,
      colleges ( name, short_name )
    `

    const ownStudents: MemberRow[] = []
    const ownSeniors: MemberRow[] = []
    const otherCollege: MemberRow[] = []

    if (collegeId) {
      const { data: ownUsers, error: ownError } = await supabase
        .from('users')
        .select(userSelect)
        .eq('college_id', collegeId)
        .order('created_at', { ascending: false })

      if (ownError) {
        console.error('Own college users error:', ownError)
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
      }

      for (const user of ownUsers || []) {
        if (user.role === 'senior') {
          ownSeniors.push(mapUser(user, 'own_senior'))
        } else {
          ownStudents.push(mapUser(user, 'own_student'))
        }
      }
    }

    const { data: memberRows, error: membersError } = await supabase
      .from('community_members')
      .select('user_id, membership_type, joined_at')
      .eq('community_id', community.id)

    if (membersError) {
      console.error('community_members error:', membersError)
    }

    const externalIds = (memberRows || [])
      .map((row) => row.user_id)
      .filter(Boolean)

    if (externalIds.length > 0) {
      let externalQuery = supabase
        .from('users')
        .select(userSelect)
        .in('id', externalIds)

      if (collegeId) {
        externalQuery = externalQuery.neq('college_id', collegeId)
      }

      const { data: externalUsers, error: externalError } = await externalQuery

      if (externalError) {
        console.error('External members error:', externalError)
      } else {
        const joinMeta = new Map(
          (memberRows || []).map((row) => [
            row.user_id,
            { membership_type: row.membership_type, joined_at: row.joined_at },
          ])
        )

        for (const user of externalUsers || []) {
          const meta = joinMeta.get(user.id)
          otherCollege.push(
            mapUser(user, 'other_college', {
              membership_type: meta?.membership_type,
              joined_at: meta?.joined_at,
            })
          )
        }
      }
    }

    const members = [...ownStudents, ...ownSeniors, ...otherCollege]
    const counts = {
      ownStudents: ownStudents.length,
      ownSeniors: ownSeniors.length,
      otherCollege: otherCollege.length,
      total: members.length,
    }

    return NextResponse.json({
      success: true,
      members,
      groups: {
        ownStudents,
        ownSeniors,
        otherCollege,
      },
      counts,
      collegeName: (() => {
        const c = community.colleges
        if (Array.isArray(c)) return c[0]?.name || ''
        return (c as { name?: string } | null)?.name || ''
      })(),
    })
  } catch (error) {
    console.error('Community members API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
