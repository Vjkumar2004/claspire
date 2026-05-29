'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, Database, ArrowLeft, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
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
      <div className="bg-gradient-to-br from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <ShieldCheck className="w-16 h-16 mx-auto mb-6 text-white/80" />
            <h1 className="text-4xl font-bold font-instrument-serif mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Your privacy is our priority. Learn how we collect, use, and protect your information.
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
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-800">
              <strong>Last Updated:</strong> March 19, 2025
            </p>
          </div>

          {/* Introduction */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Our Commitment to Privacy</h2>
            <div className="space-y-4 text-[#64748B]">
              <p>
                At Claspire, we are committed to protecting your personal information and respecting your privacy. 
                This Privacy Policy explains how we collect, use, share, and protect your information when you use 
                our platform and services.
              </p>
              <p>
                By using Claspire, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center gap-3">
              <Database className="text-blue-600" size={24} />
              Information We Collect
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 text-[#64748B]">
                  <li>Name, email address, and phone number</li>
                  <li>Educational information (college, year, branch)</li>
                  <li>Professional information (company, designation for seniors)</li>
                  <li>Profile picture and bio</li>
                  <li>LinkedIn profile and other social media links</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Usage Information</h3>
                <ul className="list-disc list-inside space-y-2 text-[#64748B]">
                  <li>Pages visited and time spent on our platform</li>
                  <li>Posts, comments, and interactions within communities</li>
                  <li>Messages and communication with other users</li>
                  <li>Search queries and preferences</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Technical Information</h3>
                <ul className="list-disc list-inside space-y-2 text-[#64748B]">
                  <li>IP address and device information</li>
                  <li>Browser type and operating system</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Unique device identifiers</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center gap-3">
              <Eye className="text-purple-600" size={24} />
              How We Use Your Information
            </h2>
            <div className="space-y-4">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 text-[#64748B]">
                <li>Provide and maintain our services</li>
                <li>Connect you with relevant mentors and opportunities</li>
                <li>Personalize your experience and content recommendations</li>
                <li>Communicate with you about our services</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations</li>
                <li>Improve our services and develop new features</li>
              </ul>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center gap-3">
              <Lock className="text-green-600" size={24} />
              Information Sharing & Protection
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-3">When We Share Information</h3>
                <p className="text-[#64748B] mb-3">We may share your information only in the following circumstances:</p>
                <ul className="list-disc list-inside space-y-2 text-[#64748B]">
                  <li>With your explicit consent</li>
                  <li>With other users for community interactions (your public profile)</li>
                  <li>With trusted service providers who help us operate our platform</li>
                  <li>When required by law or to protect our rights</li>
                  <li>In connection with a business transaction (merger, acquisition, etc.)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Data Security</h3>
                <p className="text-[#64748B]">
                  We implement appropriate technical and organizational measures to protect your information 
                  against unauthorized access, alteration, disclosure, or destruction. These include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[#64748B] mt-2">
                  <li>SSL encryption for data transmission</li>
                  <li>Secure data storage and access controls</li>
                  <li>Regular security audits and updates</li>
                  <li>Employee training on data protection</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Your Privacy Rights</h2>
            <div className="space-y-4 text-[#64748B]">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of marketing communications</li>
                <li>Restrict processing of your information</li>
                <li>Data portability (receive your data in a structured format)</li>
              </ul>
              <p>
                To exercise these rights, please contact us at claspire.community@gmail.com. We will respond to your 
                request within 30 days.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Contact Us</h2>
            <p className="text-[#64748B] mb-6">
              If you have any questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="text-blue-600" size={20} />
                <span className="text-[#0F172A]">claspire.community@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-green-600" size={20} />
                <span className="text-[#0F172A]">+91 9092322803</span>
              </div>
            </div>
            <div className="mt-4 text-[#0F172A]">
              <p><strong>Address:</strong> Claspire Technologies Private Limited</p>
              <p>Chennai, Tamil Nadu, India - 600001</p>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
