'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Landmark, Users, Send } from 'lucide-react';

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
    <section className="bg-white py-16 md:py-24 overflow-hidden border-y border-[#F1F5F9]">
      <div className="container max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start"
        >
          {/* Left Column */}
          <div>
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
              <div className="w-1 h-4 bg-[#00BFA5] rounded-full"></div>
              <div className="text-xs font-bold tracking-widest uppercase text-[#00BFA5]">
                OUR MISSION
              </div>
            </motion.div>
            
            <motion.h2 variants={itemVariants} className="font-extrabold text-[clamp(28px,4vw,48px)] leading-[1.15] text-[#111827] tracking-tight text-left">
              Bridging the Gap Between Students & College Seniors in India
            </motion.h2>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mt-8 lg:mt-12">
              <div className="flex flex-col gap-1.5 bg-[#F8FAFC] rounded-2xl p-3 md:p-5">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#00BFA5]">
                  <Landmark size={16} className="md:w-5 md:h-5" strokeWidth={2} />
                </div>
                <div className="text-[17px] md:text-2xl font-extrabold text-[#1a63f1] tracking-tight mt-1">4,000+</div>
                <div className="text-[10px] md:text-[13px] font-medium text-[#4B5563] leading-snug">Engineering colleges<br/>in India</div>
              </div>
              
              <div className="flex flex-col gap-1.5 bg-[#F8FAFC] rounded-2xl p-3 md:p-5">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#00BFA5]">
                  <Users size={16} className="md:w-5 md:h-5" strokeWidth={2} />
                </div>
                <div className="text-[17px] md:text-2xl font-extrabold text-[#1a63f1] tracking-tight mt-1">0</div>
                <div className="text-[10px] md:text-[13px] font-medium text-[#4B5563] leading-snug">Mentors available<br/>before Claspire</div>
              </div>

              <div className="flex flex-col gap-1.5 bg-[#F8FAFC] rounded-2xl p-3 md:p-5">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#00BFA5]">
                  <Send size={16} className="md:w-5 md:h-5" strokeWidth={2} />
                </div>
                <div className="text-[17px] md:text-2xl font-extrabold text-[#1a63f1] tracking-tight mt-1">1 msg</div>
                <div className="text-[10px] md:text-[13px] font-medium text-[#4B5563] leading-snug">Away from real<br/>guidance</div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:pt-0 flex flex-col gap-6 md:gap-8">
            <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden shadow-sm border border-[#E2E8F0]">
              <img src="/mentorship_illustration.png" alt="Seniors mentoring juniors" className="w-full h-[200px] sm:h-[240px] md:h-[280px] object-cover object-center" />
            </motion.div>

            <motion.p variants={itemVariants} className="text-[15px] md:text-[17px] text-[#111827] leading-[1.7] md:leading-[1.8] font-medium text-left">
              India has over 4,000 engineering colleges — but most students navigate placements, backlogs, and career choices completely alone. Claspire is a college senior-student community platform where juniors connect directly with verified seniors from their own campus. Whether you're from a college in Tamil Nadu, Maharashtra, Karnataka, or anywhere across India — real guidance from someone who's been in your exact shoes is just one message away.
            </motion.p>
            
            <motion.div variants={itemVariants} className="border-l-[3px] border-[#00BFA5] pl-5 md:pl-6 py-1 bg-white">
              <p className="text-[15px] md:text-[17px] text-[#4B5563] italic font-medium leading-relaxed m-0">
                "Real guidance from someone who's walked your exact path — not a LinkedIn stranger, but a senior from your own college."
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
