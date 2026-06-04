import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import RPNotification from "@/components/RPNotification";
import OneSignalInit from "@/components/OneSignalInit";
import NotificationPrompt from "@/components/NotificationPrompt";
import Navbar from "@/components/Navbar";
import BottomNavbar from "@/components/BottomNavbar";
import { ToastContainer } from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://claspire.in'),
  title: "Claspire | College Senior Community Platform for Indian Students",
  description: "Connect with verified seniors from your own college for real guidance, referrals & mentorship. India's campus peer network — built for college students across Tamil Nadu, Maharashtra, Karnataka and beyond.",
  keywords: [
    "college senior community platform",
    "campus mentorship India",
    "student alumni network",
    "college peer network India",
    "internship referral platform",
    "senior student connect"
  ],
  openGraph: {
    title: "Claspire | College Senior Community Platform for Indian Students",
    description: "Connect with verified seniors from your own college for real guidance, referrals & mentorship.",
    url: "https://claspire.in",
    siteName: "Claspire",
    type: "website",
    locale: 'en_IN',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Claspire - College Senior Community'
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Claspire | College Senior Community Platform for Indian Students",
    description: "Connect with verified seniors from your own college for real guidance, referrals & mentorship.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Claspire",
                "applicationCategory": "SocialNetworkingApplication",
                "operatingSystem": "Web",
                "description": "India's college senior-student community platform. Connect with verified alumni and seniors from your own college for mentorship, referrals, and guidance.",
                "url": "https://claspire.in",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "INR"
                },
                "keywords": "college senior community platform, campus mentorship India, student alumni network, college peer network"
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What is Claspire?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Claspire is India's college senior-student community platform that connects students with verified seniors from their own college for real guidance, referrals, and mentorship."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How is Claspire different from LinkedIn?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Unlike LinkedIn where cold messaging is the norm, Claspire connects you only with seniors from your own college — people who've faced the same professors, placements, and challenges as you."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Which colleges is Claspire available for?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Claspire is available for engineering and arts colleges across India — including colleges in Tamil Nadu, Maharashtra, Karnataka, Delhi, and more states being added regularly."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Is Claspire free to use?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, Claspire is completely free for college students and seniors across India."
                    }
                  }
                ]
              }
            ])
          }}
        />
       </head>
       <body
          className={`${inter.variable} ${plusJakartaSans.variable} antialiased`}
        >
          <Providers>
            <OneSignalInit />
            <NotificationPrompt />
            <RPNotification />
            <Navbar />
            <ToastContainer />
            <main className="min-h-screen">
              {children}
            </main>
            <BottomNavbar />
          </Providers>
        </body>
    </html>
  );
}
