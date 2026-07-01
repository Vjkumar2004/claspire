'use client'

import { useQuery } from '@tanstack/react-query'

interface CollegeStatsProps {
  slug: string
  initialMemberCount?: number
  initialSeniorCount?: number
  initialDoubtCount?: number
}

export default function CollegeStats({
  slug,
  initialMemberCount = 0,
  initialSeniorCount = 0,
  initialDoubtCount = 0,
}: CollegeStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['college-stats', slug],
    queryFn: async () => {
      const res = await fetch(`/api/colleges/${slug}/stats`)
      const json = await res.json()
      if (json.error) throw new Error('Failed to fetch college stats')
      return json
    },
    staleTime: 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const memberCount = stats?.member_count ?? initialMemberCount
  const seniorCount = stats?.senior_count ?? initialSeniorCount
  const doubtCount = stats?.doubt_count ?? initialDoubtCount

  return (
    <>
      {memberCount}
      {seniorCount}
      {doubtCount}
    </>
  )
}
