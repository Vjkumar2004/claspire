import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Claspire — India's College Senior Community Platform",
  description: "Claspire connects college students with verified seniors from their own college for placement guidance, job referrals, and mentorship. Built by students, for students.",
  alternates: {
    canonical: "https://claspire.in/about",
  },
  openGraph: {
    title: "About Claspire — College Senior Community Platform",
    description: "Built by students, for students. Connect with verified seniors from your college.",
    url: "https://claspire.in/about",
    type: "website",
  },
}

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-[#1D2226] text-gray-900 dark:text-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        {/* Back to Home */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-500 dark:text-[#B0B7BE] hover:text-purple-600 font-medium transition-colors mb-8"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
          Back to Home
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-gray-900 dark:text-white">
            We're building the community college students deserve
          </h1>
          <p className="text-xl text-gray-600 dark:text-[#B0B7BE] max-w-2xl mx-auto leading-relaxed">
            Claspire connects students with seniors from their own college — for real guidance, real referrals, and real community.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Bridging the Gap Between Students & College Seniors in India</h2>
          <div className="bg-white dark:bg-[#283036] p-8 rounded-2xl border border-gray-200 dark:border-[#38434F] shadow-sm text-center">
            <p className="text-lg text-gray-700 dark:text-[#B0B7BE] leading-relaxed max-w-4xl mx-auto font-medium">
              India has over 4,000 engineering colleges — but most students navigate placements, backlogs, and career choices completely alone. Claspire is a college senior-student community platform where juniors connect directly with verified seniors from their own campus. Whether you're from a college in Tamil Nadu, Maharashtra, Karnataka, or anywhere across India — real guidance from someone who's been in your exact shoes is just one message away.
            </p>
          </div>
        </div>

        {/* Vision Section */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-purple-50 to-cyan-50 rounded-3xl p-10 border border-purple-100 text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Our Vision</h2>
            <p className="text-lg text-gray-700 dark:text-[#B0B7BE] leading-relaxed max-w-3xl mx-auto font-medium">
              To create a world where every college student in India has direct access to genuine guidance 
              from someone who's been in their shoes — transforming career uncertainty into confidence, 
              one connection at a time.
            </p>
          </div>
        </div>

        {/* Why Join Us Section (Replacing Founder Section) */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Why Students Use This College Senior Mentorship Platform</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#283036] p-8 rounded-2xl border border-gray-200 dark:border-[#38434F] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl mb-5">
                🎯
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Verified Alumni Network</h3>
              <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
                Connect only with verified alumni and seniors from your own college. No fake profiles, just authentic guidance from people who have walked your path from colleges across Tamil Nadu, Maharashtra, Karnataka, Delhi and every state in India.
              </p>
            </div>
            <div className="bg-white dark:bg-[#283036] p-8 rounded-2xl border border-gray-200 dark:border-[#38434F] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-2xl mb-5">
                💼
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Direct Referrals</h3>
              <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
                Skip the cold emailing process. Get direct job and internship referrals from seniors working in top tech companies and exciting startups, trusted by students from 500+ Indian engineering and arts colleges.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">How Our Campus Peer Network Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-[#1D2226] rounded-2xl p-6 border border-gray-100 dark:border-[#38434F]">
              <h3 className="font-bold text-lg mb-3 text-purple-600">Authenticity</h3>
              <p className="text-gray-600 dark:text-[#B0B7BE] text-sm leading-relaxed">
                Real experiences from real students. No sugar-coated advice, just genuine guidance.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#1D2226] rounded-2xl p-6 border border-gray-100 dark:border-[#38434F]">
              <h3 className="font-bold text-lg mb-3 text-purple-600">Accessibility</h3>
              <p className="text-gray-600 dark:text-[#B0B7BE] text-sm leading-relaxed">
                Quality guidance shouldn't be a luxury. We're making it accessible to every student.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#1D2226] rounded-2xl p-6 border border-gray-100 dark:border-[#38434F]">
              <h3 className="font-bold text-lg mb-3 text-purple-600">Community</h3>
              <p className="text-gray-600 dark:text-[#B0B7BE] text-sm leading-relaxed">
                Building supportive ecosystems where students help each other grow.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#1D2226] rounded-2xl p-6 border border-gray-100 dark:border-[#38434F]">
              <h3 className="font-bold text-lg mb-3 text-purple-600">Impact</h3>
              <p className="text-gray-600 dark:text-[#B0B7BE] text-sm leading-relaxed">
                Every connection made, every doubt resolved, every referral secured — that's our success metric.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center bg-gray-900 text-white rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">A College Community Platform Built for Indian Students</h2>
          <p className="text-gray-300 max-w-xl mx-auto text-lg">
            We're a passionate team dedicated to fixing how college students get guidance in India.
          </p>
        </div>
      </div>
    </div>
  );
}
