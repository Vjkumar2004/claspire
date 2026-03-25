'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const steps = [
  {
    number: "1",
    title: "Find Your College",
    description: "Search your college, see your seniors, follow your community."
  },
  {
    number: "2",
    title: "Ask & Connect", 
    description: "Post doubts publicly. Get real answers from placed seniors who've been there."
  },
  {
    number: "3",
    title: "Get Referred",
    description: "Request referrals, attend webinars, get the job. Simple."
  }
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section id="the-process" className="bg-gray-50 py-24 overflow-hidden">
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
            THE PROCESS
          </div>
          <h2 className="font-instrument-serif font-normal text-[clamp(32px,4vw,44px)] leading-[1.15] text-black">
            From confused junior<br />
            <em className="text-[#7C3AED]">to placed senior</em><br />
            in 3 steps.
          </h2>
        </motion.div>

        {/* Steps Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="max-w-5xl mx-auto mt-14"
        >
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            {steps.map((step, index) => (
              <div key={index} className="flex-1 text-center">
                <motion.div
                  variants={itemVariants}
                  className="max-w-xs mx-auto"
                >
                  {/* Step Number */}
                  <div className="w-12 h-12 rounded-full bg-black text-white font-instrument-serif font-normal text-xl flex items-center justify-center mx-auto mb-5">
                    {step.number}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-base font-bold text-black mb-2 px-2">
                    {step.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-500 leading-relaxed px-4">
                    {step.description}
                  </p>
                </motion.div>

                {/* Arrow - Not after last item */}
                {index < steps.length - 1 && (
                  <div className="flex-shrink-0 text-2xl text-gray-300 self-center mt-8">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tablet Layout */}
          <div className="hidden md:flex lg:hidden flex-col gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center max-w-md mx-auto"
              >
                {/* Step Number */}
                <div className="w-12 h-12 rounded-full bg-black text-white font-instrument-serif font-normal text-xl flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>
                
                {/* Title */}
                <h3 className="text-base font-bold text-black mb-2 px-2">
                  {step.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed px-4">
                  {step.description}
                </p>
                
                {/* Arrow for tablet (except last) */}
                {index < steps.length - 1 && (
                  <div className="text-2xl text-gray-300 mt-6">
                    ↓
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center px-4"
              >
                {/* Step Number */}
                <div className="w-12 h-12 rounded-full bg-black text-white font-instrument-serif font-normal text-xl flex items-center justify-center mx-auto mb-3">
                  {step.number}
                </div>
                
                {/* Title */}
                <h3 className="text-base font-bold text-black mb-2">
                  {step.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Arrow for mobile (except last) */}
                {index < steps.length - 1 && (
                  <div className="text-2xl text-gray-300 mt-4">
                    ↓
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
