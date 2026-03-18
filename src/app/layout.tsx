import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PointsProvider } from "@/contexts/PointsContext";
import RPNotification from "@/components/RPNotification";
import OneSignalInit from "@/components/OneSignalInit";
import BottomNavbar from "@/components/BottomNavbar";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Claspire - India's College Senior Community Platform",
  description: "Connect with verified seniors from your college — get real answers, job referrals, and paid mentorship. Free to start.",
  keywords: ["college seniors", "placement", "mentorship", "job referrals", "indian colleges"],
  icons: {
    icon: "/claspire-logo.jpeg",
    shortcut: "/claspire-logo.jpeg",
    apple: "/claspire-logo.jpeg",
  },
  openGraph: {
    title: "Claspire - India's College Senior Community Platform",
    description: "Connect with verified seniors from your college — get real answers, job referrals, and paid mentorship.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${plusJakartaSans.variable} antialiased`}
      >
        <AuthProvider>
          <PointsProvider>
            <OneSignalInit />
            <RPNotification />
            {children}
            <BottomNavbar />
          </PointsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
