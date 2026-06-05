import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'POSH Training Portal',
  description: 'Prevention of Sexual Harassment — Employee Training Portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
