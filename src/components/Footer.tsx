'use client';

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
            <button className="w-9 h-9 bg-gray-800 rounded-lg text-gray-400 text-sm font-normal flex items-center justify-center hover:bg-gray-700 transition-colors">
              Tw
            </button>
            <button className="w-9 h-9 bg-gray-800 rounded-lg text-gray-400 text-sm font-normal flex items-center justify-center hover:bg-gray-700 transition-colors">
              Li
            </button>
            <button className="w-9 h-9 bg-gray-800 rounded-lg text-gray-400 text-sm font-normal flex items-center justify-center hover:bg-gray-700 transition-colors">
              In
            </button>
          </div>
        </div>

        {/* Column 2 - Product */}
        <div className="text-center md:text-left">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-gray-400 mb-3">
            Product
          </div>
          <div className="space-y-1">
            <a href="#" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Community
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Seniors
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Colleges
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Pricing
            </a>
          </div>
        </div>

        {/* Column 3 - Company */}
        <div className="text-center md:text-left">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-gray-400 mb-3">
            Company
          </div>
          <div className="space-y-1">
            <a href="#" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              About
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Blog
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Careers
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors no-underline p-0">
              Contact
            </a>
          </div>
        </div>

        {/* Column 4 - Legal - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block text-left">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500 mb-4">
            Legal
          </div>
          <div className="space-y-1">
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Help Center
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800 mt-8 mb-6"></div>

      {/* Bottom */}
      <div className="max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-gray-500 text-center md:text-left">
        <div>
          © 2025 Claspire. Made with ❤️ in India
        </div>
        <div className="flex gap-4 justify-center md:justify-start">
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
