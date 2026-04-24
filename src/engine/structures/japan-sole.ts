import type { Bracket, ContributionBreakdown, FamilyStatus, StructureResult } from "../types";
import { applyJapaneseBracket } from "../progressiveBrackets";

interface JapanData {
  nationalIncomeTaxBrackets_2026_JPY: Array<Bracket & { deduction: number }>;
  basicDeduction_2026_JPY: number;
  reconstructionSurtax: { rate: number };
  localInhabitantTax: {
    rate_flat: number;
    perCapita_JPY: number;
    forestEnvironmentalTax_JPY: number;
  };
  selfEmployed: {
    blueReturnSystem: { deduction_annual_JPY: number };
    enterpriseTax_prefectural: { rate: number; appliesIf_businessIncomeOver_JPY: number };
  };
  socialInsurance: {
    healthInsurance_kenkouhoken: {
      rate_Tokyo_2026_approx: number;
      capAnnual_JPY: number;
    };
    pension_kokuminNenkin: {
      monthlyFixed_JPY_2026: number;
      annualTotal_JPY: number;
    };
  };
}

export interface JapanSoleInput {
  revenueGrossJPY: number;
  businessExpensesJPY: number;
  useBlueReturn: boolean;
  familyStatus: FamilyStatus;
  children: number;
  age: number;
}

export function calculateJapanSoleProp(
  input: JapanSoleInput,
  data: JapanData
): StructureResult {
  const revenueAfterExpenses = Math.max(0, input.revenueGrossJPY - input.businessExpensesJPY);
  const blueDeduction = input.useBlueReturn ? data.selfEmployed.blueReturnSystem.deduction_annual_JPY : 0;
  const basicDeduction = data.basicDeduction_2026_JPY;

  // ---- 1. Cotisations sociales (déductibles pour l'IR)
  const healthInsurance = Math.min(
    revenueAfterExpenses * data.socialInsurance.healthInsurance_kenkouhoken.rate_Tokyo_2026_approx,
    data.socialInsurance.healthInsurance_kenkouhoken.capAnnual_JPY
  );
  const pension = data.socialInsurance.pension_kokuminNenkin.annualTotal_JPY;
  const socialContributions = healthInsurance + pension;

  // ---- 2. IR national (barème avec déduction cumulative)
  const taxableForIR = Math.max(
    0,
    revenueAfterExpenses - blueDeduction - basicDeduction - socialContributions
  );
  const nationalIR = applyJapaneseBracket(taxableForIR, data.nationalIncomeTaxBrackets_2026_JPY);
  const reconstructionSurtax = nationalIR * data.reconstructionSurtax.rate;

  // ---- 3. Taxe locale (inhabitants tax flat 10% + per capita)
  const localIR =
    taxableForIR * data.localInhabitantTax.rate_flat +
    data.localInhabitantTax.perCapita_JPY +
    data.localInhabitantTax.forestEnvironmentalTax_JPY;

  // ---- 4. Enterprise tax préfectural (si bénéfice > ¥2.9M)
  let enterpriseTax = 0;
  if (revenueAfterExpenses > data.selfEmployed.enterpriseTax_prefectural.appliesIf_businessIncomeOver_JPY) {
    enterpriseTax =
      (revenueAfterExpenses - data.selfEmployed.enterpriseTax_prefectural.appliesIf_businessIncomeOver_JPY) *
      data.selfEmployed.enterpriseTax_prefectural.rate;
  }

  // ---- 5. Classification objective
  // Kenko Hoken (santé) : effectivelyValuable (qualité 9/10, 30% reste à charge)
  // Kokumin Nenkin (retraite) : nominallyValuable (démographie pire OCDE)
  const breakdown: ContributionBreakdown = {
    effectivelyValuable: healthInsurance,
    nominallyValuable: pension,
    pureCost: 0,
  };

  const totalTax =
    nationalIR + reconstructionSurtax + localIR + enterpriseTax + socialContributions;
  const netInHand = input.revenueGrossJPY - input.businessExpensesJPY - totalTax;

  return {
    structure: `Japan Sole Prop (${input.useBlueReturn ? "Blue" : "White"} Return)`,
    jurisdiction: "JP",
    corporateTax: 0,
    socialContributions,
    socialContributionsBreakdown: breakdown,
    dividendTax: 0,
    incomeTax: nationalIR + reconstructionSurtax + localIR,
    otherTaxes: enterpriseTax,
    totalTax,
    netInHand,
    effectiveRate: totalTax / input.revenueGrossJPY,
    warnings: [],
  };
}
