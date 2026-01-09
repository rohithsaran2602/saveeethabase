import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'SaveethaBase - Academic Resource Platform',
  description: 'Access CIA papers, study materials, lab records, and more',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense Verification Code */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6181398572220661"
          crossOrigin="anonymous"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
