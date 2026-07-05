import type { Metadata } from "next";
import { Bitter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppConfigProvider } from "@/components/providers/AppConfigProvider";
import { CustomerAuthProvider } from "@/components/providers/CustomerAuthProvider";

const bitter = Bitter({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inventario & Finanzas",
  description: "Sistema de gestión de inventario, finanzas y tienda online configurable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={bitter.variable}>
      <body>
        <ThemeProvider>
          <AppConfigProvider>
            <CustomerAuthProvider>{children}</CustomerAuthProvider>
          </AppConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
