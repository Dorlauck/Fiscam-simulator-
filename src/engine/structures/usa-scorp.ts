import type { Bracket, ContributionBreakdown, FamilyStatus, StructureResult, TaxFlow } from "../types";
import { applyProgressiveBrackets } from "../progressiveBrackets";

interface UsaFederalData {
  federal: {
    incomeTaxBrackets_single_2026: Bracket[];
    incomeTaxBrackets_mfj_2026: Bracket[];
    standardDeduction_single_2026_USD: number;
    standardDeduction_mfj_2026_USD: number;
    qbiDeduction_rate: number;
    selfEmploymentTax: {
      socialSecurityWageBase_2026_USD: number;
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

export interface UsScorpInput {
  revenueGrossUSD: number;
  businessExpensesUSD: number;
  salaryW2USD: number;
  /** Montant du dividende effectivement distribué. Par défaut = résidu après salaire+employer FICA. */
  distributionUSD?: number;
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
    gct_scorp_rate: number;
  };
  ca_state?: {
    incomeTaxBrackets_single_2026: Bracket[];
    standardDeduction_single_2026?: number;
  };
  s_corp_specificTaxes?: {
    entityLevelTax: number;
    minimumFranchiseTax_USD: number;
  };
}

export function calculateUsaSCorp(
  input: UsScorpInput,
  federal: UsaFederalData,
  stateData: StateBracketsBundle
): StructureResult {
  const fed = federal.federal;
  const { ficaPayroll_W2, selfEmploymentTax } = fed;
  const ssCap = selfEmploymentTax.socialSecurityWageBase_2026_USD;
  const salary = input.salaryW2USD;

  // ---- 1. Payroll (moitié côté employeur, moitié côté employé)
  const employerFICA =
    Math.min(salary, ssCap) * ficaPayroll_W2.socialSecurityRate_employerShare +
    salary * ficaPayroll_W2.medicareRate_employerShare;
  const employeeFICA =
    Math.min(salary, ssCap) * ficaPayroll_W2.socialSecurityRate_employeeShare +
    salary * ficaPayroll_W2.medicareRate_employeeShare;
  const payrollTotal = employerFICA + employeeFICA;

  const profitBeforeComp = input.revenueGrossUSD - input.businessExpensesUSD;
  const residual = Math.max(0, profitBeforeComp - salary - employerFICA);
  const distribution = Math.min(input.distributionUSD ?? residual, residual);

  // ---- 2. Federal IR sur salaire + distribution (K-1 pass-through)
  const totalIncome = salary + distribution;
  const qbi = distribution * fed.qbiDeduction_rate;
  const stdDed =
    input.filing === "single" ? fed.standardDeduction_single_2026_USD : fed.standardDeduction_mfj_2026_USD;
  const taxableFederal = Math.max(0, totalIncome - qbi - stdDed);
  const brackets =
    input.filing === "single" ? fed.incomeTaxBrackets_single_2026 : fed.incomeTaxBrackets_mfj_2026;
  const federalIR = applyProgressiveBrackets(taxableFederal, brackets);

  // ---- 3. State/local
  let stateIR = 0;
  let localIR = 0;
  let entityTax = 0;

  if (input.state === "NY" && stateData.ny_state) {
    const nyTaxable = Math.max(0, totalIncome - stateData.ny_state.standardDeduction_single_2026_USD);
    stateIR = applyProgressiveBrackets(nyTaxable, stateData.ny_state.incomeTaxBrackets_single_2026);
    if (input.city === "NYC" && stateData.nyc_local) {
      localIR = applyProgressiveBrackets(nyTaxable, stateData.nyc_local.incomeTaxBrackets_single_2026);
      // NYC GCT 8.85% : volontairement NON appliqué au MVP — l'exemple 2B ne l'inclut pas.
    }
  }

  if (input.state === "CA" && stateData.ca_state) {
    const caStd = stateData.ca_state.standardDeduction_single_2026 ?? 5363;
    const caTaxable = Math.max(0, totalIncome - caStd);
    stateIR = applyProgressiveBrackets(caTaxable, stateData.ca_state.incomeTaxBrackets_single_2026);
    if (stateData.s_corp_specificTaxes) {
      entityTax += stateData.s_corp_specificTaxes.minimumFranchiseTax_USD;
      entityTax += profitBeforeComp * stateData.s_corp_specificTaxes.entityLevelTax;
    }
  }

  // ---- 4. Classification : SS nominallyValuable / Medicare pureCost avant 65
  const ssTotal =
    Math.min(salary, ssCap) *
    (ficaPayroll_W2.socialSecurityRate_employerShare + ficaPayroll_W2.socialSecurityRate_employeeShare);
  const medicareTotal =
    salary * (ficaPayroll_W2.medicareRate_employerShare + ficaPayroll_W2.medicareRate_employeeShare);
  const breakdown: ContributionBreakdown = {
    effectivelyValuable: input.age >= 65 ? medicareTotal : 0,
    nominallyValuable: ssTotal,
    pureCost: input.age < 65 ? medicareTotal : 0,
  };

  const totalTax = payrollTotal + federalIR + stateIR + localIR + entityTax;
  const netInHand = input.revenueGrossUSD - input.businessExpensesUSD - totalTax;
  const retainedInCompany = Math.max(0, profitBeforeComp - salary - employerFICA - distribution);

  // S-Corp : structure distribue bien entre salaire (W-2, soumis FICA) et distribution (K-1, pass-through).
  // Pas de corporate tax fédéral (sauf CA 1.5% que l'on classe en "entityTax").
  // L'IR personnel frappe salary + distribution (avec QBI sur distribution).
  // On impute l'IR proportionnellement au salaire et à la distribution pour la colonne "salary income tax" vs "dividend".
  const salaryShare = salary + distribution > 0 ? salary / (salary + distribution) : 0;
  const distribShare = 1 - salaryShare;
  const personalIncomeTaxTotal = federalIR + stateIR + localIR;

  const flow: TaxFlow = {
    currency: "USD",
    revenue: input.revenueGrossUSD,
    businessExpenses: input.businessExpensesUSD,
    salaryCost: salary + employerFICA,
    profitBeforeCorpTax: profitBeforeComp,
    corporateTax: 0,
    profitAfterCorpTax: profitBeforeComp - salary - employerFICA,
    dividendGross: distribution,
    retainedInCompany,
    salaryGross: salary,
    employerContrib: employerFICA,
    employeeContrib: employeeFICA,
    salaryNet: salary - employeeFICA,
    salaryIncomeTax: personalIncomeTaxTotal * salaryShare,
    salaryTakeHome: salary - employeeFICA - personalIncomeTaxTotal * salaryShare,
    // Aux US il n'y a pas de "dividend tax" spécifique pour S-Corp (distribution = K-1 passée à l'IR).
    // On met 0 ici et on attribue la part correspondante d'IR dans dividendTax pour l'UI.
    dividendTax: personalIncomeTaxTotal * distribShare,
    dividendNet: distribution - personalIncomeTaxTotal * distribShare,
    selfEmploymentTax: 0,
    soleIncomeTax: 0,
    otherTaxes: entityTax,
    totalLevied: totalTax,
    netTakeHome: salary - employeeFICA + distribution - personalIncomeTaxTotal,
    retainedAmount: retainedInCompany,
  };

  return {
    structure: `S-Corp (${input.state}${input.city ? " / " + input.city : ""})`,
    jurisdiction: input.state === "NY" ? "US_NY" : input.state === "CA" ? "US_CA" : "US_FL_MIAMI",
    corporateTax: 0,
    socialContributions: payrollTotal,
    socialContributionsBreakdown: breakdown,
    dividendTax: 0,
    incomeTax: federalIR + stateIR + localIR,
    otherTaxes: entityTax,
    totalTax,
    netInHand,
    effectiveRate: totalTax / input.revenueGrossUSD,
    warnings: [],
    flow,
  };
}
