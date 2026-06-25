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
    <section id="the-process" className="bg-[#FFFFFF] py-16 md:py-24 overflow-hidden border-b border-[#F1F5F9]">
      <div className="container">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="text-xs font-bold tracking-wider uppercase text-[#1a63f1] mb-3">
            THE PROCESS
          </div>
          <h2 className="font-extrabold text-[clamp(28px,3.5vw,40px)] leading-[1.2] text-[#111827] tracking-tight">
            From confused junior <span className="text-[#1a63f1]">to placed senior</span><br />
            in 3 simple steps.
          </h2>
        </motion.div>

        {/* Steps Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="max-w-5xl mx-auto mt-16 relative"
        >
          {/* Desktop Layout */}
          <div className="hidden lg:flex justify-between items-start relative">
            {/* Elegant connecting line */}
            <div className="absolute top-6 left-[10%] right-[10%] h-0.5 bg-[#F1F5F9] z-0"></div>

            {steps.map((step, index) => (
              <div key={index} className="flex-1 text-center relative z-10">
                <motion.div
                  variants={itemVariants}
                  className="max-w-xs mx-auto"
                >
                  {/* Step Number */}
                  <div className="w-12 h-12 rounded-full bg-[#1a63f1] text-white font-bold text-lg flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-[#FFFFFF]">
                    {step.number}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-base font-bold text-[#111827] mb-2 px-2 tracking-tight">
                    {step.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-[13px] text-[#4B5563] leading-relaxed font-medium px-4">
                    {step.description}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Tablet & Mobile Layout */}
          <div className="lg:hidden flex flex-col gap-10 relative pl-8 max-w-md mx-auto">
            {/* Elegant vertical track line */}
            <div className="absolute top-2 bottom-8 left-[17px] w-0.5 bg-[#F1F5F9] z-0"></div>

            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative z-10 flex items-start gap-4"
              >
                {/* Step Circle */}
                <div className="w-9 h-9 rounded-full bg-[#1a63f1] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 border-4 border-[#FFFFFF] shadow-sm">
                  {step.number}
                </div>
                
                <div className="pt-1">
                  <h3 className="text-base font-bold text-[#111827] mb-1 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-[#4B5563] leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
