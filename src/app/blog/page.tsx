import Link from 'next/link';

export default function BlogPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        {/* Back to Home */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Claspire Blog</h1>
          <p className="text-xl text-gray-400">
            Stories, updates, and insights from the team.
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gray-900 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
          <p className="text-gray-400 mb-6">
            We're working on our first posts. Stay tuned!
          </p>
          <div className="text-gray-400">
            Follow us on X:{" "}
            <a 
              href="https://x.com/claspire" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              @claspire
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
