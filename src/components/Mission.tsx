'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Mission() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="bg-[#F9F7FF] py-20 md:py-24 overflow-hidden border-y border-purple-100/50">
      <div className="container max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start"
        >
          {/* Left Column */}
          <div>
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
              <div className="w-1 h-4 bg-[#7C3AED] rounded-full"></div>
              <div className="text-xs font-semibold tracking-widest uppercase text-[#7C3AED]">
                OUR MISSION
              </div>
            </motion.div>
            
            <motion.h2 variants={itemVariants} className="font-extrabold text-[clamp(32px,4vw,48px)] leading-[1.15] text-gray-900 tracking-tight text-left">
              Bridging the Gap Between Students & College Seniors in India
            </motion.h2>

            {/* Stats */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-8 mt-10 lg:mt-12">
              <div>
                <div className="text-3xl font-extrabold text-[#7C3AED] tracking-tight mb-1">4,000+</div>
                <div className="text-sm font-medium text-gray-500 leading-snug">Engineering colleges<br/>in India</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#7C3AED] tracking-tight mb-1">0</div>
                <div className="text-sm font-medium text-gray-500 leading-snug">Mentors available<br/>before Claspire</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#7C3AED] tracking-tight mb-1">1 msg</div>
                <div className="text-sm font-medium text-gray-500 leading-snug">Away from real<br/>guidance</div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:pt-14">
            <motion.p variants={itemVariants} className="text-[17px] md:text-lg text-[#374151] leading-[1.8] font-medium mb-10 text-left">
              India has over 4,000 engineering colleges — but most students navigate placements, backlogs, and career choices completely alone. Claspire is a college senior-student community platform where juniors connect directly with verified seniors from their own campus. Whether you're from a college in Tamil Nadu, Maharashtra, Karnataka, or anywhere across India — real guidance from someone who's been in your exact shoes is just one message away.
            </motion.p>
            
            <motion.div variants={itemVariants} className="border-l-[3px] border-[#7C3AED] pl-6 py-1">
              <p className="text-lg text-gray-600 italic font-medium leading-relaxed m-0">
                "Real guidance from someone who's walked your exact path — not a LinkedIn stranger, but a senior from your own college."
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
