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
    <section className="bg-black py-24 px-6 text-center overflow-hidden">
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
          className="font-instrument-serif font-normal text-[clamp(32px,5vw,56px)] leading-[1.1] text-white"
        >
          Your senior is already here.<br />
          <em className="text-[#A78BFA]" style={{ color: '#A78BFA' }}>
            Are you?
          </em>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          variants={itemVariants}
          className="text-base text-white/60 mt-4 mb-8"
        >
          Join free. Find your college. Start asking the right questions.
        </motion.p>

        {/* Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => window.location.href = '/colleges'}
          className="bg-white text-black px-8 py-3.5 rounded-lg text-sm font-bold border-none cursor-pointer mx-auto w-full max-w-[320px] md:w-auto"
        >
          Find your college →
        </motion.button>
      </motion.div>
    </section>
  );
}
