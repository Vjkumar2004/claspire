import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CollegeBar from '@/components/CollegeBar';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import SocialProof from '@/components/SocialProof';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claspire — India's College Senior Community Platform",
  description: "India's #1 college community platform. Connect with verified seniors from your college for placement help, job referrals and mentorship. Free to join.",
  keywords: [
    "college community platform india",
    "college senior community",
    "student community platform",
    "college placement community",
    "tamil nadu college community",
    "senior junior college connect",
  ],
  alternates: {
    canonical: "https://claspire.in",
  },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <CollegeBar />
      <Features />
      <HowItWorks />
      <SocialProof />
      <CTA />
      <Footer />
    </div>
  );
}
