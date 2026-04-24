# Schéma JSON des données fiscales

Chaque fichier `data/{jurisdiction}-{year}.json` doit respecter cette structure.

## Structure top-level

```typescript
interface JurisdictionData {
  meta: MetaInfo;                           // REQUIRED
  
  // Fiscalité personne physique
  personalIncomeTaxBrackets?: Bracket[];
  additionalIncomeContributions?: Contributions;
  
  // Structures d'entreprise spécifiques
  microEntreprise?: MicroRegime;            // France
  sasu_is?: CompanyRegime;                  // France
  nonDomRegime?: NonDomRegime;              // Malta, UK-old
  residencyCategories?: Record<string, any>; // Japan
  llc_specificTaxes?: any;                  // US California
  fig_regime?: FIGRegime;                   // UK new
  
  // Éléments fédéraux / communs
  corporate?: CorporateTax;
  dividendTax?: DividendTax | DividendRegime;
  selfEmploymentTax?: SEtax;                // US
  nationalInsurance?: NIRegime;             // UK
  localInhabitantTax?: LocalTax;            // Japan
  
  // Transverses
  vat: VATRegime;
  exitTax: ExitTax;
  visaComplexity: VisaInfo;
  socialSecurityPerception: SocialPerception;
  costOfLiving_city: CostOfLiving;
  infrastructureScore: InfrastructureScore;
}
```

## Sous-types

### MetaInfo

```typescript
interface MetaInfo {
  country: string;
  city: string;
  state?: string;
  currency: "EUR" | "USD" | "GBP" | "JPY";
  fiscalYear: number | string;
  lastUpdated: string;                      // ISO 8601
  sources: string[];
  exchangeRate_EUR_local?: number;
}
```

### Bracket

```typescript
interface Bracket {
  min: number;                              // en devise locale
  max: number | null;                       // null = pas de limite haute
  rate: number;                             // 0 à 1 (ex: 0.45 = 45%)
  deduction?: number;                       // formule Japon avec déduction cumulative
  name?: string;                            // libellé (UK: "Basic rate")
}
```

### CorporateTax

```typescript
interface CorporateTax {
  nominalRate?: number;
  reducedRate?: number;
  reducedRateCap?: number;
  normalRate?: number;
  smallProfitsRate_below_50k?: number;
  mainRate_above_250k?: number;
  marginalRelief_between_50k_250k?: boolean;
  marginalRelief_fraction?: string;
  
  // Malta-specific
  refundSystem_6_7?: RefundSystem;
  refundSystem_5_7?: RefundSystem;
  refundSystem_2_3?: RefundSystem;
  finalTax15?: { available_from: number; description: string };
  participationExemption?: { available: boolean; note: string };
}

interface RefundSystem {
  description: string;
  effectiveRate_trading?: number;
  effectiveRate?: number;
  refundMechanic?: string;
  delayDays?: string;
}
```

### DividendTax / DividendRegime

```typescript
interface DividendRegime {
  // France
  pfu_flatTax?: number;
  pfu_breakdown?: { incomeTax: number; socialLevies: number };
  pfu_2026_increased?: number;
  progressiveOption?: { abatement: number; deductibleCSG: number };
  
  // UK
  dividendAllowance_GBP_2026_27?: number;
  rates_2026_27?: { basic: number; higher: number; additional: number };
  
  // Japan
  domesticDividends_withheld?: number;
  
  // Malta (no withholding)
  fromMaltaCorp?: number;
}
```

### NonDomRegime (Malta, UK-old)

```typescript
interface NonDomRegime {
  available: boolean;
  eligibility: string;
  taxationPrinciple: "Remittance basis";
  taxed: string[];
  notTaxed: string[];
  minimumTax?: { amount_EUR: number; condition: string; note?: string };
  indefiniteDuration: boolean;
  note?: string;
}
```

### FIGRegime (UK 2025+)

```typescript
interface FIGRegime {
  replaces_old_nonDom: boolean;
  name: "Foreign Income and Gains (FIG) regime";
  duration: string;                         // "4 years maximum"
  eligibility: string;
  benefit: string;
  transitional_for_former_remittance_users?: string;
  warning?: string;
}
```

### VATRegime

```typescript
interface VATRegime {
  standardRate: number;
  reducedRate?: number;
  reducedRate_1?: number;
  reducedRate_2?: number;
  superReducedRate?: number;
  zeroRate?: number;
  registrationThreshold_GBP?: number;
  microEntrepreneur_franchiseThreshold_2026?: Record<string, number>;
  note?: string;
}
```

### ExitTax

```typescript
interface ExitTax {
  exists: boolean;
  reference?: string;
  trigger?: string;
  rate?: string | number;
  exemption_2026?: number;
  netWorthThreshold?: number;
  sursis?: string;
  liberation?: string;
  impactScore: number;                      // 0-10, 0 = pas de problème, 10 = cauchemar
  note?: string;
}
```

### SocialPerception — LE CŒUR DE L'OBJECTIVITÉ

```typescript
interface SocialPerception {
  healthcare: SocialProgram;
  retirement: SocialProgram;
  unemployment: SocialProgram;
  familyBenefits?: SocialProgram;
  medicare?: SocialProgram;                 // US
  socialSecurity?: SocialProgram;           // US
  NHS?: SocialProgram;                      // UK
  statePension?: SocialProgram;             // UK
}

interface SocialProgram {
  classification: 
    | "effectivelyValuable"                 // L'entrepreneur perçoit réellement
    | "nominallyValuable"                   // Existe sur papier mais perception incertaine
    | "pureCost";                           // Ni prestation ni retour
  effectivelyValuable?: boolean;
  quality?: number;                         // 0-10
  access?: number;                          // 0-10
  reason?: string;
  note?: string;
  demographicRatio_2026?: number;
  demographicRatio_2050_projected?: number;
  maxBenefit_monthly?: number;
  forecasted_replacementRate?: number;
}
```

### VisaInfo

```typescript
interface VisaInfo {
  score: number;                            // 0-10, 0 = ouvert, 10 = fermé
  note: string;
  entrepreneurPaths?: string[];
  startupVisa?: { available: boolean; duration: string; note?: string };
  digitalNomadVisa?: { available: boolean; incomeRequirement_annual?: number };
  countries_with_E2_treaty?: string[];      // US uniquement
  englishSpeaking?: boolean;
  schengenAccess?: boolean;
}
```

### CostOfLiving

```typescript
interface CostOfLiving {
  rent_1br_center_monthly: number;          // en devise locale
  rent_2br_center_monthly: number;
  rent_1br_periphery_monthly?: number;
  groceries_single_monthly: number;
  restaurant_midrange_2pax: number;
  utilities_monthly: number;
  internet_monthly: number;
  transport_public_monthly: number;
  gym_monthly: number;
  healthInsurance_private_monthly?: number;
  carRequired?: boolean;
  note?: string;
}
```

## Règles de validation

Le code doit :
1. Valider chaque fichier JSON au démarrage avec Zod
2. Lever une erreur explicite si un champ `meta.fiscalYear` est obsolète (> 1 an)
3. Refuser de continuer si `socialSecurityPerception` manque (core du produit)
4. Logguer des warnings si `exitTax.impactScore` n'est pas renseigné

## Convention de nommage

- `_EUR` / `_USD` / `_GBP` / `_JPY` : suffixe obligatoire pour les montants
- `rate` : toujours en fraction décimale (0.25 pas 25)
- `_approx` : quand c'est une estimation (ex: charges patronales variables)
- `_note` ou `note` : explication humaine
- `classification` : enum à 3 valeurs uniquement
