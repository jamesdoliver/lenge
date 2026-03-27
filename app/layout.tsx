import type { Metadata } from "next";
import { Bebas_Neue, DM_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LENGE",
  description: "Deutschland bekanntester underground hip house rapper",
  metadataBase: new URL("https://lenge.app"),
  openGraph: {
    title: "LENGE",
    description: "Deutschland bekanntester underground hip house rapper",
    images: [{ url: "/images/hero.jpg", width: 4500, height: 2508 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LENGE",
    description: "Deutschland bekanntester underground hip house rapper",
    images: ["/images/hero.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${bebasNeue.variable} ${dmMono.variable} bg-bg text-text-primary antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
