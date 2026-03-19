'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Users, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <FileText className="w-16 h-16 mx-auto mb-6 text-white/80" />
            <h1 className="text-4xl font-bold font-instrument-serif mb-4">
              Terms & Conditions
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Please read these terms carefully before using Claspire's services.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          {/* Last Updated */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Last Updated:</strong> March 19, 2025
            </p>
          </div>

          {/* Agreement Section */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center gap-3">
              <ShieldCheck className="text-purple-600" size={24} />
              Agreement to Terms
            </h2>
            <div className="space-y-4 text-[#64748B]">
              <p>
                By accessing and using Claspire ("the Platform"), you agree to be bound by these Terms & Conditions 
                and our Privacy Policy. If you do not agree to these terms, please do not use our services.
              </p>
              <p>
                These terms constitute a legally binding agreement between you and Claspire Technologies Private Limited 
                ("Claspire," "we," "us," or "our").
              </p>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center gap-3">
              <Users className="text-blue-600" size={24} />
              User Responsibilities
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Account Information</h3>
                <ul className="list-disc list-inside space-y-2 text-[#64748B]">
                  <li>You must provide accurate, current, and complete information during registration</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                  <li>You must be at least 16 years old to use our services</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Acceptable Conduct</h3>
                <ul className="list-disc list-inside space-y-2 text-[#64748B]">
                  <li>Use the platform for lawful purposes only</li>
                  <li>Respect other users and maintain professional communication</li>
                  <li>Do not share false, misleading, or harmful information</li>
                  <li>Do not attempt to harm, disrupt, or gain unauthorized access to our systems</li>
                  <li>Do not use the platform for spam, harassment, or discriminatory content</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Our Services</h2>
            <div className="space-y-4 text-[#64748B]">
              <p>
                Claspire provides a platform connecting college students with verified seniors for mentorship, 
                career guidance, and professional networking. Our services include:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Community forums and discussion boards</li>
                <li>One-on-one mentorship sessions</li>
                <li>Job referral opportunities</li>
                <li>Career guidance and resources</li>
                <li>College-specific communities</li>
              </ul>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of our services at any time 
                without prior notice.
              </p>
            </div>
          </section>

          {/* Important Notices */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center gap-3">
              <AlertCircle className="text-orange-600" size={24} />
              Important Notices
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Verification Process</h3>
                <p className="text-[#64748B]">
                  While we verify our senior mentors, Claspire is not responsible for the advice or guidance 
                  provided by individual users. Users should exercise their own judgment when following advice.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Limitation of Liability</h3>
                <p className="text-[#64748B]">
                  Claspire shall not be liable for any indirect, incidental, special, or consequential damages 
                  resulting from your use of our services.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Privacy</h3>
                <p className="text-[#64748B]">
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                  use, and protect your information.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Questions or Concerns?</h2>
            <p className="text-[#64748B] mb-6">
              If you have any questions about these Terms & Conditions, please contact us at:
            </p>
            <div className="space-y-2 text-[#0F172A]">
              <p><strong>Email:</strong> claspire.campus@gmail.com</p>
              <p><strong>Phone:</strong> +91 9092322803</p>
              <p><strong>Address:</strong> Claspire Technologies Private Limited, Chennai, Tamil Nadu, India</p>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
