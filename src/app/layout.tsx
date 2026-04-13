import type { Metadata } from "next";
import "./globals.css";
import { CopilotProvider } from "@/context/CopilotContext";

export const metadata: Metadata = {
  title: "Lexia Analytics · Societario",
  description: "Plataforma de inteligencia jurídica para litigios ante la Superintendencia de Sociedades de Colombia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`bg-lexia-bg text-lexia-black font-sans antialiased h-screen overflow-hidden`}>
        <CopilotProvider>
          {children}
        </CopilotProvider>
      </body>
    </html>
  );
}
