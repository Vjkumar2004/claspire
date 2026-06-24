import React from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, TrendingUp } from 'lucide-react'

interface Post {
  id: string
  title: string | null
  answer_count: number
  upvote_count: number
  communities: {
    slug: string
  } | null
}

interface TrendingDiscussionsCardProps {
  posts: Post[]
}

function TrendingDiscussionsCard({ posts }: TrendingDiscussionsCardProps) {
  const router = useRouter()

  // Filter for discussion posts and sort by engagement (answers + upvotes)
  const trendingDiscussions = posts
    .filter((p: any) => p.type === 'discussion')
    .sort((a, b) => (b.answer_count + b.upvote_count) - (a.answer_count + a.upvote_count))
    .slice(0, 5)

  const handleClick = (post: Post) => {
    if (post.communities?.slug) {
      router.push(`/community/c/${post.communities.slug}/p/${post.id}`)
    }
  }

  return (
    <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] overflow-hidden shadow-sm">
      <div className="p-3.5 border-b border-surface dark:border-[#38434F] flex items-center justify-between">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#F4A01C]" />
          Trending Discussions
        </h4>
      </div>

      <div className="p-1.5 space-y-0.5">
        {trendingDiscussions.length > 0 ? (
          trendingDiscussions.map((post) => (
            <div
              key={post.id}
              onClick={() => handleClick(post)}
              className="flex items-start gap-2.5 p-2 rounded hover:bg-app dark:hover:bg-[#1D2226] cursor-pointer transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#F4A01C] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-xs text-slate-800 dark:text-white line-clamp-2 leading-tight">
                  {post.title || 'Untitled Discussion'}
                </h5>
                <p className="text-[9px] text-slate-400 dark:text-[#B0B7BE] font-semibold mt-0.5 flex items-center gap-1">
                  {post.answer_count} {post.answer_count === 1 ? 'answer' : 'answers'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400 dark:text-[#B0B7BE] text-[10px] text-center py-3">No discussions yet</p>
        )}
      </div>
    </div>
  )
}

export default React.memo(TrendingDiscussionsCard)
