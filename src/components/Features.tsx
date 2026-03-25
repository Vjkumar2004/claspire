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
    <section className="bg-white py-24 overflow-hidden">
      <div className="container">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="max-w-[560px] mb-14"
        >
          <div className="text-xs font-bold tracking-[0.08em] uppercase text-[#7C3AED] mb-3">
            BUILT FOR INDIAN COLLEGE STUDENTS
          </div>
          <h2 className="font-instrument-serif font-normal text-[clamp(28px,4vw,44px)] leading-[1.15] text-black">
            The community your college never gave you
          </h2>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ backgroundColor: '#FAFAFE' }}
              transition={{ duration: 0.15 }}
              className="bg-white p-6 md:p-8 cursor-pointer h-full"
            >
              <div className="font-instrument-serif font-normal text-[48px] text-[#E5E7EB] leading-none mb-4">
                {feature.number}
              </div>
              <div className="text-base font-bold text-black mb-2">
                {feature.title}
              </div>
              <div className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
