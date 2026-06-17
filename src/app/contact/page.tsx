import Link from 'next/link';
import type { Metadata } from "next";
import { Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: "Contact Us | Claspire",
  description: "Get in touch with the Claspire team. Reach out for support, partnerships, press inquiries, or general questions.",
  alternates: {
    canonical: "https://claspire.in/contact",
  },
  openGraph: {
    title: "Contact Us | Claspire",
    description: "Get in touch with the Claspire team.",
    url: "https://claspire.in/contact",
    type: "website",
  },
}

export default function ContactPage() {
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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in touch</h1>
          <p className="text-xl text-gray-600 dark:text-[#B0B7BE]">
            Have a question, feedback, or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border border-surface dark:border-[#38434F] rounded-xl p-6 bg-app dark:bg-[#1D2226]">
            <div className="mb-3 text-purple-600"><Mail size={28} /></div>
            <h3 className="font-semibold mb-2 text-lg">Email Us</h3>
            <a 
              href="mailto:claspire.community@gmail.com" 
              className="text-purple-600 hover:text-purple-800 font-medium transition-colors break-all"
            >
              claspire.community@gmail.com
            </a>
          </div>
          <div className="border border-surface dark:border-[#38434F] rounded-xl p-6 bg-app dark:bg-[#1D2226]">
            <div className="mb-3 text-purple-600"><Phone size={28} /></div>
            <h3 className="font-semibold mb-2 text-lg">Call Us</h3>
            <a 
              href="tel:+919092322803" 
              className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
            >
              +91 9092322803
            </a>
          </div>
        </div>

        {/* College Partnerships */}
        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-[#B0B7BE]">
            For college partnership requests, email:{" "}
            <a 
              href="mailto:colleges@claspire.in" 
              className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
            >
              colleges@claspire.in
            </a>
          </p>
        </div>

        {/* Response Time */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-[#B0B7BE]">
            We typically respond within 24–48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
