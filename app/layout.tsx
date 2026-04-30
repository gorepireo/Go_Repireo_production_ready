import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Repireo | Elite Home Services",
  description: "Native-fidelity mobile experience for professional repair and maintenance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#FFFFFF" />
        <style dangerouslySetInnerHTML={{
          __html: `
          :root { color-scheme: light !important; }
          html, body { 
            background-color: #FFFFFF !important; 
            color: #0F172A !important;
            margin: 0;
            padding: 0;
          }
          #root-container { background-color: #FFFFFF !important; }
        ` }} />
      </head>
      <body className={`${inter.className} bg-white text-slate-950`} data-deploy-v="REPIREO-ALPHA-1.2">
        <AuthProvider>
          <CartProvider>
            <div id="root-container" className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 pt-24 md:pt-32">
                {children}
              </main>
              <Footer />
              <BottomNav />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
