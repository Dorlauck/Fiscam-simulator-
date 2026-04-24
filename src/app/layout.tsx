import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Fiscam Simulator — L'impôt réel, pas celui qu'on t'a promis",
  description:
    "Compare 7 juridictions (Paris, NYC, Californie, Miami, Londres, Malte, Tokyo) sur ce qui te reste vraiment dans la poche en tant qu'entrepreneur. Fiscalité + coût de vie + cotisations objectivement classées.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="site-header">
          <div className="brand">
            <span className="brand-dot" />
            Fiscam
          </div>
          <div className="text-dim mono" style={{ fontSize: "0.8rem" }}>
            données 2026 · avril
          </div>
        </header>
        {children}
        <footer className="footer">
          <p>
            ⚠️ Outil d'aide à la réflexion construit sur des données publiques à date d'avril 2026.
            Ce n'est ni un conseil fiscal, ni un conseil juridique. Consulte un expert-comptable
            ou un avocat fiscaliste avant toute décision d'expatriation.
          </p>
          <p className="text-dim">
            Pas de tracking. Pas de backend. Tout tourne dans ton navigateur.
          </p>
        </footer>
      </body>
    </html>
  );
}
