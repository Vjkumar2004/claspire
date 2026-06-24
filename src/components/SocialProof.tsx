'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const quotes = [
  {
    text: "Connected with amazing mentors during my final year at AAACET. A senior from Kamaraj College shared exact interview questions. Got placed in Wipro!",
    author: "Vijayakumar S.",
    details: "AAACET ECE 2024 → Wipro",
    color: "#0A2540"
  },
  {
    text: "Posted doubt about TCS interview at midnight. Got reply from ANJAC senior immediately. Cleared the interview next week!",
    author: "Kavitha R.",
    details: "VVV College IT 2024 → TCS",
    color: "#1B4F72"
  },
  {
    text: "Got referral from Kamaraj alumni for Infosys. The platform connected me with seniors who actually work there!",
    author: "Manikandan P.",
    details: "ANJAC CSE 2024 → Infosys",
    color: "#F4A01C"
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
    <section className="bg-white py-24 overflow-hidden border-b border-[#E8DFD0]">
      <div className="container">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="text-xs font-semibold tracking-wider uppercase text-[#1B4F72] mb-3">
            SUCCESS STORIES
          </div>
          <h2 className="font-extrabold text-[clamp(28px,3.5vw,40px)] leading-[1.2] text-[#0A2540] tracking-tight">
            Local students who asked.<br />
            Local students who got placed.
          </h2>
        </motion.div>

        {/* Quote Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1000px] mx-auto mt-14"
        >
          {quotes.map((quote, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(10, 37, 64, 0.08)' }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#E8DFD0] border-l-[3px] border-l-[#F4A01C] rounded-xl p-6 h-full shadow-[0_1px_3px_rgba(10,37,64,0.05)] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Quote Mark */}
                <div className="text-3xl text-[#F4A01C] leading-none mb-3 font-extrabold">
                  "
                </div>
                
                {/* Quote Text */}
                <div className="text-[13px] text-[#5A7184] leading-relaxed mb-6 font-medium">
                  {quote.text}
                </div>
              </div>
              
              {/* Author Row */}
              <div className="flex items-center gap-3 border-t border-[#E8DFD0] pt-4">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0"
                  style={{
                    backgroundColor: quote.color,
                    color: quote.color === '#F4A01C' ? '#0A2540' : '#FFFFFF'
                  }}
                >
                  {quote.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0A2540] tracking-tight">
                    {quote.author}
                  </div>
                  <div className="text-xs text-[#5A7184] font-medium">
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
