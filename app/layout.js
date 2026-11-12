import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "KusinaMatch | Smart Pantry-to-Plate Recipe Recommender",
  description:
    "Check off the ingredients in your pantry and instantly discover recipes you can cook right now, missing-item swaps, and distraction-free Kitchen Mode.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
