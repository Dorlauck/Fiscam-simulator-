"use client";

import { useState } from "react";
import { useSimulation } from "@/ui/hooks/useSimulation";
import { SimulatorForm } from "@/ui/components/SimulatorForm";
import { ComparisonChart } from "@/ui/components/ComparisonChart";
import { JurisdictionCard } from "@/ui/components/JurisdictionCard";
import { DetailPanel } from "@/ui/components/DetailPanel";
import type { Jurisdiction } from "@/engine/types";
import { formatEUR } from "@/lib/formatters";

type View = "landing" | "form" | "results";

export default function Page() {
  const [view, setView] = useState<View>("landing");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
  const sim = useSimulation();

  // ---- Écran 1 : landing
  if (view === "landing") {
    return (
      <div>
        <section className="container hero">
          <span className="kicker">Avril 2026 · Données officielles</span>
          <h1>L'impôt réel, pas celui qu'on t'a promis.</h1>
          <p className="lede">
            Compare ce qu'il te reste vraiment, dans 7 pays, pour ton profil d'entrepreneur —
            après impôts, cotisations, loyer et bouffe.
          </p>
          <button data-variant="primary" onClick={() => setView("form")}>
            Commencer la simulation →
          </button>
          <p className="text-dim mt-3" style={{ fontSize: "0.85rem" }}>
            On ne te vend rien. Pas d'email. Pas de tracking. Open source.
          </p>
        </section>

        <section className="container" style={{ paddingTop: 0 }}>
          <div className="card">
            <h2>Ce qu'on fait différemment</h2>
            <div className="stack mt-3">
              <div>
                <strong className="text-primary">
                  ✓ Distingue les cotisations réellement utiles des cotisations nominales.
                </strong>
                <p className="text-muted mt-1">
                  Une cotisation retraite qui n'a pas de chance d'être perçue en 2055 pour la
                  génération 30-40 ans n'est pas un avantage, c'est un prélèvement sec. On classe
                  chaque cotisation en <strong className="text-primary">effectivement perçue</strong>,{" "}
                  <strong className="text-warning">nominalement valable</strong>, ou{" "}
                  <strong className="text-danger">pure charge</strong>.
                </p>
              </div>
              <div>
                <strong className="text-primary">✓ Intègre le coût réel de vivre dans chaque ville.</strong>
                <p className="text-muted mt-1">
                  5000 €/mois à Paris ≠ 5000 €/mois à Miami. Le bon indicateur c'est{" "}
                  <em>cashflow disponible après coût de vie standardisé</em>.
                </p>
              </div>
              <div>
                <strong className="text-primary">✓ Affiche l'exit tax et les pièges de sortie.</strong>
                <p className="text-muted mt-1">
                  "Low tax now" peut coûter cher plus tard — exit tax France, IRC 877A US,
                  Temporary Non-Residence Rule UK.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ---- Écran 2 : formulaire
  if (view === "form") {
    return (
      <SimulatorForm
        step={step}
        form={sim.form}
        update={sim.update}
        updateLifestyle={sim.updateLifestyle}
        toggleJurisdiction={sim.toggleJurisdiction}
        onNext={() => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s))}
        onBack={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
        onSubmit={() => setView("results")}
      />
    );
  }

  // ---- Écran 3 : résultats
  const detail = selectedJurisdiction
    ? sim.results.find((r) => r.jurisdiction === selectedJurisdiction) ?? null
    : null;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="text-muted" style={{ fontSize: "0.9rem" }}>
            {sim.form.profile} · CA {formatEUR(sim.form.grossAnnual)} ·{" "}
            {sim.form.familyStatus === "single"
              ? "Célibataire"
              : sim.form.familyStatus === "couple"
                ? "Couple"
                : `Couple + ${sim.form.children} enfant(s)`}
          </div>
          <h1>Comparaison des {sim.results.length} juridictions</h1>
        </div>
        <div className="row">
          <button
            data-variant="ghost"
            onClick={() => {
              setView("form");
              setStep(1);
              setSelectedJurisdiction(null);
            }}
          >
            ← Modifier
          </button>
        </div>
      </div>

      {sim.results.length === 0 ? (
        <div className="card mt-3">
          <p className="text-muted">
            Aucune juridiction active. Retourne à l'étape 3 et coche au moins une juridiction.
            Rappel : Malte nécessite une confirmation explicite.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3">
            <ComparisonChart results={sim.results} onSelect={setSelectedJurisdiction} />
          </div>

          <h2 className="mt-4">Fiches juridictions</h2>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>
            Clique sur une fiche pour voir la décomposition complète.
          </p>
          <div className="grid-3 mt-3">
            {sim.results.map((r, i) => (
              <JurisdictionCard
                key={r.jurisdiction}
                data={r}
                rank={i}
                onClick={() => setSelectedJurisdiction(r.jurisdiction)}
              />
            ))}
          </div>

          {detail && (
            <div className="mt-4">
              <DetailPanel
                data={detail}
                revenueGrossEUR={sim.form.grossAnnual}
                onClose={() => setSelectedJurisdiction(null)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
