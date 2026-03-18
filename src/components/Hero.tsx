'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Hero() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 }
  };

  const feedVariants = {
    hidden: { opacity: 0, x: 24 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.6,
        delay: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const feedItemVariants = {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <section className="bg-white pt-14 overflow-hidden min-h-[100dvh] flex flex-col justify-center lg:justify-start lg:min-h-0">
      <div className="container py-8 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7" ref={ref}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="py-12 lg:py-20 px-4 lg:px-0"
            >
              {/* Top Label */}
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-[#F3F0FF] border border-[#DDD6FE] rounded-md px-3 py-1.5 text-xs font-bold text-[#7C3AED] tracking-widest uppercase lg:inline-flex">
                INDIA'S COLLEGE SENIOR NETWORK
              </motion.div>

              {/* H1 */}
              <motion.h1 variants={itemVariants} className="font-instrument-serif font-normal text-[clamp(40px,5vw,72px)] leading-[1.05] text-black mt-5 mb-0 text-center lg:text-left">
                Your senior knows<br />
                the exact path.<br />
                <em className="text-[#7C3AED]">You just need to ask.</em>
              </motion.h1>

              {/* Subtext */}
              <motion.p variants={itemVariants} className="text-base font-normal text-gray-600 leading-relaxed max-w-[460px] mt-5 mb-0 text-center lg:text-left mx-auto lg:mx-0">
                Connect with verified seniors from your own college. Real answers to real questions — placements, referrals, career paths.
              </motion.p>

              {/* Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
                <a href="/colleges" className="no-underline">
                <button className="bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold border-none cursor-pointer hover:bg-gray-800 transition-colors w-full sm:w-auto">
                  Find your college →
                </button>
              </a>
                <button 
                  onClick={() => {
                    const element = document.getElementById('the-process');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white border-[1.5px] border-gray-200 text-gray-700 px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer hover:border-gray-400 transition-colors w-full sm:w-auto"
                >
                  See how it works
                </button>
              </motion.div>

              {/* Social Proof */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3 mt-8">
                {/* Avatars */}
                <div className="flex">
                  <div className="w-8 h-8 rounded-full bg-[#7C3AED] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" style={{ marginLeft: '0' }}>
                    AK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#06B6D4] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" style={{ marginLeft: '-8px' }}>
                    RS
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F59E0B] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" style={{ marginLeft: '-8px' }}>
                    MP
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" style={{ marginLeft: '-8px' }}>
                    SK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#EF4444] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" style={{ marginLeft: '-8px' }}>
                    PT
                  </div>
                </div>
                
                {/* Text */}
                <span className="text-sm text-gray-500 text-center sm:text-left">
                  <strong className="text-black">2,400+ students</strong> already connected this month
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Content - Live Feed Preview */}
          <div className="lg:col-span-5 hidden lg:block">
            <motion.div
              variants={feedVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="py-12 pl-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-gray-400">
                  LIVE FROM SRM CHENNAI
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  <span className="text-xs text-green-500 font-semibold">Live</span>
                </div>
              </div>

              {/* Feed Cards */}
              <div className="flex flex-col gap-2.5">
                {/* Card 1 - Doubt Post */}
                <motion.div variants={feedItemVariants} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-[10px] font-bold">
                      AK
                    </div>
                    <div>
                      <div className="text-sm font-bold text-black">Arun Kumar</div>
                      <div className="text-xs text-gray-400">3rd Year · CSE · SRM Chennai</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-900 font-medium mb-2">
                    How competitive is Swiggy's off-campus for CSE 2025 batch? My CGPA is 7.8
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      💬 4 answers · 2 hours ago
                    </div>
                    <div className="bg-green-50 border border-green-300 rounded-full px-2.5 py-1 text-xs font-semibold text-green-700">
                      ✓ Senior answered
                    </div>
                  </div>
                </motion.div>

                {/* Card 2 - Senior Answer */}
                <motion.div variants={feedItemVariants} className="bg-[#FAFAFE] border-l-[3px] border-[#7C3AED] border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-white text-[10px] font-bold">
                      RS
                    </div>
                    <div>
                      <div className="text-sm font-bold text-black">Rahul Sharma</div>
                      <div className="bg-[#F3F0FF] rounded px-2 py-0.5 text-[10px] font-bold text-[#7C3AED] inline-block">
                        SDE-2 @ Swiggy · 2022 Passout
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    7.8 is fine. Swiggy looks more at projects and problem-solving. OA has 2 DSA questions — medium level. DM me your resume...
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    👍 23 helpful · <span className="text-[#7C3AED] font-bold">Verified Senior</span>
                  </div>
                </motion.div>

                {/* Card 3 - Job Post */}
                <motion.div variants={feedItemVariants} className="bg-white border-t-[3px] border-[#06B6D4] border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#06B6D4] flex items-center justify-center text-white text-[10px] font-bold">
                      MP
                    </div>
                    <div>
                      <div className="text-sm font-bold text-black">Meera Priya</div>
                      <div className="text-xs text-gray-400">SDE-1 @ Flipkart · SRM 2023</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-black mb-1">
                    Flipkart — SDE Intern (6 months)
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    ₹60,000/mo · Chennai/Bangalore · Deadline: 15 Jan
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 text-xs font-semibold">
                      Referral available
                    </div>
                    <button className="bg-black text-white rounded-md px-3.5 py-1.5 text-xs font-semibold">
                      Apply →
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
