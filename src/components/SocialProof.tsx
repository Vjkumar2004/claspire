'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const quotes = [
  {
    text: "I was rejected from 5 companies before a senior from SRM told me exactly what Swiggy looks for. Got the offer in 2 weeks.",
    author: "Arun K.",
    details: "SRM CSE 2024 → Swiggy",
    color: "#7C3AED"
  },
  {
    text: "Posted a doubt at 11pm about Amazon's interview process. Got a detailed reply from a senior at midnight. This platform is insane.",
    author: "Sneha R.",
    details: "VIT ECE 2024 → Amazon",
    color: "#06B6D4"
  },
  {
    text: "The referral feature alone is worth it. Senior approved my request in 10 minutes. Interview call came 3 days later.",
    author: "Priya M.",
    details: "NIT Trichy 2024 → Flipkart",
    color: "#7C3AED"
  }
];

export default function SocialProof() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="bg-white py-24 overflow-hidden">
      <div className="container">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="text-xs font-bold tracking-[0.08em] uppercase text-gray-400 mb-3">
            REAL STORIES
          </div>
          <h2 className="font-instrument-serif font-normal text-[clamp(32px,4vw,40px)] leading-[1.15] text-black">
            Students who asked.<br />
            Students who got placed.
          </h2>
        </motion.div>

        {/* Quote Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1000px] mx-auto mt-12"
        >
          {quotes.map((quote, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white border border-gray-200 rounded-xl p-6 h-full"
            >
              {/* Quote Mark */}
              <div className="font-instrument-serif font-normal text-[48px] text-gray-200 leading-none mb-2">
                "
              </div>
              
              {/* Quote Text */}
              <div className="text-sm text-gray-700 leading-relaxed mb-5">
                {quote.text}
              </div>
              
              {/* Author Row */}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: quote.color }}
                >
                  {quote.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-bold text-black">
                    {quote.author}
                  </div>
                  <div className="text-xs text-gray-400">
                    {quote.details}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
