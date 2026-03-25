import Link from 'next/link';

export default function AboutPage() {
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

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            We're building the community college students deserve
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Claspire connects students with seniors from their own college — for real guidance, real referrals, and real community.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Our Mission</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-800 rounded-xl p-5">
              <div className="text-2xl mb-3">🎓</div>
              <h3 className="font-semibold mb-2">Bridge the Gap</h3>
              <p className="text-gray-400 text-sm">
                Seniors who've walked the same halls, struggled with the same subjects, cracked the same placements.
              </p>
            </div>
            <div className="border border-gray-800 rounded-xl p-5">
              <div className="text-2xl mb-3">🤝</div>
              <h3 className="font-semibold mb-2">Real Connections</h3>
              <p className="text-gray-400 text-sm">
                Not LinkedIn cold messages. Direct access to seniors from your own college community.
              </p>
            </div>
            <div className="border border-gray-800 rounded-xl p-5">
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="font-semibold mb-2">Grow Together</h3>
              <p className="text-gray-400 text-sm">
                From doubt resolution to referral hunts — everything a college student needs, in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Built by students, for students</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            We're a small team passionate about fixing how college students get guidance in India.
          </p>
        </div>
      </div>
    </div>
  );
}
