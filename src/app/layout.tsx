import type { ReactNode } from "react";
import "./globals.css";
import { I18nProvider } from "@/ui/hooks/useI18n";
import { SiteChrome } from "@/ui/components/SiteChrome";

export const metadata = {
  title: "Fiscam Simulator — L'impôt réel, pas celui qu'on t'a promis",
  description:
    "Compare 7 juridictions (Paris, NYC, Californie, Miami, Londres, Malte, Tokyo) sur ce qui te reste vraiment dans la poche en tant qu'entrepreneur.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <I18nProvider>
          <SiteChrome>{children}</SiteChrome>
        </I18nProvider>
      </body>
    </html>
  );
}
