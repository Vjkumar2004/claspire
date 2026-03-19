'use client';

import { useRouter } from 'next/navigation';

export default function Footer() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

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
            <button 
              onClick={() => handleExternalLink('https://twitter.com/claspire')}
              className="w-9 h-9 bg-gray-800 rounded-lg text-gray-400 text-sm font-normal flex items-center justify-center hover:bg-gray-700 transition-colors"
              title="Twitter"
            >
              Tw
            </button>
            <button 
              onClick={() => handleExternalLink('https://linkedin.com/company/claspire')}
              className="w-9 h-9 bg-gray-800 rounded-lg text-gray-400 text-sm font-normal flex items-center justify-center hover:bg-gray-700 transition-colors"
              title="LinkedIn"
            >
              Li
            </button>
            <button 
              onClick={() => handleExternalLink('https://instagram.com/claspire')}
              className="w-9 h-9 bg-gray-800 rounded-lg text-gray-400 text-sm font-normal flex items-center justify-center hover:bg-gray-700 transition-colors"
              title="Instagram"
            >
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
            <button 
              onClick={() => handleNavigation('/community')}
              className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              Community
            </button>
            <button 
              onClick={() => handleNavigation('/seniors')}
              className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              Seniors
            </button>
            <button 
              onClick={() => handleNavigation('/colleges')}
              className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              Colleges
            </button>
            <button 
              onClick={() => handleNavigation('/jobs')}
              className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              Jobs
            </button>
          </div>
        </div>

        {/* Column 3 - Company */}
        <div className="text-center md:text-left">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-gray-400 mb-3">
            Company
          </div>
          <div className="space-y-1">
            <button 
              onClick={() => handleNavigation('/about')}
              className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              About
            </button>
            <button 
              onClick={() => handleExternalLink('https://blog.claspire.in')}
              className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              Blog
            </button>
            <button 
              onClick={() => handleNavigation('/careers')}
              className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              Careers
            </button>
            <button 
              onClick={() => handleNavigation('/contact')}
              className="block text-sm text-gray-400 leading-8 hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>

        {/* Column 4 - Legal - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block text-left">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500 mb-4">
            Legal
          </div>
          <div className="space-y-1">
            <button 
              onClick={() => handleNavigation('/privacy')}
              className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => handleNavigation('/terms')}
              className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              Terms
            </button>
            <button 
              onClick={() => handleNavigation('/help')}
              className="block text-sm text-gray-400 leading-[2.2] hover:text-white transition-colors text-left w-full bg-transparent border-none cursor-pointer"
            >
              Help Center
            </button>
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
          <button 
            onClick={() => handleNavigation('/privacy')}
            className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-gray-500"
          >
            Privacy
          </button>
          <button 
            onClick={() => handleNavigation('/terms')}
            className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-gray-500"
          >
            Terms
          </button>
        </div>
      </div>
    </footer>
  );
}
