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
    <section className="bg-[#0A2540] py-24 px-6 text-center overflow-hidden border-t border-[#1B4F72]">
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="max-w-4xl mx-auto"
      >
        {/* H2 */}
        <motion.h2
          variants={itemVariants}
          className="font-extrabold text-[clamp(32px,5vw,52px)] leading-[1.15] text-white tracking-tight"
        >
          Your senior is already here.<br />
          <span className="text-[#F4A01C]">Are you?</span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          variants={itemVariants}
          className="text-base font-medium mt-5 mb-8 text-[#FFF8EE]/75"
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
          className="bg-[#F4A01C] text-[#0A2540] px-8 py-3.5 rounded-md text-sm font-bold border-none cursor-pointer mx-auto w-full max-w-[320px] md:w-auto hover:bg-[#E09410] transition-all shadow-sm"
        >
          Find your college →
        </motion.button>
      </motion.div>
    </section>
  );
}
