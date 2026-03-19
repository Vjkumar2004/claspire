'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, Target, Award, Heart, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#7C3AED] via-[#4F46E5] to-[#06B6D4] text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold font-instrument-serif mb-6">
              About Claspire
            </h1>
            <p className="text-xl text-white/90 max-w-3xl">
              Connecting college students with verified seniors to build careers, share knowledge, and create opportunities.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-purple-600" size={32} />
              <h2 className="text-3xl font-bold text-[#0F172A]">Our Mission</h2>
            </div>
            <p className="text-lg text-[#64748B] leading-relaxed">
              To bridge the gap between college students and experienced professionals by creating a trusted platform 
              where knowledge sharing, mentorship, and career opportunities flourish. We believe every student deserves 
              access to real guidance from those who have walked the same path.
            </p>
          </div>
        </motion.div>

        {/* Values Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-[#0F172A] mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-purple-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Trust & Safety</h3>
              <p className="text-[#64748B]">
                Every senior is verified and background-checked to ensure authentic guidance.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-blue-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Community First</h3>
              <p className="text-[#64748B]">
                Building supportive communities where students help each other grow.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-green-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Excellence</h3>
              <p className="text-[#64748B]">
                Committed to providing the best resources and opportunities for growth.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-8">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-6">Our Story</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-lg text-[#64748B] mb-4">
                  Claspire started with a simple observation: college students often struggle to find 
                  genuine career guidance. Traditional placement cells help, but nothing beats real 
                  experience from someone who's recently been in your shoes.
                </p>
                <p className="text-lg text-[#64748B] mb-4">
                  Founded by a team of passionate educators and tech professionals, we've built a platform 
                  that connects thousands of students with verified seniors from top colleges across India.
                </p>
                <p className="text-lg text-[#64748B]">
                  Today, Claspire is more than just a platform – it's a movement to democratize access 
                  to quality career guidance and opportunities.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">100+</div>
                <div className="text-[#64748B] mb-4">Active Students</div>
                <div className="text-4xl font-bold text-blue-600 mb-2">25+</div>
                <div className="text-[#64748B] mb-4">Verified Seniors</div>
                <div className="text-4xl font-bold text-green-600 mb-2">10+</div>
                <div className="text-[#64748B]">Partner Colleges</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-[#0F172A] rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Be part of a growing community that's changing how students build their careers.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/signup"
                className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                Get Started <ArrowRight size={20} />
              </Link>
              <Link 
                href="/community"
                className="bg-white text-[#0F172A] px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Explore Community
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Note */}
      <div className="bg-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[#64748B] flex items-center justify-center gap-2">
            Made with <Heart className="text-red-500" size={16} /> in India for students everywhere
          </p>
        </div>
      </div>
    </div>
  );
}
