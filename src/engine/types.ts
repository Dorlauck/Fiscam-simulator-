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
