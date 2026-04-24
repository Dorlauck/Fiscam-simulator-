import type { StructureResult } from "../engine/types";
import type { CostOfLivingResult } from "../costOfLiving/calculate";
import type { QualityOfLife } from "./qolIndex";

export interface CompositeInputs {
  result: StructureResult;
  col: CostOfLivingResult;
  qol: QualityOfLife;
  /** CA annuel brut, déjà converti en EUR pour comparaison homogène. */
  revenueGrossEUR: number;
  /** Net in hand annuel en EUR (converti depuis la devise locale). */
  netInHandEUR: number;
}

/**
 * Score composite /100. Pondérations (sum = 100) :
 *  - netPurchasingPower : 35 (le plus important)
 *  - taxBurden          : 15
 *  - qualityOfLife      : 15
 *  - visaAccess         : 10
 *  - exitFreedom        : 10
 *  - healthcareReal     : 10
 *  - infrastructure     : 5
 */
export function computeCompositeScore(inputs: CompositeInputs): number {
  const { result, col, qol, revenueGrossEUR, netInHandEUR } = inputs;

  // Cashflow réel après impôt ET après coût de la vie
  const cashflowEUR = netInHandEUR - col.totalAnnual;
  const cashflowRatio = Math.max(0, Math.min(1, cashflowEUR / Math.max(1, revenueGrossEUR)));
  const netScore = cashflowRatio * 10;

  // Tax burden : plus c'est bas, mieux c'est. Un taux effectif de 50% → 0/10.
  const taxScore = Math.max(0, 10 - Math.min(10, result.effectiveRate * 20));

  // QoL synthétique : moyenne healthcare + safety + infra
  const qolScore = (qol.healthcareQuality + qol.safety + qol.infrastructureTech) / 3;

  // Visa access : inversé (0 = ouvert → 10)
  const visaScore = 10 - qol.visaComplexity;
  const exitScore = 10 - qol.exitCostScore;

  const healthScore = qol.healthcareQuality;
  const infraScore = qol.infrastructureTech;

  const weighted =
    netScore * 35 +
    taxScore * 15 +
    qolScore * 15 +
    visaScore * 10 +
    exitScore * 10 +
    healthScore * 10 +
    infraScore * 5;

  // Normalise sur 100 (somme des pondérations = 100, scores sur 10 → ×10 à la fin)
  return Math.round((weighted / 100) * 10 * 10) / 10;
}

export interface VerdictSummary {
  score: number;
  deadWeightLossEUR: number;
  exitTaxRisk: "none" | "low" | "moderate" | "high";
}

export function buildVerdict(inputs: CompositeInputs): VerdictSummary {
  const score = computeCompositeScore(inputs);
  const deadWeightLossEUR = inputs.result.socialContributionsBreakdown.pureCost;
  const exitTaxScore = inputs.qol.exitCostScore;
  let exitTaxRisk: VerdictSummary["exitTaxRisk"] = "none";
  if (exitTaxScore >= 7) exitTaxRisk = "high";
  else if (exitTaxScore >= 5) exitTaxRisk = "moderate";
  else if (exitTaxScore >= 2) exitTaxRisk = "low";
  return { score, deadWeightLossEUR, exitTaxRisk };
}
