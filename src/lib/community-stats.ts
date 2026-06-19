import { SupabaseClient } from '@supabase/supabase-js'

type CollegeRef = { id: string } | null

/** Normalize Supabase embed: object or single-element array. */
export function normalizeCollegeRelation(colleges: unknown): CollegeRef {
  if (!colleges) return null
  if (Array.isArray(colleges)) {
    const first = colleges[0] as { id?: string } | undefined
    return first?.id ? { id: first.id } : null
  }
  if (typeof colleges === 'object' && 'id' in colleges) {
    const c = colleges as { id?: string }
    return c.id ? { id: c.id } : null
  }
  return null
}

/** Resolve college_id from community row (communities.college_id or colleges relation). */
export async function resolveCommunityCollegeId(
  supabase: SupabaseClient,
  community: { id: string; college_id?: string | null; slug?: string },
  colleges?: unknown
): Promise<string | null> {
  const normalized = normalizeCollegeRelation(colleges)
  if (normalized?.id) return normalized.id
  if (community.college_id) return community.college_id

  if (community.slug) {
    const { data: college } = await supabase
      .from('colleges')
      .select('id')
      .eq('slug', community.slug)
      .maybeSingle()

    if (college?.id) return college.id

    // Slug mismatch fallback: community slug may differ from college slug (e.g. acew-vellichanthai vs acew)
    const slugPrefix = community.slug.split('-')[0]
    if (slugPrefix && slugPrefix !== community.slug) {
      const { data: byPrefix } = await supabase
        .from('colleges')
        .select('id')
        .ilike('slug', `${slugPrefix}%`)
        .limit(1)
        .maybeSingle()
      if (byPrefix?.id) return byPrefix.id
    }
  }

  // Last resort: read college_id from communities row
  const { data: row } = await supabase
    .from('communities')
    .select('college_id')
    .eq('id', community.id)
    .maybeSingle()

  return row?.college_id ?? null
}

/** Member count = own-college students + own-college seniors + other-college users who joined this hub. */
export async function getCommunityDisplayCounts(
  supabase: SupabaseClient,
  communityId: string,
  collegeId: string | null | undefined
) {
  let ownStudentCount = 0
  let ownSeniorCount = 0
  let otherCollegeStudentCount = 0

  const resolvedCollegeId =
    collegeId ??
    (await resolveCommunityCollegeId(supabase, { id: communityId }, null))

  if (resolvedCollegeId) {
    const { count: students, error: studentsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', resolvedCollegeId)
      .eq('role', 'student')

    const { count: seniors, error: seniorsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', resolvedCollegeId)
      .eq('role', 'senior')

    if (studentsError) console.error('ownStudentCount error:', studentsError)
    if (seniorsError) console.error('ownSeniorCount error:', seniorsError)

    ownStudentCount = students ?? 0
    ownSeniorCount = seniors ?? 0
  }

  // All joiners stored in community_members — count users whose college differs from this hub
  const { data: memberRows, error: membersError } = await supabase
    .from('community_members')
    .select('user_id')
    .eq('community_id', communityId)

  if (membersError) {
    console.error('community_members count error:', membersError)
  }

  const memberUserIds = (memberRows || [])
    .map((row: { user_id: string }) => row.user_id)
    .filter(Boolean)

  if (memberUserIds.length > 0) {
    // Count everyone in community_members whose college is not this hub (students + seniors from other colleges)
    let externalQuery = supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('id', memberUserIds)

    if (resolvedCollegeId) {
      externalQuery = externalQuery.neq('college_id', resolvedCollegeId)
    }

    const { count, error: externalError } = await externalQuery

    if (externalError) {
      console.error('otherCollegeMemberCount error:', externalError)
      otherCollegeStudentCount = memberUserIds.length
    } else {
      otherCollegeStudentCount = count ?? 0
    }
  }

  return {
    totalMembers: ownStudentCount + ownSeniorCount + otherCollegeStudentCount,
    ownSeniorCount,
    seniorCount: ownSeniorCount,
    ownStudentCount,
    otherCollegeStudentCount,
    collegeId: resolvedCollegeId,
  }
}

/**
 * Recalculate and persist member_count / senior_count from source-of-truth data.
 * Call this after any membership-changing operation (signup, join, leave, delete-account).
 * Never use manual increment/decrement — always recalculate.
 */
export async function syncCommunityCounts(
  supabase: SupabaseClient,
  communityId: string,
  collegeId?: string | null
) {
  const { totalMembers, seniorCount } = await getCommunityDisplayCounts(
    supabase,
    communityId,
    collegeId
  )

  const { error } = await supabase
    .from('communities')
    .update({
      member_count: totalMembers,
      senior_count: seniorCount
    })
    .eq('id', communityId)

  if (error) {
    console.error('syncCommunityCounts error:', error)
  }

  return { totalMembers, seniorCount }
}
