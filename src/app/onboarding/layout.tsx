import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome to Claspire',
  description: 'Complete your profile to get started',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0E14] text-gray-900 dark:text-white flex flex-col relative overflow-hidden">
      {/* Background Soft Blue Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="flex-1 w-full max-w-[600px] mx-auto py-8 px-4 sm:px-6 flex flex-col z-10">
        {children}
      </div>
    </div>
  )
}
