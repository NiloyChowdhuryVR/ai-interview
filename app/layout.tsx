import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
