"use client";

import { useMemo, useState } from "react";
import type { Jurisdiction, LifestyleInput, Profile, StructureResult, TaxFlow } from "@/engine/types";
import { calculateTax } from "@/engine/calculateTax";
import { flowToEUR } from "@/engine/flow";
import { calculateCostOfLiving, type CostOfLivingResult } from "@/costOfLiving/calculate";
import { getQualityOfLife, type QualityOfLife } from "@/scoring/qolIndex";
import { buildVerdict, type VerdictSummary } from "@/scoring/composite";
import { generateProsCons, type ProsCons } from "@/scoring/prosCons";

export interface FormState {
  profile: Profile;
  grossAnnual: number;
  businessExpenses: number;
  familyStatus: "single" | "couple" | "couple_children";
  children: number;
  age: number;
  /** Salaire brut annuel versé au dirigeant (France SASU). 0 = aucun salaire. */
  salaryBrutAnnual: number;
  /** Dividende net souhaité (après PFU) pour SASU France. 0 = pas de dividendes. */
  dividendNetTarget: number;
  lifestyle: LifestyleInput;
  jurisdictions: Jurisdiction[];
  maltaAcknowledged: boolean;
}

export interface JurisdictionResult {
  jurisdiction: Jurisdiction;
  /** Résultat brut du moteur — dans la devise locale. Ne pas afficher directement. */
  result: StructureResult;
  /** Flow fiscal détaillé, converti en EUR pour affichage. */
  flowEUR: TaxFlow;
  col: CostOfLivingResult;
  qol: QualityOfLife;
  verdict: VerdictSummary;
  prosCons: ProsCons;
  netAfterColAnnualEUR: number;
  netAfterColMonthlyEUR: number;
  netInHandEUR: number;
}

const DEFAULT_STATE: FormState = {
  profile: "SOLO",
  grossAnnual: 150_000,
  businessExpenses: 10_000,
  familyStatus: "single",
  children: 0,
  age: 35,
  salaryBrutAnnual: 45_000,
  dividendNetTarget: 20_000,
  lifestyle: {
    housingType: "t2",
    location: "center",
    carOwnership: false,
    privateHealthcare: true,
    diningOutFrequency: "medium",
  },
  jurisdictions: ["FR", "US_NY", "US_CA", "US_FL_MIAMI", "MT", "JP", "UK"],
  maltaAcknowledged: false,
};

const EXCHANGE = { EUR_USD: 1.09, EUR_GBP: 0.83, EUR_JPY: 163 };

function toEur(amount: number, jurisdiction: Jurisdiction): number {
  if (jurisdiction === "US_NY" || jurisdiction === "US_CA" || jurisdiction === "US_FL_MIAMI")
    return amount / EXCHANGE.EUR_USD;
  if (jurisdiction === "UK") return amount / EXCHANGE.EUR_GBP;
  if (jurisdiction === "JP") return amount / EXCHANGE.EUR_JPY;
  return amount;
}

export function useSimulation() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateLifestyle = <K extends keyof LifestyleInput>(key: K, value: LifestyleInput[K]) =>
    setForm((f) => ({ ...f, lifestyle: { ...f.lifestyle, [key]: value } }));

  const toggleJurisdiction = (j: Jurisdiction) =>
    setForm((f) => ({
      ...f,
      jurisdictions: f.jurisdictions.includes(j)
        ? f.jurisdictions.filter((x) => x !== j)
        : [...f.jurisdictions, j],
    }));

  const results: JurisdictionResult[] = useMemo(() => {
    // Filtre Malte si non acknowledged
    const activeJurisdictions = form.jurisdictions.filter((j) =>
      j === "MT" ? form.maltaAcknowledged : true
    );

    return activeJurisdictions
      .map<JurisdictionResult>((j) => {
        const result = calculateTax({
          profile: form.profile,
          revenue: {
            grossAnnual: form.grossAnnual,
            businessExpensesAnnual: form.businessExpenses,
          },
          compensation: {
            salaryBrutAnnual: form.salaryBrutAnnual,
            dividendNetTarget: form.dividendNetTarget,
          },
          personal: {
            familyStatus: form.familyStatus,
            children: form.children,
            age: form.age,
          },
          jurisdiction: j,
        });
        const col = calculateCostOfLiving({
          jurisdiction: j,
          lifestyle: form.lifestyle,
          age: form.age,
        });
        const qol = getQualityOfLife(j);

        // Conversion EN MASSE du flow en EUR — plus aucune valeur locale ne fuit vers l'UI
        const flowEUR = flowToEUR(result.flow);
        const netInHandEUR = flowEUR.netTakeHome;
        const verdict = buildVerdict({
          result,
          col,
          qol,
          revenueGrossEUR: form.grossAnnual,
          netInHandEUR,
        });
        const prosCons = generateProsCons({
          result,
          col,
          qol,
          revenueGrossEUR: form.grossAnnual,
        });
        const netAfterColAnnualEUR = netInHandEUR - col.totalAnnual;
        return {
          jurisdiction: j,
          result,
          flowEUR,
          col,
          qol,
          verdict,
          prosCons,
          netAfterColAnnualEUR,
          netAfterColMonthlyEUR: netAfterColAnnualEUR / 12,
          netInHandEUR,
        };
      })
      .sort((a, b) => b.netAfterColMonthlyEUR - a.netAfterColMonthlyEUR);
  }, [form]);

  return {
    form,
    update,
    updateLifestyle,
    toggleJurisdiction,
    results,
    reset: () => setForm(DEFAULT_STATE),
  };
}
