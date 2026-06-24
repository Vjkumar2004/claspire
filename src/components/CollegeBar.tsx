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
    <section className="bg-[#F4F2EE] border-t border-b border-[#D9E2EC] py-5 overflow-hidden">
      <div className="container">


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
                  className="inline-flex items-center gap-2 whitespace-nowrap bg-white border border-[#D9E2EC] border-l-[3px] border-l-[#0A66C2] rounded-lg px-3.5 py-2 flex-shrink-0 shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-[#F4F2EE] border border-[#D9E2EC] flex items-center justify-center">
                    {logo ? (
                      <img
                        src={logo}
                        alt={college.short_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-black text-[#004182]">
                        {getCollegeInitial(college)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-[#0A66C2] whitespace-nowrap">
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
