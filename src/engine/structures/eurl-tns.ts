import type { Bracket, ContributionBreakdown, FamilyStatus, StructureResult, TaxFlow } from "../types";
import { applyProgressiveBrackets, computeQuotientFamilialParts } from "../progressiveBrackets";

interface FranceEurlData {
  incomeTaxBrackets: Bracket[];
  sasu_is: {
    corporateTax: {
      reducedRate: number;
      reducedRateCap: number;
      normalRate: number;
    };
    dividendes: {
      pfu_2026_increased: number;
    };
  };
}

interface EurlInput {
  revenueGross: number;
  businessExpenses: number;   // inclut achats + frais pro hors rému
  remunerationBrute: number;  // rému gérant TNS
  dividendTarget?: number;
  familyStatus: FamilyStatus;
  children: number;
}

// Taux moyen approximatif des cotisations TNS (SSI) sur la rémunération du gérant majoritaire.
// Source : urssaf.fr, secu-independants.fr. ~40% de la rémunération nette de cotisations,
// soit environ ~40% du brut dans cette simulation simplifiée.
const TNS_CONTRIBUTION_RATE_APPROX = 0.40;

// Décomposition objective (TNS gérant majoritaire EURL)
// Santé (maladie-mat) ~9% "effectivelyValuable"
// Retraite base + complémentaire ~17-18% "nominallyValuable"
// CSG/CRDS + allocations familiales sans contrepartie directe ~13% "pureCost"
// Le gérant TNS n'a pas droit au chômage (comme SASU).
const TNS_BREAKDOWN = {
  effectivelyValuable: 0.09 / 0.40, // ~22.5%
  nominallyValuable: 0.18 / 0.40,   // ~45%
  pureCost: 0.13 / 0.40,            // ~32.5%
};

export function calculateEURL_TNS(input: EurlInput, data: FranceEurlData): StructureResult {
  const warnings: string[] = [];

  // 1. Cotisations sociales TNS (SSI) sur rémunération
  const socialContributions = input.remunerationBrute * TNS_CONTRIBUTION_RATE_APPROX;

  const breakdown: ContributionBreakdown = {
    effectivelyValuable: socialContributions * TNS_BREAKDOWN.effectivelyValuable,
    nominallyValuable: socialContributions * TNS_BREAKDOWN.nominallyValuable,
    pureCost: socialContributions * TNS_BREAKDOWN.pureCost,
  };

  // 2. IS société : bénéfice = CA - charges pro - rému - cotisations sociales (charge déductible)
  const profitBeforeIS =
    input.revenueGross - input.businessExpenses - input.remunerationBrute - socialContributions;

  let corporateTax = 0;
  if (profitBeforeIS > 0) {
    const ct = data.sasu_is.corporateTax;
    const reducedSlice = Math.min(profitBeforeIS, ct.reducedRateCap);
    const normalSlice = Math.max(0, profitBeforeIS - ct.reducedRateCap);
    corporateTax = reducedSlice * ct.reducedRate + normalSlice * ct.normalRate;
  }
  const profitAfterIS = Math.max(0, profitBeforeIS - corporateTax);

  // 3. Dividendes (optionnels en EURL TNS — rester simple pour Example 3A qui n'en a pas)
  const dividendDistributed = Math.min(
    Math.max(0, input.dividendTarget ?? 0),
    profitAfterIS
  );
  const pfuRate = data.sasu_is.dividendes.pfu_2026_increased;
  const dividendTax = dividendDistributed * pfuRate;
  const dividendNet = dividendDistributed - dividendTax;

  // 4. IR sur la rémunération (abattement forfaitaire 10%)
  const parts = computeQuotientFamilialParts(input.familyStatus, input.children);
  const taxableIR = input.remunerationBrute * 0.9;
  const taxPerPart = applyProgressiveBrackets(taxableIR / parts, data.incomeTaxBrackets);
  const incomeTax = taxPerPart * parts;

  // 5. Totaux
  const totalTax = socialContributions + corporateTax + dividendTax + incomeTax;

  // Net annuel : rému brute - cotisations - IR + dividende net + résultat net société gardé en réserve
  const retainedEarnings = profitAfterIS - dividendDistributed;
  const netInHand =
    input.remunerationBrute - socialContributions - incomeTax + dividendNet + retainedEarnings;

  // Flow : EURL = gérant TNS assimilable à un salarié particulier.
  // Le "salaire" TNS n'a pas d'employerContrib comme SASU : les cotisations TNS sont sur
  // la rémunération brute et sont déduites du résultat société comme charge.
  const flow: TaxFlow = {
    currency: "EUR",
    revenue: input.revenueGross,
    businessExpenses: input.businessExpenses,
    salaryCost: input.remunerationBrute + socialContributions,
    profitBeforeCorpTax: profitBeforeIS,
    corporateTax,
    profitAfterCorpTax: profitAfterIS,
    dividendGross: dividendDistributed,
    retainedInCompany: retainedEarnings,
    salaryGross: input.remunerationBrute,
    employerContrib: 0, // TNS : pas de distinction patronal/salarial
    employeeContrib: socialContributions,
    salaryNet: input.remunerationBrute - socialContributions,
    salaryIncomeTax: incomeTax,
    salaryTakeHome: input.remunerationBrute - socialContributions - incomeTax,
    dividendTax,
    dividendNet,
    selfEmploymentTax: 0,
    soleIncomeTax: 0,
    otherTaxes: 0,
    totalLevied: totalTax,
    // netTakeHome : ce que le gérant a VRAIMENT en poche (hors réserves société)
    netTakeHome: input.remunerationBrute - socialContributions - incomeTax + dividendNet,
    retainedAmount: retainedEarnings,
  };

  return {
    structure: "EURL à l'IS (gérant TNS)",
    jurisdiction: "FR",
    corporateTax,
    socialContributions,
    socialContributionsBreakdown: breakdown,
    dividendTax,
    incomeTax,
    otherTaxes: 0,
    totalTax,
    netInHand,
    effectiveRate: totalTax / input.revenueGross,
    warnings,
    flow,
  };
}
