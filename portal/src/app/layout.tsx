import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const grift = localFont({
  variable: "--font-grift",
  display: "swap",
  src: [
    { path: "../../public/fonts/Grift-SemiBold.woff2", weight: "600" },
    { path: "../../public/fonts/Grift-Bold.woff2", weight: "700" },
  ],
});

export const metadata: Metadata = {
  title: {
    default: "Client Portal — Melanie Berberette",
    template: "%s — Client Portal",
  },
  description:
    "Sign agreements and follow the progress of your project with Melanie Berberette.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${grift.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
