import type { Bracket, ContributionBreakdown, FamilyStatus, StructureResult } from "../types";
import { applyProgressiveBrackets, computeQuotientFamilialParts } from "../progressiveBrackets";

interface FranceSasuData {
  incomeTaxBrackets: Bracket[];
  sasu_is: {
    corporateTax: {
      reducedRate: number;
      reducedRateCap: number;
      normalRate: number;
    };
    presidentAssimileSalarie: {
      employerContributions_approx: number;
      employeeContributions_approx: number;
      breakdown: {
        health_effectivelyValuable: number;
        retirement_nominallyValuable: number;
        unemployment_notApplicableToFounder: number;
        familyBenefits_nominallyValuable: number;
        CSG_CRDS_pureCost: number;
        others_mix: number;
      };
    };
    dividendes: {
      pfu_2026_increased: number;
    };
  };
}

interface SasuInput {
  revenueGross: number;
  businessExpenses: number;
  salaryBrutAnnual: number;
  dividendTarget: number;
  familyStatus: FamilyStatus;
  children: number;
}

export function calculateSASU(input: SasuInput, data: FranceSasuData): StructureResult {
  const warnings: string[] = [];
  const pres = data.sasu_is.presidentAssimileSalarie;

  // 1. Charges sociales (assimilé-salarié)
  const employerContrib = input.salaryBrutAnnual * pres.employerContributions_approx;
  const employeeContrib = input.salaryBrutAnnual * pres.employeeContributions_approx;
  const socialContributions = employerContrib + employeeContrib;
  const salaryNet = input.salaryBrutAnnual - employeeContrib;
  const totalSalaryCost = input.salaryBrutAnnual + employerContrib;

  // 2. Décomposition objective — le président n'a PAS droit au chômage
  const b = pres.breakdown;
  const breakdown: ContributionBreakdown = {
    effectivelyValuable: input.salaryBrutAnnual * b.health_effectivelyValuable,
    nominallyValuable:
      input.salaryBrutAnnual * (b.retirement_nominallyValuable + b.familyBenefits_nominallyValuable),
    pureCost:
      input.salaryBrutAnnual *
      (b.CSG_CRDS_pureCost + b.unemployment_notApplicableToFounder + b.others_mix),
  };

  // Normalisation : le total du breakdown doit sommer aux cotisations totales.
  const breakdownSum =
    breakdown.effectivelyValuable + breakdown.nominallyValuable + breakdown.pureCost;
  const scale = breakdownSum > 0 ? socialContributions / breakdownSum : 0;
  breakdown.effectivelyValuable *= scale;
  breakdown.nominallyValuable *= scale;
  breakdown.pureCost *= scale;

  // 3. IS sur le bénéfice
  const profitBeforeIS = input.revenueGross - input.businessExpenses - totalSalaryCost;
  let corporateTax = 0;
  if (profitBeforeIS > 0) {
    const ct = data.sasu_is.corporateTax;
    const reducedSlice = Math.min(profitBeforeIS, ct.reducedRateCap);
    const normalSlice = Math.max(0, profitBeforeIS - ct.reducedRateCap);
    corporateTax = reducedSlice * ct.reducedRate + normalSlice * ct.normalRate;
  }
  const profitAfterIS = Math.max(0, profitBeforeIS - corporateTax);

  // 4. Distribution dividendes + PFU 2026 (31.4%)
  const dividendDistributed = Math.min(Math.max(0, input.dividendTarget), profitAfterIS);
  if (input.dividendTarget > profitAfterIS) {
    warnings.push(
      `Dividende cible (${input.dividendTarget.toLocaleString("fr-FR")}€) supérieur au bénéfice distribuable (${Math.round(profitAfterIS).toLocaleString("fr-FR")}€).`
    );
  }
  const pfuRate = data.sasu_is.dividendes.pfu_2026_increased;
  const dividendTax = dividendDistributed * pfuRate;
  const dividendNet = dividendDistributed - dividendTax;

  // 5. IR sur salaire (abattement 10%)
  const parts = computeQuotientFamilialParts(input.familyStatus, input.children);
  const taxableIR = salaryNet * 0.9;
  const taxPerPart = applyProgressiveBrackets(taxableIR / parts, data.incomeTaxBrackets);
  const incomeTax = taxPerPart * parts;

  // 6. Totaux
  const totalTax = socialContributions + corporateTax + dividendTax + incomeTax;
  const netInHand = salaryNet - incomeTax + dividendNet;

  return {
    structure: "SASU (IS)",
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
  };
}
