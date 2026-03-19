import type { Metadata } from "next";
import JsonLd from "../components/seo/JsonLd";
import "./globals.css";

export const metadata: Metadata = {
  title: "Schizostimmys★彡",
  description: "Join the Schizostimmys network - a schizo-kawaii collection launching June 2026 on Ethereum. Sign up for phase 3 whitelist now! Limited spots available.",
  keywords: ["NFT", "Ethereum", "generative art", "crypto art", "blockchain", "digital collectibles", "Schizostimmys"],
  authors: [{ name: "Schizostimmys" }],
  creator: "Schizostimmys",
  publisher: "Schizostimmys",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://schizostimmys.xyz'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Schizostimmys",
    description: "Join the Schizostimmys network - a schizo-kawaii collection launching June 2026 on Ethereum. Sign up for phase 3 whitelist now! Limited spots available.",
    url: 'https://schizostimmys.xyz',
    siteName: 'Schizostimmys',
    images: [
      {
        url: '/schizostimmys-logo.png',
        width: 1200,
        height: 630,
        alt: 'Schizostimmys',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Schizostimmys',
    description: 'Join the Schizostimmys network - a schizo-kawaii collection launching June 2026 on Ethereum. Sign up for phase 3 whitelist now! Limited spots available.',
    images: ['/schizostimmys-logo.png'],
    creator: '@schizostimmys',
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/w95fa.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
      </head>
      <body className="font-pixel" suppressHydrationWarning>{children}</body>
    </html>
  );
}
