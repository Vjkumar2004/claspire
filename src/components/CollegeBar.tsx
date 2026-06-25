'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getCollegeLogo, getCollegeInitial } from '@/lib/college-utils';

export default function CollegeBar() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const { data, error } = await supabase
          .from('colleges')
          .select('id, name, short_name, slug, logo_url')
          .order('name');
        
        if (error) throw error;
        setColleges(data || []);
      } catch (err) {
        console.error('Error fetching colleges for bar:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, []);

  // Duplicate items for seamless transition
  const displayItems = [...colleges, ...colleges];

  if (loading || colleges.length === 0) return null;

  return (
    <section className="bg-[#FFFFFF] border-t border-b border-[#F1F5F9] py-5 overflow-hidden">
      <div className="container">
        {/* Label */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-3.5"
        >
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#4B5563]">
            STUDENTS FROM THESE COLLEGES ARE ALREADY ON CLASPIRE
          </div>
        </motion.div>

        {/* Marquee */}
        <div className="marquee-wrapper overflow-hidden w-full">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{
              duration: colleges.length * 3, // Dynamic duration based on count
              repeat: Infinity,
              ease: "linear"
            }}
            className="flex gap-4 w-max"
          >
            {displayItems.map((college, index) => {
              const logo = getCollegeLogo(college);
              return (
                  <div
                  key={`${college.id}-${index}`}
                  className="inline-flex items-center gap-2 whitespace-nowrap bg-white border border-[#F1F5F9] rounded-full px-4 py-2 flex-shrink-0 shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-[#FFFFFF] border border-[#F1F5F9] flex items-center justify-center">
                    {logo ? (
                      <img
                        src={logo}
                        alt={college.short_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-black text-[#334155]">
                        {getCollegeInitial(college)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-[#111827] whitespace-nowrap">
                    {college.name}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
