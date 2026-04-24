# Algorithme du moteur fiscal

## Flow général

```
SimulationInput
     │
     ▼
[1] Validate input (Zod)
     │
     ▼
[2] Load jurisdiction data
     │
     ▼
[3] Detect structure applicable
    - FR : micro-entreprise (sous plafond) | EURL | SASU
    - US : Sole prop LLC | S-Corp election | C-Corp
    - UK : Sole trader | Ltd Co
    - MT : Self-employed resident | Malta Ltd + Holding (non-dom)
    - JP : Blue Return sole | KK | GK
     │
     ▼
[4] Calculate gross company-level taxes
    ├─ Corporate tax (if applicable)
    ├─ Social contributions employer side
    └─ Other business taxes (CFE, franchise, GCT, etc.)
     │
     ▼
[5] Calculate personal-level taxes on compensation
    ├─ Salary / rémunération → IR + social contributions employee
    ├─ Dividends → withholding + IR or PFU
    └─ Pass-through (S-Corp, LLC default) → IR direct
     │
     ▼
[6] Apply deductions / credits
    ├─ QBI (US)
    ├─ Blue Return (JP)
    ├─ Abattement forfaitaire (FR micro)
    ├─ Standard deduction (US, UK personal allowance)
     │
     ▼
[7] Classify contributions (objectivité)
    ├─ effectivelyValuable
    ├─ nominallyValuable
    └─ pureCost
     │
     ▼
[8] Calculate cost of living for jurisdiction
    ├─ Rent (based on housingType)
    ├─ Food
    ├─ Transport
    ├─ Healthcare (private/public)
    └─ Utilities
     │
     ▼
[9] Compute verdict
    ├─ Net after tax
    ├─ Net after cost of living
    ├─ Dead weight loss (pureCost total)
    ├─ Composite score
    └─ Pros/Cons generation
     │
     ▼
SimulationOutput
```

---

## Fonction centrale : calcul barème progressif

```typescript
// src/engine/progressiveBrackets.ts

export function applyProgressiveBrackets(
  taxableIncome: number,
  brackets: Bracket[]
): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const max = bracket.max ?? Infinity;
    const amountInBracket = Math.min(taxableIncome, max) - bracket.min;
    tax += amountInBracket * bracket.rate;
    if (taxableIncome <= max) break;
  }
  return tax;
}
```

**Cas spécial Japon — barème avec déduction cumulative** :

```typescript
export function applyJapaneseBracket(
  taxableIncome: number,
  brackets: JapaneseBracket[]
): number {
  const applicable = brackets
    .filter(b => taxableIncome > b.min)
    .reverse()[0];
  
  if (!applicable) return 0;
  return taxableIncome * applicable.rate - applicable.deduction;
}
```

---

## Calcul France SASU (exemple de la logique)

```typescript
// src/engine/structures/sasu-eurl.ts

interface SasuInput {
  revenue: number;
  businessExpenses: number;
  salaryBrut: number;        // salaire brut président
  dividendTarget: number;
  familyStatus: FamilyStatus;
  children: number;
}

export function calculateSASU(input: SasuInput, data: FranceData) {
  // 1. Charges sociales SASU (président assimilé-salarié)
  const employerContribRate = 0.45;
  const employeeContribRate = 0.22;
  
  const employerContrib = input.salaryBrut * employerContribRate;
  const employeeContrib = input.salaryBrut * employeeContribRate;
  const salaryNet = input.salaryBrut - employeeContrib;
  const totalSalaryCost = input.salaryBrut + employerContrib;

  // 2. Décomposition des cotisations (objectivité!)
  const contribBreakdown = {
    effectivelyValuable: input.salaryBrut * 0.11,  // santé
    nominallyValuable:   input.salaryBrut * 0.32,  // retraite + famille
    pureCost:            input.salaryBrut * 0.24,  // CSG/CRDS + pas de chômage
  };

  // 3. IS société
  const profitBeforeIS = input.revenue 
    - input.businessExpenses 
    - totalSalaryCost;
  
  let corporateTax = 0;
  if (profitBeforeIS > 0) {
    const reducedSlice = Math.min(profitBeforeIS, 42500);
    const normalSlice = Math.max(0, profitBeforeIS - 42500);
    corporateTax = reducedSlice * 0.15 + normalSlice * 0.25;
  }
  const profitAfterIS = profitBeforeIS - corporateTax;

  // 4. Distribution dividende (si demandée et possible)
  const dividendDistributed = Math.min(input.dividendTarget, Math.max(0, profitAfterIS));
  
  // 5. PFU 2026 : 31.4% (12.8% IR + 18.6% prélèvements sociaux)
  const pfuRate = 0.314;
  const dividendTax = dividendDistributed * pfuRate;
  const dividendNet = dividendDistributed - dividendTax;

  // 6. IR sur salaire
  const parts = computeParts(input.familyStatus, input.children);
  const taxableIRSalary = salaryNet * 0.9; // abattement 10%
  const taxablePerPart = taxableIRSalary / parts;
  const taxPerPart = applyProgressiveBrackets(taxablePerPart, data.incomeTaxBrackets);
  const incomeTax = taxPerPart * parts;

  // 7. Totaux
  const totalTax = 
    employerContrib + employeeContrib 
    + corporateTax 
    + dividendTax 
    + incomeTax;
  
  const netInHand = 
    (salaryNet - incomeTax) 
    + dividendNet;

  return {
    corporateTax,
    socialContributions: employerContrib + employeeContrib,
    socialContributionsBreakdown: contribBreakdown,
    dividendTax,
    incomeTax,
    totalTax,
    netInHand,
    effectiveRate: totalTax / input.revenue,
  };
}

function computeParts(status: FamilyStatus, children: number): number {
  let parts = status === "single" ? 1 : 2;
  if (children >= 1) parts += 0.5;
  if (children >= 2) parts += 0.5;
  if (children >= 3) parts += children - 2; // 1 part entière par enfant à partir du 3e
  return parts;
}
```

---

## Calcul USA (exemple S-Corp NY)

```typescript
// src/engine/structures/llc-scorp.ts

interface USStructureInput {
  revenue: number;
  businessExpenses: number;
  state: "NY" | "CA" | "FL";
  city?: "NYC" | "SF" | "LA" | "MIAMI";
  structure: "LLC_soleProp" | "S_Corp";
  salary_W2?: number;   // S-Corp uniquement
  filing: "single" | "mfj";
  age: number;
}

export function calculateUSStructure(input: USStructureInput, data: USAData) {
  const profitBeforeComp = input.revenue - input.businessExpenses;

  let federalSE = 0;
  let federalIR = 0;
  let stateIR = 0;
  let localIR = 0;
  let entityTax = 0;

  if (input.structure === "LLC_soleProp") {
    // Self-Employment Tax
    const seBase = profitBeforeComp * 0.9235;
    const ssPortion = Math.min(seBase, data.federal.selfEmploymentTax.socialSecurityWageBase_2026) * 0.124;
    const medicarePortion = seBase * 0.029;
    const additionalMedicare = seBase > 200000 ? (seBase - 200000) * 0.009 : 0;
    federalSE = ssPortion + medicarePortion + additionalMedicare;

    // Federal IR: profit passes through
    const halfSE = federalSE / 2;
    const qbi = profitBeforeComp * 0.20; // simplified (phaseouts ignored for <200k)
    const standardDeduction = input.filing === "single" ? 16100 : 32200;
    const taxableIR = Math.max(0, profitBeforeComp - halfSE - qbi - standardDeduction);
    federalIR = applyProgressiveBrackets(taxableIR, data.federal.incomeTaxBrackets_single_2026);

    // State / local on profit directly
    if (input.state === "NY") {
      stateIR = applyProgressiveBrackets(profitBeforeComp - 8000, data.ny_state.incomeTaxBrackets_single);
      if (input.city === "NYC") {
        localIR = applyProgressiveBrackets(profitBeforeComp, data.nyc_local.incomeTaxBrackets_single);
        // MCTMT > $150k
        if (seBase > 150000) {
          localIR += seBase * 0.006;
        } else if (seBase > 50000) {
          localIR += seBase * 0.0047;
        }
      }
    } else if (input.state === "CA") {
      stateIR = applyProgressiveBrackets(profitBeforeComp - 5363, data.ca_state.incomeTaxBrackets_single_2026);
      // LLC annual franchise + gross receipts fee
      entityTax += 800;
      if (input.revenue >= 5_000_000)      entityTax += 11790;
      else if (input.revenue >= 1_000_000) entityTax += 6000;
      else if (input.revenue >= 500_000)   entityTax += 2500;
      else if (input.revenue >= 250_000)   entityTax += 900;
    }
    // FL: no state, no city

  } else if (input.structure === "S_Corp") {
    // Payroll tax on salary only
    const salary = input.salary_W2 ?? 0;
    const ssCap = 184500;
    const employerFICA = Math.min(salary, ssCap) * 0.062 + salary * 0.0145;
    const employeeFICA = Math.min(salary, ssCap) * 0.062 + salary * 0.0145;
    federalSE = employerFICA + employeeFICA; // total payroll burden

    // Distribution = profit - salary
    const distribution = Math.max(0, profitBeforeComp - salary - employerFICA);

    // Federal IR on salary + distribution (K-1 pass-through)
    const totalIncome = salary + distribution;
    const qbi = distribution * 0.20; // QBI only on pass-through portion (simplified)
    const standardDeduction = input.filing === "single" ? 16100 : 32200;
    const taxableIR = Math.max(0, totalIncome - qbi - standardDeduction);
    federalIR = applyProgressiveBrackets(taxableIR, data.federal.incomeTaxBrackets_single_2026);

    // State tax
    if (input.state === "NY") {
      stateIR = applyProgressiveBrackets(totalIncome - 8000, data.ny_state.incomeTaxBrackets_single);
      if (input.city === "NYC") {
        localIR = applyProgressiveBrackets(totalIncome, data.nyc_local.incomeTaxBrackets_single);
        // NYC treats S-Corp as C-Corp: GCT 8.85% on corp profit
        entityTax += profitBeforeComp * 0.0885;
      }
    } else if (input.state === "CA") {
      stateIR = applyProgressiveBrackets(totalIncome - 5363, data.ca_state.incomeTaxBrackets_single_2026);
      entityTax += 800; // min franchise
      entityTax += profitBeforeComp * 0.015; // CA S-Corp 1.5% entity tax
    }
    // FL: no entity tax for S-Corp
  }

  const totalTax = federalSE + federalIR + stateIR + localIR + entityTax;
  const netInHand = input.revenue - input.businessExpenses - totalTax;

  return {
    federalSE,
    federalIR,
    stateIR,
    localIR,
    entityTax,
    totalTax,
    netInHand,
    effectiveRate: totalTax / input.revenue,
    breakdown: {
      // Social Security nominalValuable (Trust Fund risk)
      nominallyValuable: federalSE * (0.124 / 0.153),
      // Medicare : pureCost before 65
      pureCost: input.age < 65 ? federalSE * (0.029 / 0.153) : 0,
      effectivelyValuable: input.age >= 65 ? federalSE * (0.029 / 0.153) : 0,
    }
  };
}
```

---

## Calcul Malte non-dom

```typescript
// src/engine/structures/malta-nondom.ts

interface MaltaInput {
  foreignIncomeTotal: number;          // Tout revenu étranger
  remittanceToMalta: number;           // Ce qui rentre physiquement à Malte
  maltaSourceIncome: number;           // Revenu généré à Malte
  familyStatus: FamilyStatus;
  children: number;
  useGRP?: boolean;                    // Global Residence Programme
  isEUCitizen: boolean;
}

export function calculateMaltaNonDom(input: MaltaInput, data: MaltaData) {
  const taxableIncome = input.maltaSourceIncome + input.remittanceToMalta;
  
  const brackets = input.children > 0 
    ? data.personalIncomeTaxBrackets_parent_2026_EUR 
    : data.personalIncomeTaxBrackets_single_2026_EUR;
  
  let incomeTax = applyProgressiveBrackets(taxableIncome, brackets);

  // GRP : taux plat 15% sur foreign remitted income
  if (input.useGRP) {
    const foreignRemittedTax = input.remittanceToMalta * 0.15;
    const maltaSourceTax = applyProgressiveBrackets(input.maltaSourceIncome, brackets);
    incomeTax = Math.max(data.globalResidenceProgramme_GRP.minimumAnnualTax_EUR, 
                         foreignRemittedTax + maltaSourceTax);
  } else {
    // Régime non-dom classique : minimum tax €5k si foreign > €35k
    if (input.foreignIncomeTotal > 35000) {
      incomeTax = Math.max(incomeTax, 5000);
    }
  }

  // Foreign capital gains toujours exemptés (même si remittés)
  
  const netInHand = input.foreignIncomeTotal + input.maltaSourceIncome - incomeTax;
  
  return {
    incomeTax,
    totalTax: incomeTax,
    netInHand,
    effectiveRate: incomeTax / (input.foreignIncomeTotal + input.maltaSourceIncome),
    breakdown: {
      // Malte non-dom : tax = pure government fee, pas de social contributions liées
      effectivelyValuable: 0,
      nominallyValuable: 0,
      pureCost: incomeTax,  // discutable mais strictement objectif
    }
  };
}
```

---

## Calcul Malta Ltd avec 6/7 refund

```typescript
export function calculateMaltaLtd_6_7(
  input: { profitBeforeTax: number; distributedToShareholder: number },
  data: MaltaData
) {
  const corpTax35 = input.profitBeforeTax * 0.35;
  const netProfit = input.profitBeforeTax - corpTax35;
  
  const distributed = Math.min(input.distributedToShareholder, netProfit);
  const taxOnDistributed = (distributed / netProfit) * corpTax35;
  const refund = taxOnDistributed * (6/7);
  
  const effectiveCorpTax = corpTax35 - refund;
  const effectiveCorpRate = effectiveCorpTax / input.profitBeforeTax; // ~5%
  
  return {
    corpTax_initial: corpTax35,
    refund,
    effectiveCorpTax,
    effectiveCorpRate,
    note: "Le refund doit aller à une HOLDCO pour éviter re-imposition personne physique"
  };
}
```

---

## Score composite (verdict)

```typescript
// src/scoring/composite.ts

export function computeCompositeScore(
  output: Pick<SimulationOutput, "taxation" | "costOfLiving" | "qualityOfLife" | "verdict">,
  revenue: number
): number {
  // Weights (sum = 100)
  const weights = {
    netPurchasingPower: 35,     // Le plus important
    taxBurden: 15,
    qualityOfLife: 15,
    visaComplexity: 10,
    exitCostRisk: 10,
    infraScore: 5,
    healthcareRealValue: 10,
  };

  // Net purchasing power: cashflow / revenue, normalisé sur 0-10
  const cashflow = revenue - output.taxation.totalTaxAndContributions - (output.costOfLiving.totalMonthly * 12);
  const cashflowRatio = Math.max(0, Math.min(1, cashflow / revenue));
  const netScore = cashflowRatio * 10;

  // Tax burden: lower is better
  const taxScore = 10 - Math.min(10, output.taxation.effectiveRate * 20);

  // Quality of life: average of qol scores
  const qolScores = Object.values(output.qualityOfLife);
  const qolScore = qolScores.reduce((a, b) => a + b, 0) / qolScores.length;

  // Visa (already 0-10 in input, but inverted: 0 = fermé = bad for foreigners)
  const visaScore = 10 - output.qualityOfLife.visaComplexity;

  // Exit cost (inverted)
  const exitScore = 10 - output.qualityOfLife.exitCostScore;

  // Infra
  const infraScore = output.qualityOfLife.infrastructureTech;

  // Healthcare real value
  const healthScore = output.qualityOfLife.healthcareQuality;

  const total = 
    (netScore * weights.netPurchasingPower +
     taxScore * weights.taxBurden +
     qolScore * weights.qualityOfLife +
     visaScore * weights.visaComplexity +
     exitScore * weights.exitCostRisk +
     infraScore * weights.infraScore +
     healthScore * weights.healthcareRealValue) / 100 * 10;

  return Math.round(total * 10) / 10; // 0-100
}
```

---

## Génération Pros/Cons objectifs

```typescript
// src/scoring/prosCons.ts

export function generateProsCons(output: SimulationOutput): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  // Tax burden
  if (output.taxation.effectiveRate < 0.15) {
    pros.push(`Pression fiscale très basse (${(output.taxation.effectiveRate * 100).toFixed(1)}%)`);
  } else if (output.taxation.effectiveRate > 0.45) {
    cons.push(`Pression fiscale très élevée (${(output.taxation.effectiveRate * 100).toFixed(1)}%)`);
  }

  // Dead weight (pure cost contributions)
  const deadWeight = output.verdict.deadWeightLoss;
  const revenue = output.netPurchasingPower.grossRevenue;
  if (deadWeight / revenue > 0.15) {
    cons.push(`${(deadWeight/revenue*100).toFixed(0)}% du CA part en cotisations sans contrepartie réelle pour vous (CSG/CRDS, retraite improbable, etc.)`);
  }

  // Healthcare
  if (output.qualityOfLife.healthcareQuality >= 8) {
    pros.push(`Couverture santé de qualité${output.qualityOfLife.healthcareQuality >= 9 ? ' excellente' : ''} et effectivement perçue`);
  } else if (output.qualityOfLife.healthcareQuality < 6) {
    cons.push("Couverture santé limitée — assurance privée quasi obligatoire");
  }

  // Exit tax
  switch (output.verdict.exitTaxRisk) {
    case "high":
      cons.push("Exit tax agressive si vous décidez de partir plus tard (verrou fiscal)");
      break;
    case "none":
      pros.push("Aucune exit tax — liberté de sortie");
      break;
  }

  // Visa
  if (output.qualityOfLife.visaComplexity > 7) {
    cons.push("Visa très difficile à obtenir pour non-nationaux");
  } else if (output.qualityOfLife.visaComplexity <= 2) {
    pros.push("Accès facile (UE ou équivalent)");
  }

  // Safety
  if (output.qualityOfLife.safety >= 9) {
    pros.push("Sécurité personnelle excellente");
  }

  return { pros, cons };
}
```
