import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { AppShell } from '@/components/app-shell'

export const metadata: Metadata = {
  title: 'FlatFit — Find your kind of home',
  description: 'The compatibility-first way to find flatmates in India.',
  generator: 'FlatFit',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F4EFE6',
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
