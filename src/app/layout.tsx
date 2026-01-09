import type { Metadata } from 'next'
import { Poppins, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import { GlobalLoader } from '@/components/global-loader'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

import { API_CONFIG } from '@/config/api';

export const metadata: Metadata = {
  title: {
    default: 'Scrap Collection Admin - Manage Your Scrap Collection Business',
    template: '%s | Scrap Collection Admin'
  },
  description: 'Comprehensive admin dashboard for scrap collection service. Manage leads, customers, orders, and track your business performance in real-time.',
  keywords: ['scrap collection', 'admin dashboard', 'business management', 'scrap management', 'recycling'],
  authors: [{ name: 'Scrap Collection Team' }],
  creator: 'Scrap Collection',
  publisher: 'Scrap Collection',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(API_CONFIG.APP_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Scrap Collection Admin - Manage Your Scrap Collection Business',
    description: 'Comprehensive admin dashboard for scrap collection service. Manage leads, customers, orders, and track your business performance in real-time.',
    url: '/',
    siteName: 'Scrap Collection Admin',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scrap Collection Admin',
    description: 'Comprehensive admin dashboard for scrap collection service',
    creator: '@scrapcollection',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${jakarta.variable} font-jakarta antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
          <GlobalLoader />
        </Providers>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  )
}