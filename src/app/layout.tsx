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
  metadataBase: new URL('https://claspire.in'),
  title: {
    default: "Claspire - India's College Senior Community Platform",
    template: "%s | Claspire"
  },
  description: "Connect with verified seniors from your college — get real answers, job referrals, and paid mentorship. Free to start.",
  keywords: [
    "college seniors", 
    "placement help", 
    "mentorship india",
    "job referrals college",
    "indian colleges community",
    "tamil nadu colleges",
    "senior student connect",
    "college placement guidance",
    "engineering college community",
    "college doubts answers"
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Claspire - India's College Senior Community",
    description: "Connect with verified seniors from your college for placement help, referrals and mentorship. Free to start.",
    url: 'https://claspire.in',
    siteName: 'Claspire',
    type: 'website',
    locale: 'en_IN',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Claspire - College Senior Community'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Claspire - India's College Senior Community",
    description: "Connect with verified seniors from your college for placement help and referrals.",
    images: ['/og-image.png'],
  },
  verification: {
    google: 'IOVKErCFX8A3eEZWlSVPpO-TDKxbIQap9sY-NILpRaE',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-JFRRHTC04F"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-JFRRHTC04F');
            `
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Claspire",
              "url": "https://claspire.in",
              "logo": "https://claspire.in/favicon.ico",
              "description": "India's college senior-student community platform connecting students with verified seniors for placement guidance and mentorship.",
              "sameAs": [
                "https://x.com/claspire",
                "https://linkedin.com/company/claspire",
                "https://instagram.com/claspire"
              ]
            })
          }}
        />
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
