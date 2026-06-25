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
    <section className="bg-[#FFFFFF] overflow-hidden min-h-[calc(100dvh-56px)] flex flex-col justify-center lg:justify-start lg:min-h-0 border-b border-[#F1F5F9]">
      <div className="container py-8 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 relative" ref={ref}>
            {/* Dots Pattern & Abstract Image */}
            <div className="absolute -left-12 top-20 w-24 h-48 opacity-20 hidden lg:block" style={{ backgroundImage: 'radial-gradient(#334155 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
            <img src="/hero_decorative.png" alt="Decorative" className="absolute top-0 right-0 lg:right-[-200px] w-[500px] h-auto opacity-[0.15] mix-blend-multiply pointer-events-none hidden lg:block object-cover z-0" />
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="py-6 lg:py-20 px-4 lg:px-0 relative z-10"
            >
              {/* Top Label */}
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-[#E0F7FA] border border-[#B2EBF2] rounded-md px-3 py-1 text-[11px] font-bold text-[#00838F] tracking-widest uppercase lg:inline-flex justify-center w-full lg:w-auto lg:justify-start">
                INDIA'S COLLEGE SENIOR NETWORK
              </motion.div>

              {/* H1 */}
              <motion.h1 variants={itemVariants} className="font-extrabold text-[clamp(36px,4.5vw,56px)] leading-[1.1] text-[#111827] mt-5 mb-0 text-center lg:text-left tracking-tight">
                Claspire — India's College<br />
                <span className="text-[#1a63f1] block sm:inline">Senior-Student Community Platform</span>
              </motion.h1>

              {/* H2 - SEO Subheading */}
              <motion.h2 variants={itemVariants} className="text-base sm:text-lg font-bold text-[#111827] mt-5 mb-0 text-center lg:text-left">
                Your senior knows the exact path. You just need to ask.
              </motion.h2>

              {/* Subtext */}
              <motion.p variants={itemVariants} className="text-[15px] text-[#4B5563] leading-relaxed max-w-[480px] mt-4 mb-0 text-center lg:text-left mx-auto lg:mx-0 font-medium">
                Connect with verified seniors from your own college. Real answers to real questions — placements, referrals, career paths.
              </motion.p>

              {/* Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start">
                <a href="/colleges" className="no-underline">
                  <button className="bg-[#1a63f1] text-white px-7 py-3.5 rounded-md text-sm font-bold border-none cursor-pointer hover:bg-[#1550c4] transition-all shadow-md w-full sm:w-auto">
                    Find your college →
                  </button>
                </a>
                <button 
                  onClick={() => {
                    const element = document.getElementById('the-process');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white border border-[#D1D9E0] text-[#111827] px-7 py-3.5 rounded-md text-sm font-bold cursor-pointer hover:bg-gray-50 transition-all shadow-sm w-full sm:w-auto"
                >
                  See how it works
                </button>
              </motion.div>

              {/* Social Proof */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3 mt-10">
                {/* Avatars */}
                <div className="flex">
                  <div className="w-8 h-8 rounded-full bg-[#1a63f1] border-2 border-[#FFFFFF] flex items-center justify-center text-white text-[10px] font-bold shadow-sm" style={{ marginLeft: '0' }}>
                    AK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00838F] border-2 border-[#FFFFFF] flex items-center justify-center text-white text-[10px] font-bold shadow-sm" style={{ marginLeft: '-8px' }}>
                    RS
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#111827] border-2 border-[#FFFFFF] flex items-center justify-center text-white text-[10px] font-bold shadow-sm" style={{ marginLeft: '-8px' }}>
                    MP
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#E91E63] border-2 border-[#FFFFFF] flex items-center justify-center text-white text-[10px] font-bold shadow-sm" style={{ marginLeft: '-8px' }}>
                    SK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#4CAF50] border-2 border-[#FFFFFF] flex items-center justify-center text-white text-[10px] font-bold shadow-sm" style={{ marginLeft: '-8px' }}>
                    PT
                  </div>
                </div>
                
                {/* Text */}
                <span className="text-[13px] text-[#4B5563] text-center sm:text-left font-medium">
                  <strong className="text-[#111827] font-bold">2,400+ students</strong> already connected this month
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
                <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#4B5563]">
                  LIVE FROM LOCAL COLLEGES
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  <span className="text-xs text-green-600 font-semibold">Live Feed</span>
                </div>
              </div>

              {/* Feed Cards */}
              <div className="flex flex-col gap-3">
                {/* Card 1 - Doubt Post */}
                <motion.div variants={feedItemVariants} className="bg-white border border-[#F1F5F9] rounded-lg p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#1a63f1] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      VK
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#111827]">Vijayalakshmi K.</div>
                      <div className="text-xs text-[#4B5563] font-medium">4th Year · CSE · KARE</div>
                    </div>
                  </div>
                  <div className="text-[14px] text-[#111827] font-semibold mb-3 leading-snug">
                    How tough is Zoho off-campus for 2025 batch? CGPA 7.8 here
                  </div>
                  <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3">
                    <div className="text-xs text-[#4B5563] font-medium">
                      💬 2 answers · 3 hours ago
                    </div>
                    <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-full px-2.5 py-0.5 text-xs font-semibold text-[#059669] flex items-center gap-1 shadow-sm">
                      ✓ Senior answered
                    </div>
                  </div>
                </motion.div>

                {/* Card 2 - Senior Answer (Indented nested style) */}
                <motion.div variants={feedItemVariants} className="bg-white border border-[#F1F5F9] rounded-lg p-4 ml-4 shadow-sm relative before:content-[''] before:absolute before:left-[-17px] before:top-[-10px] before:w-[16px] before:h-[30px] before:border-b-2 before:border-l-2 before:border-[#D1D9E0] before:rounded-bl-lg">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#111827] flex items-center justify-center text-white text-[9px] font-black">
                      SA
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#111827]">Santhosh A.</span>
                        <span className="bg-[#E0F7FA] rounded px-1.5 py-0.5 text-[9px] font-bold text-[#00838F]">
                          Verified Senior
                        </span>
                      </div>
                      <div className="text-[10px] text-[#4B5563] font-medium">
                        SDE-1 @ TCS · 2023 Passout
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-[#4B5563] leading-relaxed font-medium">
                    7.8 is good! Zoho focuses on problem-solving and communication. Prepare DSA well and be clear on projects. DM me for tips!
                  </div>
                  <div className="text-[10px] text-[#4B5563] font-semibold mt-2.5 flex items-center gap-1 border-t border-[#F1F5F9] pt-2">
                    👍 18 helpful · <span className="text-[#1a63f1] font-bold">Placement Help</span>
                  </div>
                </motion.div>

                {/* Card 3 - Job Post */}
                <motion.div variants={feedItemVariants} className="bg-white border border-[#F1F5F9] rounded-lg p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#00838F] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      MP
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#111827]">Manikandan P.</div>
                      <div className="text-xs text-[#4B5563] font-medium">SDE @ Infosys · ANJAC 2022</div>
                    </div>
                  </div>
                  <div className="text-[14px] font-bold text-[#111827] mb-1 leading-snug">
                    Infosys — System Engineer Trainee
                  </div>
                  <div className="text-xs text-[#4B5563] mb-3 font-medium">
                    ₹3.5 LPA · Chennai · Training: 6 months
                  </div>
                  <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3">
                    <div className="bg-[#EFF6FF] text-[#334155] border border-[#BFDBFE] rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      Referral available
                    </div>
                    <button className="bg-[#1a63f1] text-white rounded-md px-4 py-1.5 text-xs font-bold border-none hover:bg-[#1550c4] transition-colors cursor-pointer shadow-sm">
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
