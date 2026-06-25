'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="bg-gradient-to-r from-[#111827] to-[#1a63f1] py-16 md:py-24 px-5 md:px-6 text-center overflow-hidden border-t border-[#1a63f1]/50 relative">
      {/* Decorative Paper Planes */}
      <div className="absolute left-10 top-20 opacity-30 pointer-events-none hidden md:block">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{transform: 'rotate(-15deg)'}}>
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </div>
      <div className="absolute right-10 bottom-20 opacity-30 pointer-events-none hidden md:block">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{transform: 'rotate(15deg) scaleX(-1)'}}>
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </div>

      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="max-w-4xl mx-auto relative z-10"
      >
        {/* H2 */}
        <motion.h2
          variants={itemVariants}
          className="font-extrabold text-[clamp(32px,5vw,52px)] leading-[1.15] text-white tracking-tight"
        >
          Your senior is already here.<br />
          <span className="text-[#00E5FF]">Are you?</span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          variants={itemVariants}
          className="text-base font-medium mt-5 mb-8 text-[#FFFFFF]/90"
        >
          Join free. Find your college. Start asking the right questions.
        </motion.p>

        {/* Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => window.location.href = '/colleges'}
          className="bg-white text-[#1a63f1] px-8 py-3.5 rounded-md text-sm font-bold border-none cursor-pointer mx-auto w-full max-w-[320px] md:w-auto hover:bg-gray-50 transition-all shadow-md"
        >
          Find your college →
        </motion.button>
      </motion.div>
    </section>
  );
}
