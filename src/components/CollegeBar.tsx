'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const colleges = [
  { short: "SR", name: "SRM University", color: "7C3AED" },
  { short: "VI", name: "VIT Vellore", color: "06B6D4" },
  { short: "NI", name: "NIT Trichy", color: "7C3AED" },
  { short: "AN", name: "Anna University", color: "06B6D4" },
  { short: "PS", name: "PSG Tech", color: "7C3AED" },
  { short: "BI", name: "BITS Pilani", color: "06B6D4" },
  { short: "CO", name: "Coimbatore Institute", color: "7C3AED" },
  { short: "AM", name: "Amrita University", color: "06B6D4" },
];

export default function CollegeBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-gray-50 border-t border-gray-200 border-b border-gray-200 py-5 overflow-hidden">
      <div className="container">
        {/* Label */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-3.5"
        >
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-400">
            STUDENTS FROM THESE COLLEGES ARE ALREADY ON CLASPIRE
          </div>
        </motion.div>

        {/* Marquee */}
        <div className="marquee-wrapper overflow-hidden w-full">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="flex gap-4 w-max"
          >
            {[...colleges, ...colleges].map((college, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 whitespace-nowrap bg-white border border-gray-200 rounded-lg px-3.5 py-2 flex-shrink-0"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${college.short}&background=${college.color}&color=fff&size=28&rounded=true&bold=true`}
                  alt={college.short}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                />
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  {college.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
