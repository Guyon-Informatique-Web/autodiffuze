import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Autodiffuze - Vos annonces, partout, automatiquement",
    template: "%s - Autodiffuze",
  },
  description: "Outil de diffusion automatique d'annonces multi-plateformes avec adaptation IA",
  keywords: [
    "diffusion automatique",
    "reseaux sociaux",
    "multi-plateformes",
    "IA",
    "publication automatique",
    "Facebook",
    "Instagram",
    "LinkedIn",
    "TikTok",
    "SaaS",
  ],
  authors: [{ name: "Guyon Informatique & Web", url: "https://guyon-informatique-web.fr" }],
  creator: "Guyon Informatique & Web",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Autodiffuze",
    title: "Autodiffuze - Vos annonces, partout, automatiquement",
    description: "Outil de diffusion automatique d'annonces multi-plateformes avec adaptation IA",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Autodiffuze" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Autodiffuze - Vos annonces, partout, automatiquement",
    description: "Outil de diffusion automatique d'annonces multi-plateformes avec adaptation IA",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
