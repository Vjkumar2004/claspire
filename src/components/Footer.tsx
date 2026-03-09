'use client';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 py-12 px-6 overflow-hidden">
      <div className="footer-grid max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
        {/* Column 1 */}
        <div className="md:col-span-2 lg:col-span-1">
          {/* Logo */}
          <div className="font-plus-jakarta-sans font-bold text-lg text-white mb-2">
            Clas<span style={{ color: '#A78BFA' }}>pire</span>
          </div>
          
          {/* Tagline */}
          <div className="text-sm text-gray-500 mb-5">
            Aspire with your class
          </div>
          
          {/* Social Row */}
          <div className="flex gap-2">
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
        <div>
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500 mb-4">
            Product
          </div>
          <div className="space-y-1">
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Community
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Seniors
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Colleges
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Pricing
            </a>
          </div>
        </div>

        {/* Column 3 - Company */}
        <div>
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500 mb-4">
            Company
          </div>
          <div className="space-y-1">
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              About
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Blog
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Careers
            </a>
            <a href="#" className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>

        {/* Column 4 - Legal */}
        <div>
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
      <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-500">
        <div>
          © 2025 Claspire. Made with ❤️ in India
        </div>
        <div className="flex gap-4">
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
