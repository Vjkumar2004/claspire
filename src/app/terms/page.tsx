import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Claspire",
  description: "Claspire's terms of service govern your use of our college senior community platform. By using Claspire, you agree to these terms.",
  alternates: {
    canonical: "https://claspire.in/terms",
  },
  openGraph: {
    title: "Terms of Service | Claspire",
    description: "Terms governing your use of the Claspire platform.",
    url: "https://claspire.in/terms",
    type: "website",
  },
}

export default function TermsPage() {
  return (
    <div className="bg-white dark:bg-[#1D2226] text-black dark:text-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        {/* Back to Home */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 dark:text-[#B0B7BE] hover:text-black dark:hover:text-white transition-colors mb-8"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-600 dark:text-[#B0B7BE]">Last updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              By accessing and using Claspire, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">2. Eligibility</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              Claspire is intended for college students and verified seniors only. By using our service, you represent and warrant that you are a current college student or a verified senior from a recognized educational institution. You must provide accurate information during registration and verification.
            </p>
          </section>

          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">3. User Conduct</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              You agree not to use the service to: (a) harass, abuse, or harm other users; (b) post spam, misleading information, or inappropriate content; (c) violate any applicable laws or regulations; (d) impersonate any person or entity; (e) share false or defamatory information about colleges, companies, or individuals.
            </p>
          </section>

          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">4. Content Ownership</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              You retain ownership of all content you post on Claspire. By posting content, you grant us a license to use, modify, and display your content for the purpose of operating and improving our service. You are responsible for the content you post and ensure it does not violate any rights of third parties.
            </p>
          </section>

          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">5. Account Termination</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms or engage in harmful behavior. We may also remove content that violates our community guidelines. You can terminate your account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">6. Contact</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:{" "}
              <a href="mailto:claspire.community@gmail.com" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                claspire.community@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
