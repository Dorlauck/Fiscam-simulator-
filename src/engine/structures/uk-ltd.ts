import type { Bracket, ContributionBreakdown, FamilyStatus, StructureResult, TaxFlow } from "../types";
import { applyProgressiveBrackets } from "../progressiveBrackets";

interface UkData {
  personalAllowance_GBP: number;
  incomeTaxBrackets_2026_27_GBP: Bracket[];
  nationalInsurance: {
    class1_employee_2026_27: {
      primaryThreshold: number;
      upperEarningsLimit: number;
      rate_below_UEL: number;
      rate_above_UEL: number;
    };
    class1_employer_2026_27: {
      secondaryThreshold: number;
      rate: number;
    };
    class4_selfEmployed_2026_27: {
      lowerProfitsLimit: number;
      upperProfitsLimit: number;
      rate_below_UPL: number;
      rate_above_UPL: number;
    };
  };
  dividendTax: {
    dividendAllowance_GBP_2026_27: number;
    rates_2026_27: { basic: number; higher: number; additional: number };
  };
  corporationTax: {
    smallProfitsRate_below_50k: number;
    mainRate_above_250k: number;
    marginalRelief_between_50k_250k: boolean;
    marginalRelief_fraction: string;
  };
}

export interface UkLtdInput {
  revenueGrossGBP: number;
  businessExpensesGBP: number;
  salaryBrutGBP: number;
  dividendTargetGBP: number;
  familyStatus: FamilyStatus;
  children: number;
}

// Corporation tax 2026/27 avec marginal relief (3/200 entre £50k et £250k)
function corporationTax(profit: number, ct: UkData["corporationTax"]): number {
  if (profit <= 0) return 0;
  if (profit <= 50_000) return profit * ct.smallProfitsRate_below_50k;
  if (profit >= 250_000) return profit * ct.mainRate_above_250k;
  // Marginal relief : main rate 25% - (upper - profit) * 3/200
  const relief = (250_000 - profit) * (3 / 200);
  return profit * ct.mainRate_above_250k - relief;
}

function employeeIncomeTax(taxableIncome: number, brackets: Bracket[]): number {
  return applyProgressiveBrackets(taxableIncome, brackets);
}

/**
 * Dividend tax UK 2026/27 — respecte l'ordre des slices britanniques :
 * 1. Personal allowance consommée d'abord par salary.
 * 2. Dividend allowance £500 tax-free.
 * 3. Slice basic (jusqu'à £50 270 cumul) @ 10.75%.
 * 4. Slice higher (jusqu'à £125 140 cumul) @ 35.75%.
 * 5. Slice additional (au-delà) @ 39.35%.
 */
function dividendTax(
  dividendsGross: number,
  salaryGross: number,
  data: UkData
): number {
  if (dividendsGross <= 0) return 0;
  const { dividendAllowance_GBP_2026_27, rates_2026_27 } = data.dividendTax;

  const basicCap = 50_270;
  const higherCap = 125_140;

  const cumulBeforeDiv = Math.max(salaryGross, data.personalAllowance_GBP);
  const basicDivRoom = Math.max(0, basicCap - cumulBeforeDiv);
  const higherDivRoom = Math.max(0, higherCap - Math.max(basicCap, cumulBeforeDiv));

  // Remplir les bandes par ordre : basic → higher → additional
  const basicFill = Math.min(dividendsGross, basicDivRoom);
  const higherFill = Math.min(dividendsGross - basicFill, higherDivRoom);
  const additionalFill = Math.max(0, dividendsGross - basicFill - higherFill);

  // L'allowance £500 "absorbe" 500£ de bande (en commençant par la basic)
  let remainingAllowance = dividendAllowance_GBP_2026_27;
  const basicAllowance = Math.min(remainingAllowance, basicFill);
  remainingAllowance -= basicAllowance;
  const higherAllowance = Math.min(remainingAllowance, higherFill);
  remainingAllowance -= higherAllowance;
  const additionalAllowance = Math.min(remainingAllowance, additionalFill);

  return (
    (basicFill - basicAllowance) * rates_2026_27.basic +
    (higherFill - higherAllowance) * rates_2026_27.higher +
    (additionalFill - additionalAllowance) * rates_2026_27.additional
  );
}

export function calculateUkLtd(input: UkLtdInput, data: UkData): StructureResult {
  const ni = data.nationalInsurance;
  const salary = input.salaryBrutGBP;

  // ---- 1. Employer NI (au-dessus du secondary threshold £5k)
  const employerNI = Math.max(0, salary - ni.class1_employer_2026_27.secondaryThreshold) * ni.class1_employer_2026_27.rate;

  // ---- 2. Employee NI
  const empNi = ni.class1_employee_2026_27;
  let employeeNI = 0;
  if (salary > empNi.primaryThreshold) {
    const inBasic = Math.min(salary, empNi.upperEarningsLimit) - empNi.primaryThreshold;
    employeeNI += Math.max(0, inBasic) * empNi.rate_below_UEL;
    if (salary > empNi.upperEarningsLimit) {
      employeeNI += (salary - empNi.upperEarningsLimit) * empNi.rate_above_UEL;
    }
  }
  const socialContributions = employerNI + employeeNI;

  // ---- 3. Corp Tax sur bénéfice après salaire + employer NI (HMRC-correct).
  //         Le salaire versé au directeur est une charge déductible du résultat société.
  //         L'exemple 3B de la doc 07_EXAMPLES.md oubliait de déduire le salaire de la base CT ;
  //         on a corrigé, ce qui donne des valeurs différentes du doc mais mathématiquement
  //         cohérentes (identité revenue = totalLevied + netTakeHome + retained + expenses).
  const totalSalaryCost = salary + employerNI;
  const profitBeforeCT = Math.max(
    0,
    input.revenueGrossGBP - input.businessExpensesGBP - totalSalaryCost
  );
  const corporationTaxAmount = corporationTax(profitBeforeCT, data.corporationTax);
  const profitAfterCT = profitBeforeCT - corporationTaxAmount;

  // ---- 4. Dividendes
  const dividendDistributed = Math.min(Math.max(0, input.dividendTargetGBP), profitAfterCT);
  const dividendTaxAmount = dividendTax(dividendDistributed, salary, data);

  // ---- 5. IR sur salaire
  const incomeTax = employeeIncomeTax(salary, data.incomeTaxBrackets_2026_27_GBP);

  // ---- 6. Classification objective
  // UK NI = mix : State Pension (nominallyValuable) + NHS (effectivelyValuable mais qualité mixte).
  // On répartit approximativement 45% retraite / 45% NHS / 10% pureCost.
  const breakdown: ContributionBreakdown = {
    effectivelyValuable: socialContributions * 0.45,
    nominallyValuable: socialContributions * 0.45,
    pureCost: socialContributions * 0.10,
  };

  const totalTax =
    socialContributions + corporationTaxAmount + dividendTaxAmount + incomeTax;

  const netDirector =
    salary -
    employeeNI -
    incomeTax +
    (dividendDistributed - dividendTaxAmount);

  const retainedUK = Math.max(0, profitAfterCT - dividendDistributed);
  const flow: TaxFlow = {
    currency: "GBP",
    revenue: input.revenueGrossGBP,
    businessExpenses: input.businessExpensesGBP,
    salaryCost: salary + employerNI,
    profitBeforeCorpTax: profitBeforeCT,
    corporateTax: corporationTaxAmount,
    profitAfterCorpTax: profitAfterCT,
    dividendGross: dividendDistributed,
    retainedInCompany: retainedUK,
    salaryGross: salary,
    employerContrib: employerNI,
    employeeContrib: employeeNI,
    salaryNet: salary - employeeNI,
    salaryIncomeTax: incomeTax,
    salaryTakeHome: salary - employeeNI - incomeTax,
    dividendTax: dividendTaxAmount,
    dividendNet: dividendDistributed - dividendTaxAmount,
    selfEmploymentTax: 0,
    soleIncomeTax: 0,
    otherTaxes: 0,
    totalLevied: totalTax,
    netTakeHome: netDirector,
    retainedAmount: retainedUK,
  };

  return {
    structure: "Ltd Company (UK)",
    jurisdiction: "UK",
    corporateTax: corporationTaxAmount,
    socialContributions,
    socialContributionsBreakdown: breakdown,
    dividendTax: dividendTaxAmount,
    incomeTax,
    otherTaxes: 0,
    totalTax,
    netInHand: netDirector,
    effectiveRate: totalTax / input.revenueGrossGBP,
    warnings: [],
    flow,
  };
}
