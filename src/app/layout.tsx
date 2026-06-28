import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import RPNotification from "@/components/RPNotification";
import OneSignalInit from "@/components/OneSignalInit";
import { NotificationPromptProvider } from "@/contexts/NotificationPromptContext";
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
  title: "Claspire | Connect with Seniors, Find Jobs & Get Referrals",
  description: "Claspire helps college students connect with verified seniors, discover jobs, get referrals, and grow their professional network within their campus community.",
  keywords: [
    "college senior community platform",
    "campus mentorship India",
    "student alumni network",
    "college peer network India",
    "internship referral platform",
    "senior student connect"
  ],
  icons: {
    icon: [
      {
        url: "/favicon.ico"
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png"
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Claspire | Connect with Seniors, Find Jobs & Get Referrals",
    description: "Claspire helps college students connect with verified seniors, discover jobs, get referrals, and grow their professional network within their campus community.",
    url: "https://claspire.in",
    siteName: "Claspire",
    type: "website",
    locale: 'en_IN',
    images: [{
      url: 'https://claspire.in/android-chrome-512x512.png',
      width: 512,
      height: 512,
      alt: 'Claspire - Connect with Seniors, Find Jobs & Get Referrals'
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Claspire | Connect with Seniors, Find Jobs & Get Referrals",
    description: "Claspire helps college students connect with verified seniors, discover jobs, get referrals, and grow their professional network within their campus community.",
    images: ['https://claspire.in/android-chrome-512x512.png'],
  },
  verification: {
    google: 'IOVKErCFX8A3eEZWlSVPpO-TDKxbIQap9sY-NILpRaE',
  },
  alternates: {
    canonical: 'https://claspire.in'
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
    <html lang="en" suppressHydrationWarning>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Claspire",
                "url": "https://claspire.in",
                "logo": "https://claspire.in/android-chrome-512x512.png",
                "sameAs": [
                  "https://x.com/claspire",
                  "https://linkedin.com/company/claspire",
                  "https://instagram.com/claspire"
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Claspire",
                "url": "https://claspire.in",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://claspire.in/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            ])
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
            <NotificationPromptProvider>
            <RPNotification />
            <Navbar />
            <ToastContainer />
            <main className="min-h-screen pt-14">
              {children}
            </main>
            <BottomNavbar />
            </NotificationPromptProvider>
          </Providers>
        </body>
    </html>
  );
}
