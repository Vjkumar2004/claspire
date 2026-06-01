import { getAllPosts } from '@/lib/blog'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Claspire — College Senior Community Platform',
  description: 'Tips, guides and insights for Indian college students — referrals, placements, mentorship and more from the Claspire team.',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Blog Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-4 bg-[#7C3AED] rounded-full"></div>
            <p className="text-sm font-semibold text-[#7C3AED] uppercase tracking-widest m-0">Claspire Blog</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
            Guides for Indian College Students
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-2xl">
            Real advice from real seniors — placement strategies, referral tips, interview prep, and everything Indian college students need to land their first job. No fluff, just actionable guidance.
          </p>

          {/* Topic Tags */}
          <div className="flex flex-wrap gap-2 mt-6">
            {['Placements', 'Referrals', 'Interview Prep', 'Career Guidance', 'Mentorship'].map(topic => (
              <span key={topic} className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200">
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Articles coming soon</h2>
            <p className="text-gray-400">We&apos;re working on our first guides. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group no-underline">
                <div className="bg-white border border-gray-100 rounded-2xl p-8 hover:border-purple-200 hover:shadow-md transition-all duration-200">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-sm text-gray-400">{new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-400">{post.author}</span>
                    {post.tags.slice(0,2).map(tag => (
                      <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#7C3AED] transition-colors mb-2">{post.title}</h2>
                  <p className="text-gray-500 leading-relaxed text-[15px]">{post.description}</p>
                  <span className="inline-block mt-4 text-sm text-[#7C3AED] font-semibold group-hover:translate-x-1 transition-transform">
                    Read article →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
