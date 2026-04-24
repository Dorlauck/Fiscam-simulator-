import type { Bracket, ContributionBreakdown, FamilyStatus, StructureResult } from "../types";
import { applyProgressiveBrackets } from "../progressiveBrackets";

interface UsaFederalData {
  federal: {
    incomeTaxBrackets_single_2026: Bracket[];
    incomeTaxBrackets_mfj_2026: Bracket[];
    standardDeduction_single_2026_USD: number;
    standardDeduction_mfj_2026_USD: number;
    qbiDeduction_rate: number;
    selfEmploymentTax: {
      netEarningsFactor: number;
      socialSecurityRate: number;
      socialSecurityWageBase_2026_USD: number;
      medicareRate: number;
      additionalMedicareRate: number;
      additionalMedicareThreshold_single_USD: number;
    };
    ficaPayroll_W2: {
      socialSecurityRate_employerShare: number;
      socialSecurityRate_employeeShare: number;
      medicareRate_employerShare: number;
      medicareRate_employeeShare: number;
    };
  };
}

export type UsState = "NY" | "CA" | "FL";

export interface UsLlcInput {
  revenueGrossUSD: number;
  businessExpensesUSD: number;
  state: UsState;
  city?: "NYC" | "SF" | "LA" | "MIAMI";
  filing: "single" | "mfj";
  age: number;
  familyStatus: FamilyStatus;
  children: number;
}

interface StateBracketsBundle {
  ny_state?: {
    incomeTaxBrackets_single_2026: Bracket[];
    standardDeduction_single_2026_USD: number;
  };
  nyc_local?: {
    incomeTaxBrackets_single_2026: Bracket[];
    mctmt: {
      zone1_rate_low: number;
      zone1_rate_high: number;
      threshold_low_USD: number;
      threshold_high_USD: number;
    };
  };
  ca_state?: {
    incomeTaxBrackets_single_2026: Bracket[];
    standardDeduction_single_2026?: number;
  };
  llc_specificTaxes?: {
    annualFranchiseTax_USD: number;
    llcGrossReceiptsFee: {
      under_250k: number;
      "250k_499k": number;
      "500k_999k": number;
      "1M_4.99M": number;
      over_5M: number;
    };
  };
}

function stateTax(input: UsLlcInput, taxable: number, stateData: StateBracketsBundle): {
  stateIR: number;
  localIR: number;
  entityTax: number;
  additional: number;
} {
  let stateIR = 0;
  let localIR = 0;
  let entityTax = 0;
  let additional = 0;

  if (input.state === "NY" && stateData.ny_state) {
    const nyTaxable = Math.max(0, taxable - stateData.ny_state.standardDeduction_single_2026_USD);
    stateIR = applyProgressiveBrackets(nyTaxable, stateData.ny_state.incomeTaxBrackets_single_2026);
    if (input.city === "NYC" && stateData.nyc_local) {
      localIR = applyProgressiveBrackets(nyTaxable, stateData.nyc_local.incomeTaxBrackets_single_2026);
    }
  }

  if (input.state === "CA" && stateData.ca_state) {
    const caStandardDed = stateData.ca_state.standardDeduction_single_2026 ?? 5363;
    const caTaxable = Math.max(0, taxable - caStandardDed);
    stateIR = applyProgressiveBrackets(caTaxable, stateData.ca_state.incomeTaxBrackets_single_2026);
    // LLC franchise + gross receipts
    if (stateData.llc_specificTaxes) {
      entityTax += stateData.llc_specificTaxes.annualFranchiseTax_USD;
      const fee = stateData.llc_specificTaxes.llcGrossReceiptsFee;
      const rev = input.revenueGrossUSD;
      if (rev >= 5_000_000) entityTax += fee.over_5M;
      else if (rev >= 1_000_000) entityTax += fee["1M_4.99M"];
      else if (rev >= 500_000) entityTax += fee["500k_999k"];
      else if (rev >= 250_000) entityTax += fee["250k_499k"];
      else entityTax += fee.under_250k;
    }
  }

  // FL : 0 state, 0 local — rien à faire
  return { stateIR, localIR, entityTax, additional };
}

export function calculateUsaLLC(
  input: UsLlcInput,
  federal: UsaFederalData,
  stateData: StateBracketsBundle
): StructureResult {
  const fed = federal.federal;
  const profit = input.revenueGrossUSD - input.businessExpensesUSD;

  // ---- 1. Self-Employment Tax
  const seBase = Math.max(0, profit * fed.selfEmploymentTax.netEarningsFactor);
  const ssPortion =
    Math.min(seBase, fed.selfEmploymentTax.socialSecurityWageBase_2026_USD) *
    fed.selfEmploymentTax.socialSecurityRate;
  const medicarePortion = seBase * fed.selfEmploymentTax.medicareRate;
  const addMedicare =
    seBase > fed.selfEmploymentTax.additionalMedicareThreshold_single_USD
      ? (seBase - fed.selfEmploymentTax.additionalMedicareThreshold_single_USD) *
        fed.selfEmploymentTax.additionalMedicareRate
      : 0;
  const selfEmploymentTax = ssPortion + medicarePortion + addMedicare;

  // ---- 2. Fédéral IR (pass-through) — QBI se calcule sur le QBI (profit - half SE)
  const halfSE = selfEmploymentTax / 2;
  const stdDed =
    input.filing === "single" ? fed.standardDeduction_single_2026_USD : fed.standardDeduction_mfj_2026_USD;
  const agi = Math.max(0, profit - halfSE);
  const qbi = agi * fed.qbiDeduction_rate;
  const taxableFederal = Math.max(0, agi - qbi - stdDed);
  const brackets =
    input.filing === "single" ? fed.incomeTaxBrackets_single_2026 : fed.incomeTaxBrackets_mfj_2026;
  const federalIR = applyProgressiveBrackets(taxableFederal, brackets);

  // ---- 3. State/local (start from AGI typically)
  const { stateIR, localIR, entityTax } = stateTax(input, agi, stateData);

  // ---- 4. MCTMT NYC
  let mctmt = 0;
  if (input.state === "NY" && input.city === "NYC" && stateData.nyc_local) {
    const { mctmt: m } = stateData.nyc_local;
    if (seBase > m.threshold_high_USD) {
      mctmt = seBase * m.zone1_rate_high;
    } else if (seBase > m.threshold_low_USD) {
      mctmt = seBase * m.zone1_rate_low;
    }
  }

  // ---- 5. Classification objective
  const breakdown: ContributionBreakdown = {
    effectivelyValuable: input.age >= 65 ? medicarePortion : 0,
    nominallyValuable: ssPortion,
    pureCost: (input.age < 65 ? medicarePortion : 0) + addMedicare,
  };

  const totalTax = selfEmploymentTax + federalIR + stateIR + localIR + entityTax + mctmt;
  const netInHand = input.revenueGrossUSD - input.businessExpensesUSD - totalTax;

  return {
    structure: `LLC sole prop (${input.state}${input.city ? " / " + input.city : ""})`,
    jurisdiction: input.state === "NY" ? "US_NY" : input.state === "CA" ? "US_CA" : "US_FL_MIAMI",
    corporateTax: 0,
    socialContributions: selfEmploymentTax,
    socialContributionsBreakdown: breakdown,
    dividendTax: 0,
    incomeTax: federalIR + stateIR + localIR,
    otherTaxes: entityTax + mctmt,
    totalTax,
    netInHand,
    effectiveRate: totalTax / input.revenueGrossUSD,
    warnings: [],
  };
}
