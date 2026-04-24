export type FamilyStatus = "single" | "couple" | "couple_children";
export type Profile = "SOLO" | "STARTUP" | "ECOM";
export type Jurisdiction =
  | "FR"
  | "US_NY"
  | "US_CA"
  | "US_FL_MIAMI"
  | "MT"
  | "JP"
  | "UK";

export interface Bracket {
  min: number;
  max: number | null;
  rate: number;
  deduction?: number;
  name?: string;
}

export interface ContributionBreakdown {
  effectivelyValuable: number;
  nominallyValuable: number;
  pureCost: number;
}

export type Currency = "EUR" | "USD" | "GBP" | "JPY";

/**
 * Trajet fiscal détaillé : CA → société → personne physique.
 * Toutes les valeurs sont dans la devise locale de la juridiction.
 * La conversion en EUR se fait à l'affichage (voir src/ui/hooks/useSimulation).
 *
 * Chaque étape est documentée pour que l'UI puisse afficher un waterfall
 * où l'utilisateur voit *l'ordre* des prélèvements et *ce qui reste à chaque niveau*.
 */
export interface TaxFlow {
  currency: Currency;

  // === Niveau SOCIÉTÉ (0 si structure pass-through / sole prop) ===
  revenue: number; // CA brut
  businessExpenses: number; // charges pro déductibles
  /** Coût salarial du président pour la société (salaire + cotisations employeur). 0 si pas de société. */
  salaryCost: number;
  /** Bénéfice avant IS (ou équivalent corporate tax). 0 si structure sans IS. */
  profitBeforeCorpTax: number;
  /** IS / CT / Malta corp tax. */
  corporateTax: number;
  /** Bénéfice après IS, distribuable. */
  profitAfterCorpTax: number;
  /** Dividendes bruts distribués. */
  dividendGross: number;
  /** Portion du bénéfice après IS qui reste dans la société (réserves). */
  retainedInCompany: number;

  // === Niveau PERSONNE PHYSIQUE ===
  /** Salaire brut du président / dirigeant (0 si pas de salaire). */
  salaryGross: number;
  /** Cotisations côté employeur (déjà comprises dans salaryCost). Info pour le breakdown. */
  employerContrib: number;
  /** Cotisations côté salarié (déduites du salaire brut pour obtenir le net). */
  employeeContrib: number;
  /** Salaire net avant IR = salaryGross - employeeContrib. */
  salaryNet: number;
  /** IR sur le salaire (la portion d'IR attribuable au salaire). */
  salaryIncomeTax: number;
  /** Salaire net après IR = ce qui reste en poche via la voie salariale. */
  salaryTakeHome: number;
  /** Dividende net après PFU / dividend tax. */
  dividendTax: number;
  dividendNet: number;
  /** Sole-prop / freelance : SE tax, CSG sur micro, NI class 4, etc. */
  selfEmploymentTax: number;
  /** IR sur le revenu d'activité indépendante (sole prop, micro). 0 si SASU. */
  soleIncomeTax: number;
  /** Taxes additionnelles (MCTMT, franchise CA, enterprise tax JP). */
  otherTaxes: number;

  // === Agrégats ===
  /** Total des prélèvements (taxes + cotisations) = sommes de toutes les poches gouvernement. */
  totalLevied: number;
  /** Net en poche total de la personne physique (salary + dividend après tout IR). */
  netTakeHome: number;
  /** Part conservée en société (pas en poche, pas en impôt). */
  retainedAmount: number;
}

export interface StructureResult {
  structure: string;
  jurisdiction: Jurisdiction;
  corporateTax: number;
  socialContributions: number;
  socialContributionsBreakdown: ContributionBreakdown;
  dividendTax: number;
  incomeTax: number;
  otherTaxes: number;
  totalTax: number;
  netInHand: number;
  effectiveRate: number;
  warnings: string[];
  capExceeded?: boolean;
  suggestedStructure?: string;
  /** Trajet fiscal détaillé — nécessaire pour l'UI waterfall et PDF. */
  flow: TaxFlow;
}

export interface LifestyleInput {
  housingType: "studio" | "t2" | "t3" | "t4";
  location: "center" | "periphery";
  carOwnership: boolean;
  privateHealthcare: boolean;
  diningOutFrequency: "low" | "medium" | "high";
}

export interface SimulationInput {
  profile: Profile;
  revenue: {
    grossAnnual: number;
    businessExpensesAnnual: number;
    stockCosts?: number;
  };
  compensation?: {
    salaryBrutAnnual?: number;
    dividendTarget?: number;
  };
  personal: {
    familyStatus: FamilyStatus;
    children: number;
    age: number;
  };
  jurisdiction: Jurisdiction;
  residencyStatus?: {
    isNonDom?: boolean;
    residencyYears?: number;
  };
  lifestyle?: LifestyleInput;
}
