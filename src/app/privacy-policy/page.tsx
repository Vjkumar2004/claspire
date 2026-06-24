import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Claspire",
  description: "Claspire's privacy policy explains how we collect, use, and protect your personal information when you use our college community platform.",
  alternates: {
    canonical: "https://claspire.in/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | Claspire",
    description: "How Claspire collects, uses, and protects your personal information.",
    url: "https://claspire.in/privacy-policy",
    type: "website",
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-surface dark:bg-[#1D2226] text-black dark:text-white min-h-screen">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-[#B0B7BE]">Last updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">1. Information We Collect</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              We collect information you provide directly to us, such as when you create an account, update your profile, or contact us. This includes your email address, college information, academic details, and any other information you choose to provide. We also collect usage data about how you interact with our platform.
            </p>
          </section>

          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">2. How We Use Your Information</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and promotional offers. We also use this information to personalize your experience and develop new features.
            </p>
          </section>

          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">3. Data Storage</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              Your data is securely stored on Supabase servers located in the Mumbai region, India. We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">4. Cookies</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">5. Third Party Services</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              We use third-party services to help us operate our service, including Cloudflare for security and performance, and OneSignal for push notifications. These services have access to your personal information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-black dark:text-white font-semibold mb-2 text-xl">6. Contact</h2>
            <p className="text-gray-600 dark:text-[#B0B7BE] leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:claspire.community@gmail.com" className="text-[#0A66C2] hover:text-[#0A66C2] transition-colors">
                claspire.community@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
