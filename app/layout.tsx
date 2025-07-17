import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SafeDrop - Secure File Sharing',
  description: 'Share files securely with password protection and automatic expiry',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
