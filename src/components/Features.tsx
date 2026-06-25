'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

import { Users, MessageSquare, Gift, Bot, Video, BarChart2 } from 'lucide-react';

const features = [
  {
    icon: <Users size={20} strokeWidth={2} />,
    title: "College Community",
    description: "Only seniors from YOUR college answer. No strangers, no generic advice."
  },
  {
    icon: <MessageSquare size={20} strokeWidth={2} />, 
    title: "Doubt Feed",
    description: "Post any doubt publicly. Verified seniors answer within 2 hours. AI covers the rest."
  },
  {
    icon: <Gift size={20} strokeWidth={2} />,
    title: "Job Referrals",
    description: "One-click referral request. AI writes the email. Senior approves in one tap."
  },
  {
    icon: <Bot size={20} strokeWidth={2} />,
    title: "AI Mentor",
    description: "Trained on Indian placement data. Knows your college's specific placement patterns."
  },
  {
    icon: <Video size={20} strokeWidth={2} />,
    title: "Live Webinars",
    description: "Placed seniors host paid Sunday sessions. Learn exactly how they got their offer."
  },
  {
    icon: <BarChart2 size={20} strokeWidth={2} />,
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
    <section className="bg-gradient-to-b from-white to-[#F8FAFC] py-16 md:py-24 overflow-hidden relative">
      {/* Decorative background blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#1a63f1] opacity-[0.03] blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold tracking-widest uppercase text-[#1a63f1] mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1a63f1] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1a63f1]"></span>
            </span>
            BUILT FOR INDIAN COLLEGE STUDENTS
          </div>
          <h2 className="font-extrabold text-[clamp(32px,4vw,44px)] leading-[1.15] text-[#111827] tracking-tight mb-4">
            The community your college <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a63f1] to-[#00E5FF]">never gave you</span>
          </h2>
          <p className="text-[16px] text-[#4B5563] font-medium leading-relaxed max-w-[540px] mx-auto">
            Everything you need to navigate college life, clear doubts, and land your dream job — all in one powerful platform powered by your seniors.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group relative bg-white p-8 rounded-2xl border border-[#E2E8F0] hover:border-[#1a63f1]/30 hover:shadow-[0_20px_40px_rgba(26,99,241,0.08)] transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Subtle hover gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a63f1]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 text-[#1a63f1] bg-gradient-to-br from-[#EBF2FF] to-white border border-[#D1E0FF] rounded-xl mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {feature.icon}
                </div>
                <div className="text-[17px] font-extrabold text-[#111827] mb-2.5 tracking-tight group-hover:text-[#1a63f1] transition-colors">
                  {feature.title}
                </div>
                <div className="text-[14px] text-[#4B5563] leading-relaxed font-medium">
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
