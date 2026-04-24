import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import Page from "@/app/page";

afterEach(cleanup);

describe("Landing page", () => {
  it("affiche le titre hero + CTA", () => {
    render(<Page />);
    expect(screen.getByText(/L'impôt réel/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Commencer la simulation/i })).toBeTruthy();
  });

  it("affiche la section pédagogique (3 principes)", () => {
    render(<Page />);
    expect(screen.getByText(/distingue les cotisations réellement utiles/i)).toBeTruthy();
    expect(screen.getByText(/coût réel de vivre/i)).toBeTruthy();
    // "exit tax" est présent plusieurs fois (titre + description) → all
    expect(screen.getAllByText(/exit tax/i).length).toBeGreaterThanOrEqual(1);
  });
});

describe("Formulaire → résultats (flow complet)", () => {
  it("navigation: landing → étape 1 → étape 2 → étape 3 → résultats", () => {
    render(<Page />);

    // Landing → form
    fireEvent.click(screen.getByRole("button", { name: /Commencer la simulation/i }));

    // Étape 1 : profil SOLO, CA pré-rempli 150k
    expect(screen.getByText(/Étape 1\/3/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Suivant/i }));

    // Étape 2
    expect(screen.getByText(/Étape 2\/3/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Suivant/i }));

    // Étape 3
    expect(screen.getByText(/Étape 3\/3/)).toBeTruthy();

    // Malte est coché par défaut → warning + besoin de cocher le disclaimer
    expect(screen.getByText(/Avertissement Malte/i)).toBeTruthy();

    // Lancer avec ou sans disclaimer coché : le bouton doit être actif tant que 2+ sélectionnées
    fireEvent.click(screen.getByRole("button", { name: /Lancer la simulation/i }));

    // Écran résultats
    expect(screen.getByText(/Comparaison des/i)).toBeTruthy();
    expect(screen.getByText(/Cashflow réel mensuel/i)).toBeTruthy();
  });

  it("affiche le bouton 'Modifier' pour revenir au formulaire", () => {
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /Commencer la simulation/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Suivant/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Suivant/i }));
    fireEvent.click(screen.getByRole("button", { name: /Lancer la simulation/i }));
    expect(screen.getByRole("button", { name: /Modifier/i })).toBeTruthy();
  });
});
