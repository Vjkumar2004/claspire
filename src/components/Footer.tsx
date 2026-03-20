'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 overflow-hidden">
      {/* Main Grid */}
      <div className="footer-grid max-w-[1100px] mx-auto px-6 py-10 md:py-12 grid grid-cols-2 gap-8 md:gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
        {/* Logo Section - Full width on mobile */}
        <div className="col-span-2 md:col-span-2 lg:col-span-1 text-center md:text-left mb-2 md:mb-0">
          {/* Logo */}
          <div className="font-plus-jakarta-sans font-bold text-lg text-white mb-2">
            Clas<span style={{ color: '#A78BFA' }}>pire</span>
          </div>
          
          {/* Tagline */}
          <div className="text-sm text-gray-500 mb-5">
            Aspire with your class
          </div>
          
          {/* Social Row */}
          <div className="flex gap-2 justify-center md:justify-start">
            <a href="https://x.com/claspire" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-lg text-gray-400 flex items-center justify-center hover:bg-gray-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://linkedin.com/company/claspire" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-lg text-gray-400 flex items-center justify-center hover:bg-gray-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://instagram.com/claspire" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-lg text-gray-400 flex items-center justify-center hover:bg-gray-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2 - Product */}
        <div className="text-center md:text-left">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-gray-400 mb-3">
            Product
          </div>
          <div className="space-y-1">
            <Link href="/communities" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Community
            </Link>
            <Link href="/seniors" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Seniors
            </Link>
            <Link href="/colleges" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Colleges
            </Link>
            <Link href="/pricing" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Pricing
            </Link>
          </div>
        </div>

        {/* Column 3 - Company */}
        <div className="text-center md:text-left">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-gray-400 mb-3">
            Company
          </div>
          <div className="space-y-1">
            <Link href="/about" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              About
            </Link>
            <Link href="/blog" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Blog
            </Link>
            <Link href="/careers" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Careers
            </Link>
            <Link href="/contact" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Contact
            </Link>
          </div>
        </div>

        {/* Column 4 - Legal - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block text-left">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500 mb-4">
            Legal
          </div>
          <div className="space-y-1">
            <Link href="/privacy-policy" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/help-center" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800 mt-8 mb-6"></div>

      {/* Bottom */}
      <div className="max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-gray-500 text-center md:text-left">
        <div>
          © 2026 Claspire. Made with ❤️ in India
        </div>
        <div className="flex gap-4 justify-center md:justify-start">
          <Link href="/privacy-policy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
