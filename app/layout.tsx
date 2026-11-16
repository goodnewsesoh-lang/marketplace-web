import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'

import { AuthDebug } from '@/components/AuthDebug'
import { AuthProvider } from '@/components/AuthProvider'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/config'

import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_TAGLINE,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7C3AED',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <AuthDebug />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
