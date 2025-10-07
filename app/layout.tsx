import type React from "react"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "next-themes"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata = {
  title: "Daily Schedule - Productivity Tracker",
  description: "Manage your daily schedule with advanced productivity features",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Schedulaar",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  themeColor: "#1e3a5f",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable}`}
    >
      <head>
        {/*  Progressive Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/*  Preconnect for faster Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/*  Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@400;600&family=Roboto:wght@400;700&display=swap"
          rel="stylesheet"
        />

        {/*  Favicon + App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />

        {/*  Mobile Web App Meta */}
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Schedule" />

        {/*  SEO & Performance Enhancements */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Schedulaar Team" />
        <meta name="application-name" content="Schedulaar" />
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/*  Color Scheme Support */}
        <meta name="color-scheme" content="light dark" />

        {/*  Viewport for Fullscreen Mobile */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/*  Offline + Installability Support */}
        <meta name="display" content="standalone" />
      </head>

      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
