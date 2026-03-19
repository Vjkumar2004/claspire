'use client';

import { motion } from 'framer-motion';
import { Briefcase, Users, Target, Heart, MapPin, Clock, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const openPositions = [
    {
      id: 1,
      title: "Frontend Developer Intern",
      department: "Engineering",
      location: "Chennai (Remote)",
      type: "Internship",
      duration: "3-6 months",
      description: "Join our engineering team to build amazing user experiences for college students across India."
    },
    {
      id: 2,
      title: "Campus Ambassador",
      department: "Marketing",
      location: "Multiple Locations",
      type: "Part-time",
      duration: "6 months",
      description: "Represent Claspire at your college and help us build the largest student community in India."
    },
    {
      id: 3,
      title: "Content Creator",
      department: "Content",
      location: "Remote",
      type: "Freelance",
      duration: "Project-based",
      description: "Create engaging content about career guidance, college life, and professional development."
    }
  ];

  const benefits = [
    "Flexible working hours",
    "Remote work opportunities", 
    "Certificate of completion",
    "Letter of recommendation",
    "Networking opportunities",
    "Skill development programs"
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Briefcase className="w-16 h-16 mx-auto mb-6 text-white/80" />
            <h1 className="text-4xl md:text-5xl font-bold font-instrument-serif mb-6">
              Careers at Claspire
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Join us in our mission to democratize access to quality career guidance for every college student in India.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="#open-positions"
                className="bg-white text-purple-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                View Open Positions <ArrowRight size={20} />
              </Link>
              <Link 
                href="#culture"
                className="bg-white/20 backdrop-blur text-white px-8 py-3 rounded-xl font-bold hover:bg-white/30 transition-colors border border-white/30"
              >
                Our Culture
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* No Positions Available Notice */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="text-yellow-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">
              No Current Openings
            </h2>
            <p className="text-lg text-[#64748B] mb-6 max-w-2xl mx-auto">
              We're not actively hiring at the moment, but we're always looking for talented individuals who share our vision. 
              Feel free to reach out to us with your portfolio and we'll keep you in mind for future opportunities.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/contact"
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                Contact Us <ArrowRight size={20} />
              </Link>
              <button 
                onClick={() => window.open('mailto:claspire.campus@gmail.com?subject=Career Inquiry&body=Hi Team, I would like to explore career opportunities at Claspire.')}
                className="bg-white text-purple-600 border border-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors"
              >
                Send Resume
              </button>
            </div>
          </div>
        </motion.div>

        {/* Why Join Us Section */}
        <motion.div
          id="culture"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-[#0F172A] mb-8 text-center">Why Work With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="text-purple-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Make an Impact</h3>
              <p className="text-[#64748B]">
                Work on products that directly impact thousands of students' careers and futures.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-blue-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Learn & Grow</h3>
              <p className="text-[#64748B]">
                Learn from experienced professionals and grow your skills in a fast-paced environment.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-green-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Great Culture</h3>
              <p className="text-[#64748B]">
                Join a team that values creativity, collaboration, and making a difference.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-[#0F172A]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stay Connected */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-[#0F172A] rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Stay Connected</h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Even if we don't have current openings, we'd love to hear from you. Send us your resume and we'll reach out when suitable positions become available.
            </p>
            <button 
              onClick={() => window.open('mailto:claspire.campus@gmail.com?subject=Future Career Opportunities&body=Hi Team, I would like to be considered for future career opportunities at Claspire.')}
              className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
            >
              Send Your Resume <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
