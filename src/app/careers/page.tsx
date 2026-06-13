import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers at Claspire — Join Our Team",
  description: "Join the Claspire team and help build India's largest college senior community platform. We're hiring for engineering, design, and community roles.",
  alternates: {
    canonical: "https://claspire.in/careers",
  },
  openGraph: {
    title: "Careers at Claspire — Join Our Team",
    description: "Help build India's college senior community platform. We're hiring!",
    url: "https://claspire.in/careers",
    type: "website",
  },
}

export default function CareersPage() {
  return (
    <div className="bg-white text-black min-h-screen">
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        {/* Back to Home */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-8"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join the Claspire team</h1>
          <p className="text-xl text-gray-600">
            We're early stage and growing. If you're passionate about building for India's college students, let's talk.
          </p>
        </div>

        {/* Banner */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center mb-12">
          <h2 className="text-xl font-semibold mb-4 text-black">
            No open roles right now — but we're always looking for passionate people.
          </h2>
          <a 
            href="mailto:careers@claspire.in"
            className="inline-flex items-center gap-2 border border-purple-600 text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-600 hover:text-white transition-colors font-medium"
          >
            Send us your profile →
          </a>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-2xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl p-6 text-center bg-gray-50">
              <h3 className="font-semibold mb-2 text-lg">Builder mindset</h3>
              <p className="text-gray-600 text-sm">
                We build, ship, and iterate. We're not afraid to get our hands dirty.
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6 text-center bg-gray-50">
              <h3 className="font-semibold mb-2 text-lg">Student-first thinking</h3>
              <p className="text-gray-600 text-sm">
                Every decision starts with "how does this help college students?"
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6 text-center bg-gray-50">
              <h3 className="font-semibold mb-2 text-lg">Ownership over salary</h3>
              <p className="text-gray-600 text-sm">
                We take responsibility for our work and care deeply about the outcome.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
