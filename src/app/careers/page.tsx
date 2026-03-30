import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://claspire.in/careers",
  },
}

export default function CareersPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join the Claspire team</h1>
          <p className="text-xl text-gray-400">
            We're early stage and growing. If you're passionate about building for India's college students, let's talk.
          </p>
        </div>

        {/* Banner */}
        <div className="bg-gray-900 rounded-xl p-8 text-center mb-12">
          <h2 className="text-xl font-semibold mb-4">
            No open roles right now — but we're always looking for passionate people.
          </h2>
          <a 
            href="mailto:careers@claspire.in"
            className="inline-flex items-center gap-2 border border-purple-400 text-purple-400 px-6 py-3 rounded-lg hover:bg-purple-400 hover:text-black transition-colors"
          >
            Send us your profile →
          </a>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-2xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-800 rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-2">Builder mindset</h3>
              <p className="text-gray-400 text-sm">
                We build, ship, and iterate. We're not afraid to get our hands dirty.
              </p>
            </div>
            <div className="border border-gray-800 rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-2">Student-first thinking</h3>
              <p className="text-gray-400 text-sm">
                Every decision starts with "how does this help college students?"
              </p>
            </div>
            <div className="border border-gray-800 rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-2">Ownership over salary</h3>
              <p className="text-gray-400 text-sm">
                We take responsibility for our work and care deeply about the outcome.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
