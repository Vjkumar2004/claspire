import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | Claspire",
  description: "Find answers to frequently asked questions about Claspire — college community platform, mentorship, referrals, and more.",
  alternates: {
    canonical: "https://claspire.in/help-center",
  },
  openGraph: {
    title: "Help Center | Claspire",
    description: "Frequently asked questions about Claspire.",
    url: "https://claspire.in/help-center",
    type: "website",
  },
}

export default function HelpCenterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
