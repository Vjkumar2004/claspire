import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

interface SearchResult {
  id: string
  type: 'senior' | 'student' | 'job' | 'community' | 'college' | 'group' | 'post'
  title: string
  subtitle: string
  metadata: {
    location?: string
    salary_range?: string
    member_count?: number
    graduation_year?: string
    company?: string
    designation?: string
    posted_date?: string
    views?: number
  }
  description: string
  imageUrl: string | null
  href: string
  score: number
  collegeId?: string
  is_joined?: boolean
}

// Levenshtein distance string metrics for fuzzy tolerance
function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

function getSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) return 1.0
  return (maxLength - getLevenshteinDistance(a, b)) / maxLength
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get('q') || '').trim().toLowerCase()
    const filterType = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!query) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const results: SearchResult[] = []

    // Fetch matching colleges first to build Knowledge Graph relationship expansion
    const { data: matchedColleges } = await supabase
      .from('colleges')
      .select('id, name, short_name, slug')
      .or(`name.ilike.%${query}%,short_name.ilike.%${query}%,slug.ilike.%${query}%`)

    const matchedCollegeIds = matchedColleges?.map(c => c.id) || []
    const matchedCollegeShortNames = matchedColleges?.map(c => c.short_name).filter(Boolean) as string[] || []
    const matchedCollegeSlugs = matchedColleges?.map(c => c.slug).filter(Boolean) as string[] || []

    // Fetch matching communities first
    const { data: matchedComms } = await supabase
      .from('communities')
      .select('id, display_name, slug')
      .or(`display_name.ilike.%${query}%,slug.ilike.%${query}%`)

    const matchedCommunityIds = matchedComms?.map(c => c.id) || []

    // Fetch matching users/authors first
    const { data: matchedUsers } = await supabase
      .from('users')
      .select('id, full_name, last_seen')
      .or(`full_name.ilike.%${query}%`)

    const matchedUserIds = matchedUsers?.map(u => u.id) || []

    // 1. Live NLP Search Intent Classification (Support prefix search like "aaa colleg")
    let searchIntent: 'institution' | 'person' | 'job' | 'general' = 'general'

    const institutionKeywords = ['college', 'university', 'univ', 'school', 'institute', 'aaacet', 'mepco', 'kare', 'vhr', 'rit', 'sfr', 'anjac', 'agpc', 'skc', 'kamaraj', 'education', 'campus', 'clg', 'engineering', 'science', 'arts']
    const jobKeywords = ['developer', 'sde', 'engineer', 'react', 'frontend', 'backend', 'fullstack', 'intern', 'placement', 'analyst', 'tech', 'job', 'hiring', 'referral', 'vacancy']

    const queryWords = query.split(/\s+/)

    // Check if query word starts with or matches any institution keywords to detect prefix intent
    const hasInstitutionKeyword = queryWords.some(w =>
      institutionKeywords.some(kw => kw.startsWith(w) || w.startsWith(kw))
    )

    const hasJobKeyword = queryWords.some(w =>
      jobKeywords.some(kw => kw.startsWith(w) || w.startsWith(kw))
    )

    // If query matches a college in the database, it's NOT a person intent
    const isLikelyPerson = !hasInstitutionKeyword && !hasJobKeyword && query.length >= 3 && matchedCollegeIds.length === 0

    if (hasInstitutionKeyword || matchedCollegeIds.length > 0) {
      searchIntent = 'institution'
    } else if (hasJobKeyword) {
      searchIntent = 'job'
    } else if (isLikelyPerson) {
      searchIntent = 'person'
    }

    // 1. Search People (Seniors & Students + Related Network Seniors)
    if (filterType === 'all' || filterType === 'people') {
      let peopleOr = `full_name.ilike.%${query}%,company.ilike.%${query}%,designation.ilike.%${query}%`

      // Also fetch based on fuzzy name initials/fragments to support typo tolerance in the database layer
      if (query.length >= 3) {
        const queryFragment = query.substring(0, Math.min(query.length, 4))
        peopleOr += `,full_name.ilike.%${queryFragment}%`
      }

      if (matchedCollegeIds.length > 0) {
        peopleOr += `,college_id.in.(${matchedCollegeIds.map(id => `"${id}"`).join(',')})`
      }

      const { data: users, error } = await supabase
        .from('users')
          .select(`
          id,
          full_name,
          role,
          company,
          designation,
          graduation_year,
          avatar_url,
          unique_id,
          rise_points,
          verification_status,
          college_id,
          last_seen,
          college:college_id ( short_name )
        `)
        .or(peopleOr)
        .limit(100) // Increase limits for active-sorting cap checks

      if (users && !error) {
        // Sort users by community activity (verified status first, then rise points descending)
        const sortedUsers = [...users].sort((a, b) => {
          const aVerified = a.verification_status === 'verified' ? 1 : 0
          const bVerified = b.verification_status === 'verified' ? 1 : 0
          if (aVerified !== bVerified) return bVerified - aVerified
          return (b.rise_points || 0) - (a.rise_points || 0)
        })

        // Apply a strict 5 seniors preview cap for institution queries during general searches
        const usersToProcess = (searchIntent === 'institution' && filterType === 'all')
          ? sortedUsers.slice(0, 5)
          : sortedUsers

        usersToProcess.forEach((u) => {
          let score = 0
          const nameLower = u.full_name.toLowerCase()
          const similarity = getSimilarity(nameLower, query)

          if (nameLower === query) score += 150
          else if (nameLower.startsWith(query)) score += 80
          else if (nameLower.includes(query)) score += 40
          else if (similarity > 0.65) score += similarity * 90 // Fuzzy similarity match boost

          // Network match: user belongs to matched college
          if (u.college_id && matchedCollegeIds.includes(u.college_id)) {
            if (searchIntent === 'institution') {
              // Exact scoring parameters to rank active seniors below institution info but above discussions
              score += 100
            } else {
              score += 45
            }
          }

          if (u.role === 'senior') score += 20
          if (u.verification_status === 'verified') score += 15
          score += (u.rise_points || 0) * 0.1

          // Search intent modifications
          if (searchIntent === 'person') {
            score += 150 // Highly elevate people matching explicit person intent
          }

          results.push({
            id: u.id,
            type: u.role === 'senior' ? 'senior' : 'student',
            title: u.full_name,
            subtitle: u.role === 'senior'
              ? `${u.designation || 'Senior'} at ${u.company || 'Top Company'}`
              : `Student • Class of ${u.graduation_year || 'N/A'}`,
            metadata: {
              location: (Array.isArray(u.college) ? u.college[0]?.short_name : (u.college as any)?.short_name) || 'Alumni Network',
              graduation_year: u.graduation_year,
              company: u.company,
              designation: u.designation
            },
            description: u.role === 'senior'
              ? `Verified Senior at ${u.company || 'N/A'}. Connect for mentorship, placement guide, and industry referrals.`
              : `Student pursuing studies. Active member of the college networking community.`,
            imageUrl: u.avatar_url,
            href: `/u/${u.unique_id}`,
            score,
            collegeId: u.college_id
          })
        })
      }
    }

    // 2. Search Jobs (Strict Backend Security: is_active = true + Related Network Placements)
    if (filterType === 'all' || filterType === 'jobs') {
      let jobOr = `company_name.ilike.%${query}%,role.ilike.%${query}%,location.ilike.%${query}%,description.ilike.%${query}%`
      matchedCollegeShortNames.forEach(cs => {
        jobOr += `,company_name.ilike.%${cs}%,role.ilike.%${cs}%,description.ilike.%${cs}%`
      })

      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          id,
          company_name,
          role,
          location,
          salary_range,
          job_type,
          description,
          created_at
        `)
        .eq('is_active', true)
        .gte('created_at', twoDaysAgo.toISOString()) // Auto-expire after 2 days
        .or(jobOr)
        .limit(30)

      if (jobs && !error) {
        jobs.forEach((j) => {
          let score = 0
          const roleLower = j.role.toLowerCase()
          const companyLower = j.company_name.toLowerCase()
          const descLower = (j.description || '').toLowerCase()
          const similarity = getSimilarity(roleLower, query)

          if (roleLower.includes(query)) score += 40
          if (companyLower.includes(query)) score += 30
          if (j.location.toLowerCase().includes(query)) score += 10
          if (similarity > 0.65) score += similarity * 80

          // Relationship boost: job tagged with matched college names
          matchedCollegeShortNames.forEach(cs => {
            const csLower = cs.toLowerCase()
            if (roleLower.includes(csLower) || companyLower.includes(csLower) || descLower.includes(csLower)) {
              if (searchIntent === 'institution') {
                score += 65 // Rank jobs contextually below discussions
              } else {
                score += 35
              }
            }
          })

          if (searchIntent === 'job') {
            score += 100
          }

          results.push({
            id: j.id,
            type: 'job',
            title: j.role,
            subtitle: `${j.company_name} • ${j.job_type}`,
            metadata: {
              location: j.location,
              salary_range: j.salary_range,
              posted_date: j.created_at
            },
            description: j.description || 'No description available.',
            imageUrl: null,
            href: '/jobs',
            score
          })
        })
      }
    }

    // 3. Search Communities (Matched display name, description + Related College Communities)
    if (filterType === 'all' || filterType === 'communities') {
      let commOr = `display_name.ilike.%${query}%,description.ilike.%${query}%,slug.ilike.%${query}%`
      matchedCollegeSlugs.forEach(slug => {
        commOr += `,slug.ilike.%${slug}%`
      })

      const { data: communities, error } = await supabase
        .from('communities')
        .select(`
          id,
          display_name,
          slug,
          description,
          member_count,
          college_id,
          colleges ( name, short_name, logo_url )
        `)
        .eq('is_active', true)
        .eq('is_private', false)
        .or(commOr)
        .limit(30)

      if (communities && !error) {
        communities.forEach((c: any) => {
          let score = 25
          const nameLower = c.display_name.toLowerCase()
          const slugLower = c.slug.toLowerCase()
          const similarity = getSimilarity(nameLower, query)

          if (nameLower === query) score += 200 // Higher score for exact matches
          else if (nameLower.startsWith(query)) score += 130
          else if (nameLower.includes(query)) score += 80
          else if (similarity > 0.65) score += similarity * 80

          // Boost if exact matching college community slug
          if (matchedCollegeSlugs.includes(c.slug)) {
            score += 100
          }

          if (searchIntent === 'institution') {
            score += 120 // Boost extremely high for institution matches
          }

          results.push({
            id: c.id,
            type: 'community',
            title: c.display_name,
            subtitle: `c/${c.slug} • Community Hub`,
            metadata: {
              member_count: c.member_count || 0
            },
            description: c.description || 'Active hub for mentorship, jobs, and networking.',
            imageUrl: c.colleges?.logo_url || null,
            href: `/community/c/${c.slug}`,
            score
          })
        })
      }
    }

    // 4. Search Colleges (Matched name, short name)
    if (filterType === 'all' || filterType === 'colleges') {
      const { data: colleges, error } = await supabase
        .from('colleges')
        .select(`
          id,
          name,
          short_name,
          location,
          slug,
          logo_url
        `)
        .or(`name.ilike.%${query}%,short_name.ilike.%${query}%,location.ilike.%${query}%`)
        .limit(20)

      if (colleges && !error) {
        colleges.forEach((col) => {
          let score = 30
          const nameLower = col.name.toLowerCase()
          const shortLower = (col.short_name || '').toLowerCase()
          const similarity = getSimilarity(nameLower, query)
          const shortSimilarity = shortLower ? getSimilarity(shortLower, query) : 0
          const bestSimilarity = Math.max(similarity, shortSimilarity)

          if (col.short_name?.toLowerCase() === query) score += 250 // Max prioritization weight for exact short code
          else if (nameLower === query) score += 220
          else if (nameLower.startsWith(query)) score += 150
          else if (nameLower.includes(query)) score += 100
          else if (bestSimilarity > 0.65) score += bestSimilarity * 110

          if (searchIntent === 'institution') {
            score += 150 // Highly elevate matched college profile to absolute top of result card arrays
          }

          results.push({
            id: col.id,
            type: 'college',
            title: col.name,
            subtitle: col.short_name || 'College',
            metadata: {
              location: col.location
            },
            description: `${col.name} professional community. Connect with alumni and fellow students.`,
            imageUrl: col.logo_url || null,
            href: `/colleges/${col.slug}`,
            score
          })
        })
      }
    }

    // 5. Search Public Groups (Strict Relational Matching + Both groups & student_groups)
    if (filterType === 'all' || filterType === 'groups') {
      let groupOr = `name.ilike.%${query}%,description.ilike.%${query}%,slug.ilike.%${query}%`
      matchedCollegeSlugs.forEach(slug => {
        groupOr += `,slug.ilike.%${slug}%`
      })
      if (matchedCommunityIds.length > 0) {
        groupOr += `,parent_community_id.in.(${matchedCommunityIds.map(id => `"${id}"`).join(',')})`
      }

      const { data: studentGroups, error: sgErr } = await supabase
        .from('student_groups')
        .select(`
          id,
          name,
          slug,
          description,
          member_count,
          college_id,
          parent_community_id,
          colleges ( name, short_name, logo_url, slug ),
          communities ( display_name, slug )
        `)
        .eq('is_active', true)
        .eq('is_private', false)
        .or(groupOr)
        .limit(30)

      if (studentGroups && !sgErr) {
        studentGroups.forEach((g: any) => {
          let score = 20
          const nameLower = g.name.toLowerCase()
          const slugLower = g.slug.toLowerCase()
          const similarity = getSimilarity(nameLower, query)

          // Priority 1: Direct name/slug match
          if (nameLower === query || slugLower === query) score += 180
          else if (nameLower.startsWith(query) || slugLower.startsWith(query)) score += 120
          else if (nameLower.includes(query) || slugLower.includes(query)) score += 70
          else if (similarity > 0.65) score += similarity * 80

          // Priority 2: Community / College Relationship Match
          if (g.college_id && matchedCollegeIds.includes(g.college_id)) {
            score += 80
          }
          if (g.parent_community_id && matchedCommunityIds.includes(g.parent_community_id)) {
            score += 90
          }

          if (searchIntent === 'institution') {
            score += 80
          }

          results.push({
            id: g.id,
            type: 'group',
            title: g.name,
            subtitle: g.colleges?.short_name ? `${g.colleges.short_name} Student Group` : 'Student Group',
            metadata: {
              member_count: g.member_count || 0
            },
            description: g.description || 'Public student, career, or interest group.',
            imageUrl: g.colleges?.logo_url || null,
            href: `/community/c/${g.communities?.slug || 'general'}/group/${g.slug}`,
            score
          })
        })
      }

      // B. Query standard groups
      let gOr = `name.ilike.%${query}%,slug.ilike.%${query}%`
      if (matchedCommunityIds.length > 0) {
        gOr += `,community_id.in.(${matchedCommunityIds.map(id => `"${id}"`).join(',')})`
      }

      const { data: standardGroups, error: gErr } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          slug,
          community_id,
          member_count,
          communities (
            display_name,
            slug,
            college_id,
            colleges ( name, short_name, logo_url, slug )
          )
        `)
        .eq('is_active', true)
        .eq('type', 'public')
        .or(gOr)
        .limit(30)

      if (standardGroups && !gErr) {
        standardGroups.forEach((g: any) => {
          let score = 20
          const nameLower = g.name.toLowerCase()
          const slugLower = g.slug.toLowerCase()
          const similarity = getSimilarity(nameLower, query)

          // Priority 1: Direct name/slug match
          if (nameLower === query || slugLower === query) score += 180
          else if (nameLower.startsWith(query) || slugLower.startsWith(query)) score += 120
          else if (nameLower.includes(query) || slugLower.includes(query)) score += 70
          else if (similarity > 0.65) score += similarity * 80

          // Priority 2: Community / College Relationship Match
          if (g.community_id && matchedCommunityIds.includes(g.community_id)) {
            score += 90
          }
          const collId = g.communities?.college_id
          if (collId && matchedCollegeIds.includes(collId)) {
            score += 80
          }

          if (searchIntent === 'institution') {
            score += 80
          }

          results.push({
            id: g.id,
            type: 'group',
            title: g.name,
            subtitle: g.communities?.colleges?.short_name ? `${g.communities.colleges.short_name} Placement Group` : 'Public Group',
            metadata: {
              member_count: g.member_count || 0
            },
            description: g.description || 'Public study, career, or interest group.',
            imageUrl: null,
            href: `/groups`,
            score
          })
        })
      }
    }

    // 6. Search Discussions/Posts (Strict Backend Security: visibility = public)
    if (filterType === 'all' || filterType === 'posts') {
      let postOr = `title.ilike.%${query}%,content.ilike.%${query}%,type.ilike.%${query}%`

      matchedCollegeShortNames.forEach(cs => {
        postOr += `,title.ilike.%${cs}%,content.ilike.%${cs}%`
      })

      if (matchedCommunityIds.length > 0) {
        postOr += `,community_id.in.(${matchedCommunityIds.map(id => `"${id}"`).join(',')})`
      }

      if (matchedUserIds.length > 0) {
        postOr += `,author_id.in.(${matchedUserIds.map(id => `"${id}"`).join(',')})`
      }

      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          type,
          view_count,
          community_id,
          created_at,
          communities ( slug, display_name ),
          author:author_id ( full_name, avatar_url )
        `)
        .eq('visibility', 'public')
        .or(postOr)
        .limit(30)

      if (posts && !error) {
        posts.forEach((p: any) => {
          let score = 15
          if (p.title.toLowerCase().includes(query)) score += 15

          // Score boost for matched college/institution network posts
          matchedCollegeShortNames.forEach(cs => {
            if (p.title.toLowerCase().includes(cs.toLowerCase()) || (p.content || '').toLowerCase().includes(cs.toLowerCase())) {
              if (searchIntent === 'institution') {
                score += 75
              } else {
                score += 20
              }
            }
          })

          // Score boost if post belongs to matched community query
          if (p.community_id && matchedCommunityIds.includes(p.community_id)) {
            score += 90
          }

          const authorName = p.author?.full_name || 'Community Member'
          const commName = p.communities?.display_name || 'Public Community'
          const commSlug = p.communities?.slug || 'community'
          const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'

          results.push({
            id: p.id,
            type: 'post',
            title: p.title,
            subtitle: `${commName} • Post • ${p.type}`,
            metadata: {
              location: `By ${authorName} on ${dateStr}`,
              views: p.view_count || 0
            },
            description: p.content || '',
            imageUrl: p.author?.avatar_url || null,
            href: commSlug ? `/community/c/${commSlug}/p/${p.id}` : '/community',
            score
          })
        })
      }
    }

    // 7. Search Jobs
    if (filterType === 'all' || filterType === 'jobs') {
      let jobOr = `company_name.ilike.%${query}%,role.ilike.%${query}%,location.ilike.%${query}%`

      if (matchedCommunityIds.length > 0) {
        jobOr += `,community_id.in.(${matchedCommunityIds.map(id => `"${id}"`).join(',')})`
      }
      
      if (matchedUserIds.length > 0) {
        jobOr += `,posted_by.in.(${matchedUserIds.map(id => `"${id}"`).join(',')})`
      }

      const { data: jobs, error: jErr } = await supabase
        .from('jobs')
        .select(`
          id,
          company_name,
          role,
          location,
          salary_range,
          job_type,
          posted_by,
          community_id,
          communities ( slug, display_name ),
          users ( full_name, avatar_url )
        `)
        .eq('is_active', true)
        .or(jobOr)
        .limit(30)

      if (jobs && !jErr) {
        jobs.forEach((j: any) => {
          let score = 25
          const companyLower = j.company_name?.toLowerCase() || ''
          const roleLower = j.role?.toLowerCase() || ''

          if (companyLower === query || roleLower === query) score += 150
          else if (companyLower.includes(query) || roleLower.includes(query)) score += 80

          if (j.community_id && matchedCommunityIds.includes(j.community_id)) {
            score += 90
          }
          if (j.posted_by && matchedUserIds.includes(j.posted_by)) {
            score += 80
          }

          results.push({
            id: j.id,
            type: 'job',
            title: `${j.role} at ${j.company_name}`,
            subtitle: j.communities?.display_name ? `Posted in ${j.communities.display_name}` : 'Job Placement',
            metadata: {
              location: j.location || 'Remote/Anywhere'
            },
            description: `Type: ${j.job_type} | Salary: ${j.salary_range || 'Not disclosed'}`,
            imageUrl: j.users?.avatar_url || null,
            href: `/careers/${j.id}`,
            score
          })
        })
      }
    }

    // Sort results by relevance score descending
    results.sort((a, b) => b.score - a.score)

    // Remove duplicates safely
    const uniqueMap = new Map<string, SearchResult>()
    results.forEach((res) => {
      const key = `${res.type}-${res.id}`
      if (!uniqueMap.has(key) || uniqueMap.get(key)!.score < res.score) {
        uniqueMap.set(key, res)
      }
    })

    const finalResults = Array.from(uniqueMap.values())
    finalResults.sort((a, b) => b.score - a.score)

    // Paginate in memory after sorting
    const paginatedResults = finalResults.slice(offset, offset + limit)

    return NextResponse.json({
      results: paginatedResults,
      total: finalResults.length
    })
  } catch (err: any) {
    console.error('Search API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
