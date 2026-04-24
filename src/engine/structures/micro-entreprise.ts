import type { Bracket, ContributionBreakdown, FamilyStatus, StructureResult } from "../types";
import { applyProgressiveBrackets, computeQuotientFamilialParts } from "../progressiveBrackets";

type MicroActivity = "sales_BIC" | "services_BIC" | "liberal_BNC_nonCipav" | "liberal_BNC_cipav";

interface FranceMicroData {
  incomeTaxBrackets: Bracket[];
  microEntreprise: {
    revenueLimits: Record<string, number>;
    socialContributionRates: Record<string, number>;
    breakdownBNC: {
      healthAccessible_effectivelyValuable: number;
      retirement_nominallyValuable: number;
      csg_crds_pureCost: number;
    };
    abattementForfaitaire: { sales_BIC: number; services_BIC: number; BNC: number };
    cfp: { rate_liberal: number; rate_services: number; rate_artisan: number };
  };
}

interface MicroInput {
  revenueGross: number;
  activity: MicroActivity;
  familyStatus: FamilyStatus;
  children: number;
  applyACRE?: boolean;
}

// Plafond par activité (source: economie.gouv.fr / urssaf)
// BIC ventes: 203 100€ ; BIC services + BNC: 83 600€
function revenueCapFor(activity: MicroActivity, data: FranceMicroData): number {
  switch (activity) {
    case "sales_BIC":
      return data.microEntreprise.revenueLimits.sales_BIC;
    case "services_BIC":
    case "liberal_BNC_nonCipav":
    case "liberal_BNC_cipav":
      return data.microEntreprise.revenueLimits.services_BIC_BNC;
  }
}

function contribRateFor(activity: MicroActivity, data: FranceMicroData): number {
  return data.microEntreprise.socialContributionRates[activity];
}

function abatementFor(activity: MicroActivity, data: FranceMicroData): number {
  if (activity === "sales_BIC") return data.microEntreprise.abattementForfaitaire.sales_BIC;
  if (activity === "services_BIC") return data.microEntreprise.abattementForfaitaire.services_BIC;
  return data.microEntreprise.abattementForfaitaire.BNC;
}

// CFP rate: liberal pour BNC, services pour BIC services, artisan pour BIC ventes
function cfpRateFor(activity: MicroActivity, data: FranceMicroData): number {
  if (activity.startsWith("liberal_BNC")) return data.microEntreprise.cfp.rate_liberal;
  if (activity === "services_BIC") return data.microEntreprise.cfp.rate_services;
  return data.microEntreprise.cfp.rate_artisan;
}

export function calculateMicroEntreprise(
  input: MicroInput,
  data: FranceMicroData
): StructureResult {
  const warnings: string[] = [];
  const cap = revenueCapFor(input.activity, data);

  if (input.revenueGross > cap) {
    return {
      structure: "micro-entreprise",
      jurisdiction: "FR",
      corporateTax: 0,
      socialContributions: 0,
      socialContributionsBreakdown: { effectivelyValuable: 0, nominallyValuable: 0, pureCost: 0 },
      dividendTax: 0,
      incomeTax: 0,
      otherTaxes: 0,
      totalTax: 0,
      netInHand: 0,
      effectiveRate: 0,
      warnings: [
        `À ${input.revenueGross.toLocaleString("fr-FR")}€ vous dépassez le plafond micro-entreprise (${cap.toLocaleString("fr-FR")}€). Simulation à effectuer en EURL ou SASU.`,
      ],
      capExceeded: true,
      suggestedStructure: "SASU",
    };
  }

  // Cotisations sociales
  let contribRate = contribRateFor(input.activity, data);
  if (input.applyACRE) contribRate = contribRate * 0.5; // approx 50% discount
  const socialContributions = input.revenueGross * contribRate;

  // Contribution à la formation professionnelle (CFP)
  const cfp = input.revenueGross * cfpRateFor(input.activity, data);

  // Décomposition objective (utilise le breakdown BNC pour les activités libérales)
  const breakdown: ContributionBreakdown = (() => {
    if (input.activity.startsWith("liberal_BNC")) {
      const b = data.microEntreprise.breakdownBNC;
      return {
        effectivelyValuable: input.revenueGross * b.healthAccessible_effectivelyValuable,
        nominallyValuable: input.revenueGross * b.retirement_nominallyValuable,
        pureCost: input.revenueGross * b.csg_crds_pureCost,
      };
    }
    // Pour les BIC services/ventes, approximation proportionnelle au BNC
    const total = socialContributions;
    return {
      effectivelyValuable: total * 0.29,
      nominallyValuable: total * 0.38,
      pureCost: total * 0.33,
    };
  })();

  // Impôt sur le revenu — abattement forfaitaire + barème progressif avec QF
  const abat = abatementFor(input.activity, data);
  const taxableIR = input.revenueGross * (1 - abat);
  const parts = computeQuotientFamilialParts(input.familyStatus, input.children);
  const taxPerPart = applyProgressiveBrackets(taxableIR / parts, data.incomeTaxBrackets);
  const incomeTax = taxPerPart * parts;

  const totalTax = socialContributions + cfp + incomeTax;
  const netInHand = input.revenueGross - totalTax;

  return {
    structure: "micro-entreprise",
    jurisdiction: "FR",
    corporateTax: 0,
    socialContributions,
    socialContributionsBreakdown: breakdown,
    dividendTax: 0,
    incomeTax,
    otherTaxes: cfp,
    totalTax,
    netInHand,
    effectiveRate: totalTax / input.revenueGross,
    warnings,
  };
}
