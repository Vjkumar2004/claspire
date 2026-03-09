'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-14 z-[999] bg-white/97 border-b border-gray-200 backdrop-blur-[8px]">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo */}
          <a href="/" className="font-plus-jakarta-sans font-bold text-lg text-black no-underline hover:no-underline">
            Clas<span style={{ color: '#7C3AED' }}>pire</span>
          </a>

          {/* Desktop Center Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/community" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Community
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Seniors
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Jobs
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Colleges
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Pricing
            </a>
          </div>

          {/* Desktop Right Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Sign in
            </button>
            <button 
              className="bg-[#7C3AED] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
              style={{ backgroundColor: '#7C3AED' }}
            >
              Join free
            </button>
          </div>

          {/* Mobile Right */}
          <div className="md:hidden flex items-center gap-3">
            <button 
              className="bg-[#7C3AED] text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#7C3AED' }}
            >
              Join free
            </button>
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="text-xl font-normal text-black p-1"
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[998] md:hidden"
          >
            <div className="flex flex-col gap-2 px-6 pt-20 pb-10">
              <a 
                href="/community"
                className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community
              </a>
              <a 
                href="#" 
                className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Seniors
              </a>
              <a 
                href="#" 
                className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jobs
              </a>
              <a 
                href="#" 
                className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Colleges
              </a>
              <a 
                href="#" 
                className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              
              <button 
                className="w-full bg-[#7C3AED] text-white py-3 rounded-lg text-sm font-semibold mt-4"
                style={{ backgroundColor: '#7C3AED' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Join free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
