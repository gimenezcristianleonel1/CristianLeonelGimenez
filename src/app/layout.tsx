import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppConfigProvider } from "@/components/providers/AppConfigProvider";

export const metadata: Metadata = {
  title: "Inventario & Finanzas",
  description: "Sistema de gestión de inventario, finanzas y tienda online configurable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          <AppConfigProvider>{children}</AppConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
