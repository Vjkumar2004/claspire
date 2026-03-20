'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const quotes = [
  {
    text: "I was struggling with campus placements at AAACET. A senior from Kamaraj College shared exact interview questions. Got placed in Wipro!",
    author: "Vijayakumar S.",
    details: "AAACET ECE 2024 → Wipro",
    color: "#7C3AED"
  },
  {
    text: "Posted doubt about TCS interview at midnight. Got reply from ANJAC senior immediately. Cleared the interview next week!",
    author: "Kavitha R.",
    details: "VVV College IT 2024 → TCS",
    color: "#06B6D4"
  },
  {
    text: "Got referral from Kamaraj alumni for Infosys. The platform connected me with seniors who actually work there!",
    author: "Manikandan P.",
    details: "ANJAC CSE 2024 → Infosys",
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
            SUCCESS STORIES
          </div>
          <h2 className="font-instrument-serif font-normal text-[clamp(32px,4vw,40px)] leading-[1.15] text-black">
            Local students who asked.<br />
            Local students who got placed.
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
