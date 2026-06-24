'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HelpCenterPage() {
  const [openItem, setOpenItem] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I join my college community?",
      answer: "Sign up with your college email. Your community is auto-assigned based on your college."
    },
    {
      question: "How do seniors get verified?",
      answer: "Seniors verify via their work email OTP during signup."
    },
    {
      question: "What are Rise Points?",
      answer: "Rise Points are earned by helping others — answering doubts, sharing experiences, and posting resources."
    },
    {
      question: "How do I report a post or user?",
      answer: "Use the report button on any post or profile. Our team reviews within 24 hours."
    },
    {
      question: "Is Claspire free to use?",
      answer: "Yes! Core features are free. Premium features coming soon."
    }
  ];

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-gray-400">
            Find answers to common questions about Claspire.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4 mb-12">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-800">
              <button
                onClick={() => setOpenItem(openItem === index ? null : index)}
                className="w-full py-4 text-left flex items-center justify-between hover:text-[#0A66C2] transition-colors"
              >
                <span className="font-semibold">{faq.question}</span>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transform transition-transform ${openItem === index ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {openItem === index && (
                <div className="pb-4">
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="text-center">
          <p className="text-gray-400">
            Still need help? Email{" "}
            <a 
              href="mailto:support@claspire.in" 
              className="text-[#0A66C2] hover:text-[#0A66C2]/60 transition-colors"
            >
              support@claspire.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
