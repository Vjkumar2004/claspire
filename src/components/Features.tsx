'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    number: "01",
    title: "College Community",
    description: "Only seniors from YOUR college answer. No strangers, no generic advice."
  },
  {
    number: "02", 
    title: "Doubt Feed",
    description: "Post any doubt publicly. Verified seniors answer within 2 hours. AI covers the rest."
  },
  {
    number: "03",
    title: "Job Referrals",
    description: "One-click referral request. AI writes the email. Senior approves in one tap."
  },
  {
    number: "04",
    title: "AI Mentor",
    description: "Trained on Indian placement data. Knows your college's specific placement patterns."
  },
  {
    number: "05",
    title: "Live Webinars",
    description: "Placed seniors host paid Sunday sessions. Learn exactly how they got their offer."
  },
  {
    number: "06",
    title: "Placement Stats",
    description: "Real data per college, per company. No marketing. No fluff. Just truth."
  }
];

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="bg-white dark:bg-[#1D2226] py-24 overflow-hidden border-b border-gray-100 dark:border-[#38434F]">
      <div className="container">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="max-w-[560px] mb-14"
        >
          <div className="text-xs font-semibold tracking-wider uppercase text-[#7C3AED] mb-3">
            BUILT FOR INDIAN COLLEGE STUDENTS
          </div>
          <h2 className="font-extrabold text-[clamp(28px,3.5vw,40px)] leading-[1.2] text-gray-900 dark:text-white tracking-tight">
            The community your college never gave you
          </h2>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4, borderColor: '#7C3AED', boxShadow: '0 10px 25px rgba(124, 58, 237, 0.05)' }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#283036] p-6 md:p-8 cursor-pointer h-full border border-gray-200 dark:border-[#38434F] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center justify-center font-bold text-xs text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-full px-2.5 py-0.5 mb-4 tracking-wider">
                  0{index + 1}
                </div>
                <div className="text-base font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {feature.title}
                </div>
                <div className="text-[13px] text-gray-500 dark:text-[#B0B7BE] leading-relaxed font-medium">
                  {feature.description}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
