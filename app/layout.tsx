import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Interviewer | Voice-to-Voice Technical Interviews",
  description:
    "Practice technical interviews with an AI interviewer. Get real-time voice-to-voice feedback on React, Next.js, HTML, CSS, JavaScript, and TypeScript.",
  keywords: [
    "AI interviewer",
    "technical interview",
    "React",
    "Next.js",
    "voice interview",
    "coding interview",
  ],
};

import BackgroundEffects from '@/components/BackgroundEffects';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} antialiased`}>
      <body>
        <BackgroundEffects />
        {children}
      </body>
    </html>
  );
}
