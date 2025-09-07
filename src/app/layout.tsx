//src/app/layout.tsx
import type { Metadata } from 'next';
import { ThirdwebProvider } from "thirdweb/react";
import { Inter } from "next/font/google";
import './globals.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DProject",
  description:
    "Web3 Decentralized Platform for the Future",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThirdwebProvider>
        // Force dark theme  
        <div className="dark-theme">
        {children}
        </div>
        </ThirdwebProvider>
      </body>
    </html>
  );
}