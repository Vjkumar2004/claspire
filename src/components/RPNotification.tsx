'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Star } from 'lucide-react';
import { usePoints } from '@/contexts/PointsContext';

export default function RPNotification() {
  const { award, clearAward } = usePoints();

  useEffect(() => {
    if (award) {
      const timer = setTimeout(() => {
        clearAward();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [award, clearAward]);

  return (
    <AnimatePresence>
      {award && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            zIndex: 9999,
          }}
        >
          <div className="bg-surface dark:bg-[#283036] rounded-2xl shadow-[0_20px_50px_rgba(124,58,237,0.15)] border border-[#F4A01C]/20 dark:border-[#38434F] p-6 flex items-center gap-6 min-w-[320px] overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFF3D6] dark:bg-purple-900/20 rounded-full -mr-12 -mt-12 opacity-50" />
            
            {/* Icon stack */}
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-[#0A2540] to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#F4A01C]/20">
                <Zap size={28} fill="currentColor" />
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white border-2 border-white"
              >
                <Star size={12} fill="currentColor" />
              </motion.div>
            </div>

            {/* Text content */}
            <div className="flex-1">
              <h4 className="text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1 flex items-center gap-1.5">
                <Trophy size={10} className="text-amber-500" />
                Congratulations!
              </h4>
              <div className="font-instrument-serif text-3xl text-gray-900 dark:text-white leading-none">
                +{award.points} <span className="text-lg font-sans font-black text-[#F4A01C] ml-1">RP</span>
              </div>
              <p className="text-gray-500 dark:text-[#B0B7BE] text-xs mt-1 font-medium">
                {award.reason}
              </p>
            </div>

            {/* Close button (optional) */}
            <button 
              onClick={clearAward}
              className="absolute top-2 right-2 text-gray-300 dark:text-[#6B7B8B] hover:text-gray-500 dark:hover:text-[#B0B7BE] transition-colors p-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
