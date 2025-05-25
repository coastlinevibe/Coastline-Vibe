import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import './globals.css';
import Header from '../components/Header';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "CoastlineVibe",
  description: "Your Coastal Community Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${robotoMono.variable} font-sans antialiased bg-gradient-to-br from-sky-100 to-cyan-100 min-h-screen`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
