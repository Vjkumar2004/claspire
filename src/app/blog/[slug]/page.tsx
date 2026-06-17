import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} | Claspire Blog`,
    description: post.description,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-purple-600 mb-12 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
          Back to Blog
        </Link>
        
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm text-gray-400">{new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-400">{post.author}</span>
            {post.tags.slice(0,3).map(tag => (
              <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">{post.title}</h1>
          <p className="text-lg text-gray-500 leading-relaxed">{post.description}</p>
        </div>

        <div className="border-t border-surface pt-10">
          <div className="prose prose-lg prose-gray max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-li:text-gray-600">
            <MDXRemote source={post.content} />
          </div>
        </div>

        <div className="mt-16 p-8 bg-purple-50 rounded-2xl border border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to connect with seniors from your college?</h3>
          <p className="text-gray-600 mb-4">Join Claspire — India&apos;s college senior-student community platform.</p>
          <Link href="https://claspire.in" className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors">
            Join Claspire Free →
          </Link>
        </div>
      </div>
    </div>
  )
}
