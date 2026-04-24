import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/ui/hooks/useI18n";
import { SiteChrome } from "@/ui/components/SiteChrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Fiscam — L'impôt réel, pas celui qu'on t'a promis",
  description:
    "Compare 7 juridictions (Paris, NYC, Californie, Miami, Londres, Malte, Tokyo) sur ce qui te reste vraiment dans la poche en tant qu'entrepreneur.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <I18nProvider>
          <SiteChrome>{children}</SiteChrome>
        </I18nProvider>
      </body>
    </html>
  );
}
