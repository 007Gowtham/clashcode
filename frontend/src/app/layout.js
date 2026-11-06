import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter",
});

export const metadata = {
  title: "ClashCode",
  description: "ClashCode: Real-time multiplayer competitive coding platform with live test case execution and scoring.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full w-full overflow-hidden flex flex-col bg-[var(--paper)] text-[var(--ink)]">
        <AuthProvider>
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          <main className="flex-1 min-h-0 h-full w-full overflow-hidden flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
