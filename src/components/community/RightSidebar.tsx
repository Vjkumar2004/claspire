import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import TopContributorsCard from './TopContributorsCard'
import TrendingDiscussionsCard from './TrendingDiscussionsCard'
import CommunityActivityCard from './CommunityActivityCard'

interface RightSidebarProps {
  communities: any[]
  userCommunity: any
  posts: any[]
  todayPosts: number
  todayAnswers: number
  todayReferrals: number
  todaySeniors: number
}

function RightSidebar({ communities, userCommunity, posts, todayPosts, todayAnswers, todayReferrals, todaySeniors }: RightSidebarProps) {
  const router = useRouter()
  const [topContributors, setTopContributors] = useState<any[]>([])
  const [isSticky, setIsSticky] = useState(false)
  const [sidebarRect, setSidebarRect] = useState<DOMRect | null>(null)
  const activityCardRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTopContributors = async () => {
      try {
        const response = await fetch('/api/community/top-contributors')
        const data = await response.json()
        if (data.success) {
          setTopContributors(data.contributors)
        }
      } catch (error) {
        console.error('Failed to fetch top contributors:', error)
      }
    }
    fetchTopContributors()
  }, [])

  // JavaScript-based sticky implementation
  useEffect(() => {
    const updateSidebarRect = () => {
      if (sidebarRef.current) {
        setSidebarRect(sidebarRef.current.getBoundingClientRect())
      }
    }

    const handleScroll = () => {
      if (!activityCardRef.current) return

      const card = activityCardRef.current
      const cardRect = card.getBoundingClientRect()
      const navbarOffset = 112 // top-28 = 7 * 16px = 112px

      // Check if the card has reached the navbar area
      if (cardRect.top <= navbarOffset) {
        setIsSticky(true)
      } else {
        setIsSticky(false)
      }
    }

    // Initial measurements
    updateSidebarRect()
    handleScroll()

    // Update on resize
    window.addEventListener('resize', updateSidebarRect)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', updateSidebarRect)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <aside ref={sidebarRef} className="lg:col-span-3 hidden lg:block">
      {/* Normal scrolling section */}
      <div className="space-y-4">
        {/* Top communities leader board */}
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Campus Leaders
            </h4>
          </div>

          <div className="p-1.5 space-y-0.5">
            {communities.slice(0, 4).map((c: any) => (
              <div
                key={c.id}
                onClick={() => router.push(`/community/c/${c.slug}`)}
                className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="w-7 h-7 rounded bg-purple-50 border border-slate-100 flex items-center justify-center font-bold text-[#7C3AED] overflow-hidden text-[10px] flex-shrink-0">
                  {c.colleges?.logo_url ? (
                    <img src={c.colleges.logo_url} alt={c.colleges?.short_name || c.slug} className="w-full h-full object-contain" />
                  ) : (
                    c.colleges?.short_name?.[0] || 'C'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-xs text-slate-800 truncate">c/{c.slug}</h5>
                  <p className="text-[9px] text-slate-400 font-semibold">{c.member_count || 0} members</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/colleges')}
            className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold text-center border-t border-slate-100 transition-colors cursor-pointer block"
          >
            Explore Campuses ↗
          </button>
        </div>

        {/* Top Contributors - scrolls normally */}
        <TopContributorsCard contributors={topContributors} />

        {/* Trending Discussions - scrolls normally */}
        <TrendingDiscussionsCard posts={posts} />
      </div>

      {/* Sticky section - only Community Activity */}
      <div className="mt-4">
        {/* Placeholder to maintain space when card is fixed */}
        <div ref={activityCardRef} className={isSticky ? 'invisible' : ''}>
          <CommunityActivityCard
            todayPosts={todayPosts}
            todayAnswers={todayAnswers}
            todayReferrals={todayReferrals}
            todaySeniors={todaySeniors}
            totalCommunities={communities.length}
            totalMembers={communities.reduce((acc: number, c: any) => acc + (c.member_count || 0), 0)}
            totalDiscussions={posts.filter((p: any) => p.type === 'discussion').length}
          />
        </div>

        {/* Fixed card that appears when scrolling */}
        {isSticky && sidebarRect && (
          <div
            className="fixed top-[112px] z-10"
            style={{
              left: `${sidebarRect.left}px`,
              width: `${sidebarRect.width}px`,
            }}
          >
            <CommunityActivityCard
              todayPosts={todayPosts}
              todayAnswers={todayAnswers}
              todayReferrals={todayReferrals}
              todaySeniors={todaySeniors}
              totalCommunities={communities.length}
              totalMembers={communities.reduce((acc: number, c: any) => acc + (c.member_count || 0), 0)}
              totalDiscussions={posts.filter((p: any) => p.type === 'discussion').length}
            />
          </div>
        )}
      </div>
    </aside>
  )
}

export default React.memo(RightSidebar)
