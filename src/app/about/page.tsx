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

        {/* Vision Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Our Vision</h2>
          <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 rounded-xl p-8 border border-gray-800">
            <p className="text-lg text-gray-300 leading-relaxed text-center">
              To create a world where every college student in India has direct access to genuine guidance 
              from someone who's been in their shoes — transforming career uncertainty into confidence, 
              one connection at a time.
            </p>
          </div>
        </div>

        {/* Founder Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Founder</h2>
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-purple-600">
                <img 
                  src="/profile_pic.jpeg" 
                  alt="Vijayakumar M" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold mb-2">Vijayakumar M</h3>
              <p className="text-purple-400 mb-4">Founder & CEO</p>
              <p className="text-gray-300 leading-relaxed mb-6">
                A passionate developer and entrepreneur who experienced firsthand the struggles of 
                navigating college life without proper guidance. After seeing countless juniors face 
                the same challenges — from placement confusion to lack of real industry insights — 
                Vijayakumar set out to build Claspire.
              </p>
              <p className="text-gray-300 leading-relaxed">
                "Every student deserves access to someone who's walked their path. Claspire isn't just 
                a platform; it's a mission to democratize guidance and opportunities across every college 
                in India."
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-3 text-purple-400">Authenticity</h3>
              <p className="text-gray-400 text-sm">
                Real experiences from real students. No sugar-coated advice, just genuine guidance.
              </p>
            </div>
            <div className="border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-3 text-purple-400">Accessibility</h3>
              <p className="text-gray-400 text-sm">
                Quality guidance shouldn't be a luxury. We're making it accessible to every student.
              </p>
            </div>
            <div className="border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-3 text-purple-400">Community</h3>
              <p className="text-gray-400 text-sm">
                Building supportive ecosystems where students help each other grow.
              </p>
            </div>
            <div className="border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-3 text-purple-400">Impact</h3>
              <p className="text-gray-400 text-sm">
                Every connection made, every doubt resolved, every referral secured — that's our success metric.
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
