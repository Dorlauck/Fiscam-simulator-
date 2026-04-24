import type { ReactNode } from "react";

export const metadata = {
  title: "Fiscam Simulator",
  description: "Simulateur d'impôts et de pouvoir d'achat pour entrepreneurs",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
