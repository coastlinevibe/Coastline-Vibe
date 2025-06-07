import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import './globals.css';
import Header from '../components/Header';
import PointerModeToggle from '../components/PointerModeToggle';
import { NotificationProvider } from '@/context/NotificationContext';
import DevelopmentPortRedirect from '@/components/ui/DevelopmentPortRedirect';

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
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
        className={`${montserrat.variable} ${openSans.variable} font-body antialiased bg-sand min-h-screen`}
      >
        {/* Development port redirect to ensure API calls work correctly */}
        <DevelopmentPortRedirect />
        
        {/* Show PointerModeToggle only on mobile, top left */}
        <div className="fixed top-4 left-4 z-[10000] block md:hidden">
          <PointerModeToggle />
        </div>
        <NotificationProvider>
          <Header />
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
