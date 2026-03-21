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
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Claspire - India's College Senior Community Platform",
    description: "Connect with verified seniors from your college — get real answers, job referrals, and paid mentorship.",
    type: "website",
  },
  verification: {
    google: 'IOVKErCFX8A3eEZWlSVPpO-TDKxbIQap9sY-NILpRaE',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
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
