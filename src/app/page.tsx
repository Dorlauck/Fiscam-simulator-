"use client";

import { useState } from "react";
import { useSimulation } from "@/ui/hooks/useSimulation";
import { useI18n } from "@/ui/hooks/useI18n";
import { SimulatorForm } from "@/ui/components/SimulatorForm";
import { ComparisonChart } from "@/ui/components/ComparisonChart";
import { JurisdictionCard } from "@/ui/components/JurisdictionCard";
import { DetailPanel } from "@/ui/components/DetailPanel";
import { ExportPdfButton } from "@/ui/components/ExportPdfButton";
import { SalaryVsDividend } from "@/ui/components/SalaryVsDividend";
import { ResultsHero } from "@/ui/components/ResultsHero";
import type { Jurisdiction } from "@/engine/types";
import { formatEUR } from "@/lib/formatters";

type View = "landing" | "form" | "results";

export default function Page() {
  const [view, setView] = useState<View>("landing");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
  const sim = useSimulation();
  const { t, locale } = useI18n();
  const L = (fr: string, en: string) => (locale === "en" ? en : fr);

  if (view === "landing") {
    return (
      <div>
        <section className="container hero">
          <span className="kicker">{t("landing.kicker")}</span>
          <h1>{t("landing.hero.title")}</h1>
          <p className="lede">{t("landing.hero.lede")}</p>
          <button data-variant="primary" onClick={() => setView("form")}>
            {t("landing.cta.start")}
          </button>
          <p className="text-dim mt-3" style={{ fontSize: "0.85rem" }}>
            {t("landing.promise.noTracking")}
          </p>
        </section>

        <section className="container" style={{ paddingTop: 0 }}>
          <div className="card">
            <h2>{t("landing.principles.title")}</h2>
            <div className="stack mt-3">
              <div>
                <strong className="text-primary">{t("landing.principle1.title")}</strong>
                <p
                  className="text-muted mt-1"
                  dangerouslySetInnerHTML={{
                    __html: t("landing.principle1.body").replace(
                      /\*\*(.+?)\*\*/g,
                      "<strong>$1</strong>"
                    ),
                  }}
                />
              </div>
              <div>
                <strong className="text-primary">{t("landing.principle2.title")}</strong>
                <p
                  className="text-muted mt-1"
                  dangerouslySetInnerHTML={{
                    __html: t("landing.principle2.body").replace(/\*(.+?)\*/g, "<em>$1</em>"),
                  }}
                />
              </div>
              <div>
                <strong className="text-primary">{t("landing.principle3.title")}</strong>
                <p className="text-muted mt-1">{t("landing.principle3.body")}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

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

  const detail = selectedJurisdiction
    ? sim.results.find((r) => r.jurisdiction === selectedJurisdiction) ?? null
    : null;

  const familyLabel =
    sim.form.familyStatus === "single"
      ? t("form.family.single")
      : sim.form.familyStatus === "couple"
        ? t("form.family.couple")
        : t("form.family.couple_children");

  const frResult = sim.results.find((r) => r.jurisdiction === "FR");

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "4px" }}>
            {sim.form.profile} · {formatEUR(sim.form.grossAnnual)} · {familyLabel}
          </div>
          <h1 style={{ fontSize: "1.8rem" }}>{t("results.title", { n: sim.results.length })}</h1>
        </div>
        <div className="row">
          <ExportPdfButton results={sim.results} form={sim.form} />
          <button
            data-variant="ghost"
            onClick={() => {
              setView("form");
              setStep(1);
              setSelectedJurisdiction(null);
            }}
          >
            {t("results.edit")}
          </button>
        </div>
      </div>

      {sim.results.length === 0 ? (
        <div className="card">
          <p className="text-muted">{t("results.empty")}</p>
        </div>
      ) : (
        <>
          {/* ---- Hero : le chiffre clé en grand ---- */}
          <ResultsHero topResult={sim.results[0]} revenueGrossEUR={sim.form.grossAnnual} />

          {/* ---- Chart comparatif ---- */}
          <div className="mt-5">
            <ComparisonChart results={sim.results} onSelect={setSelectedJurisdiction} />
          </div>

          {/* ---- Grille des cartes juridictions ---- */}
          <h2 className="mt-6">{t("results.cards.title")}</h2>
          <p className="text-muted" style={{ fontSize: "0.9rem", marginTop: "4px" }}>
            {t("results.cards.hint")}
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

          {/* ---- Salary vs Dividend (affiché si FR est dans les résultats) ---- */}
          {frResult && (
            <div className="mt-6">
              <SalaryVsDividend
                currentSalaryGross={sim.form.salaryBrutAnnual}
                profitBeforeIS={frResult.flowEUR.profitBeforeCorpTax}
              />
            </div>
          )}

          {/* ---- Détail juridiction sélectionnée ---- */}
          {detail && (
            <div className="mt-6">
              <DetailPanel
                data={detail}
                revenueGrossEUR={sim.form.grossAnnual}
                onClose={() => setSelectedJurisdiction(null)}
              />
            </div>
          )}

          {/* ---- Footer pédagogique ---- */}
          <div className="card mt-6" style={{ background: "var(--bg-inset)" }}>
            <h4 style={{ marginBottom: "8px" }}>
              {L("Comment lire ces résultats ?", "How to read these results?")}
            </h4>
            <p className="text-muted" style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>
              {L(
                "Le cashflow mensuel disponible = ce qui te reste après impôts, cotisations sociales, ET coût de vie standardisé (panier commun : logement, alimentation, transport, santé, utilities). Le score composite /100 pondère pouvoir d'achat (35%), pression fiscale (15%), qualité de vie (15%), accès visa (10%), liberté de sortie (10%), santé réelle (10%), infrastructures (5%).",
                "Available monthly cashflow = what you keep after taxes, social contributions, AND a standardized cost-of-living basket (common basket: housing, food, transport, health, utilities). The composite score /100 weights purchasing power (35%), tax burden (15%), quality of life (15%), visa access (10%), exit freedom (10%), real healthcare (10%), infrastructure (5%)."
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
