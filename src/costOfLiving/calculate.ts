import type { Jurisdiction, LifestyleInput } from "../engine/types";
import franceData from "../data/france-2026.json";
import usaNyData from "../data/usa-ny-2026.json";
import usaCaData from "../data/usa-ca-2026.json";
import usaFlData from "../data/usa-fl-2026.json";
import ukData from "../data/uk-2026.json";
import maltaData from "../data/malta-2026.json";
import japanData from "../data/japan-2026.json";

const EXCHANGE = {
  EUR_USD: 1.09,
  EUR_GBP: 0.83,
  EUR_JPY: 163,
};

export interface CostOfLivingResult {
  /** Toutes valeurs en EUR, mensuel */
  rent: number;
  food: number;
  transport: number;
  healthcare: number;
  utilities: number;
  diningOut: number;
  gym: number;
  internet: number;
  totalMonthly: number;
  totalAnnual: number;
  localCurrency: "EUR" | "USD" | "GBP" | "JPY";
}

/** Convertit un montant depuis la devise locale vers EUR. */
function toEUR(amount: number, currency: CostOfLivingResult["localCurrency"]): number {
  switch (currency) {
    case "EUR":
      return amount;
    case "USD":
      return amount / EXCHANGE.EUR_USD;
    case "GBP":
      return amount / EXCHANGE.EUR_GBP;
    case "JPY":
      return amount / EXCHANGE.EUR_JPY;
  }
}

/**
 * Sélectionne le loyer dans la bonne catégorie (studio → t4) et la zone (center / periphery).
 * Retourne 0 si la combinaison n'est pas présente dans les données (utilise un fallback raisonnable).
 */
type RawCol = Record<string, unknown>;

function num(col: RawCol, key: string): number | undefined {
  const v = col[key];
  return typeof v === "number" ? v : undefined;
}

function selectRent(
  col: RawCol,
  housing: LifestyleInput["housingType"],
  location: LifestyleInput["location"]
): number {
  // Préfixes ordonnés du plus fidèle au plus permissif (t4 → t3 en fallback)
  const map: Record<LifestyleInput["housingType"], string[]> = {
    studio: ["rent_studio", "rent_1R_1K", "rent_1R", "rent_1br"],
    t2: ["rent_1br", "rent_1LDK"],
    t3: ["rent_2br", "rent_2LDK"],
    t4: ["rent_3br", "rent_2br"],
  };
  // Variantes possibles de suffixe présentes dans les JSON (center / central / zone1)
  const zones =
    location === "center"
      ? ["_center", "_central", "_zone1"]
      : ["_periphery", "_zone2_3"];
  const suffixes = ["_monthly", "_USD_monthly", "_GBP_monthly", "_JPY_monthly", ""];
  const prefixes = map[housing];

  for (const prefix of prefixes) {
    for (const zone of zones) {
      for (const suffix of suffixes) {
        const v = num(col, `${prefix}${zone}${suffix}`);
        if (v !== undefined) return v;
      }
    }
  }
  // Last-chance fallbacks
  return (
    num(col, "rent_1br_center_monthly") ??
    num(col, "rent_1br_center_USD_monthly") ??
    0
  );
}

interface RawCostBundle {
  col: RawCol;
  currency: CostOfLivingResult["localCurrency"];
}

function pickBundle(jurisdiction: Jurisdiction): RawCostBundle {
  switch (jurisdiction) {
    case "FR":
      return { col: franceData.costOfLiving_Paris_2026_EUR as RawCol, currency: "EUR" };
    case "US_NY":
      return { col: usaNyData.costOfLiving_NYC_2026_USD as RawCol, currency: "USD" };
    case "US_CA":
      // SF a un bloc spécifique partiel ; complète avec NYC comme baseline US coast-city
      return {
        col: {
          ...(usaNyData.costOfLiving_NYC_2026_USD as RawCol),
          ...(usaCaData.costOfLiving_SF_specific as RawCol),
        },
        currency: "USD",
      };
    case "US_FL_MIAMI":
      return { col: usaFlData.costOfLiving_Miami_2026_USD as RawCol, currency: "USD" };
    case "UK":
      return { col: ukData.costOfLiving_London_2026_GBP as RawCol, currency: "GBP" };
    case "MT":
      return { col: maltaData.costOfLiving_Valletta_Sliema_2026_EUR as RawCol, currency: "EUR" };
    case "JP":
      return { col: japanData.costOfLiving_Tokyo_2026_JPY as RawCol, currency: "JPY" };
  }
}

export interface COLInput {
  jurisdiction: Jurisdiction;
  lifestyle: LifestyleInput;
  /** Age — utilisé pour décider de l'assurance santé privée US < 65 ans */
  age: number;
}

export function calculateCostOfLiving(input: COLInput): CostOfLivingResult {
  const { col, currency } = pickBundle(input.jurisdiction);
  const ls = input.lifestyle;

  const rent = selectRent(col, ls.housingType, ls.location);

  const groceries =
    num(col, "groceries_single_monthly") ?? num(col, "groceries_single_USD_monthly") ?? 0;
  const restaurant = num(col, "restaurant_midrange_2pax") ?? 0;
  const diningMap: Record<LifestyleInput["diningOutFrequency"], number> = {
    low: restaurant * 1,
    medium: restaurant * 4,
    high: restaurant * 10,
  };
  const diningOut = diningMap[ls.diningOutFrequency];

  const utilities =
    (num(col, "utilities_monthly") ?? num(col, "utilities_monthly_small_apt") ?? 0) +
    (num(col, "internet_monthly") ?? 0);

  const transportPublic =
    num(col, "transport_public_monthly") ??
    num(col, "transit_monthly") ??
    num(col, "transit_zone1_2_monthly") ??
    num(col, "publicTransit_monthly") ??
    num(col, "transit_monthly_USD") ??
    0;
  const carMonthly =
    num(col, "car_monthly_estimate") ?? num(col, "carRental_monthly") ?? 500;
  const transport = ls.carOwnership ? carMonthly : transportPublic;

  const privateHealthMonthly =
    num(col, "healthInsurance_private_monthly") ??
    num(col, "privateHealthcare_monthly") ??
    num(col, "healthInsurance_private_monthly_EUR") ??
    0;
  const needsPrivateHealth =
    input.jurisdiction === "US_NY" ||
    input.jurisdiction === "US_CA" ||
    input.jurisdiction === "US_FL_MIAMI";
  const healthcare =
    needsPrivateHealth && input.age < 65
      ? privateHealthMonthly
      : ls.privateHealthcare
        ? privateHealthMonthly
        : 0;

  const gym = num(col, "gym_monthly") ?? 0;
  const internet = num(col, "internet_monthly") ?? 0;

  const totalLocal =
    rent + groceries + diningOut + utilities + transport + healthcare + gym;

  const toEurIfNeeded = (v: number) => toEUR(v, currency);

  return {
    rent: toEurIfNeeded(rent),
    food: toEurIfNeeded(groceries),
    transport: toEurIfNeeded(transport),
    healthcare: toEurIfNeeded(healthcare),
    utilities: toEurIfNeeded(utilities),
    diningOut: toEurIfNeeded(diningOut),
    gym: toEurIfNeeded(gym),
    internet: toEurIfNeeded(internet),
    totalMonthly: toEurIfNeeded(totalLocal),
    totalAnnual: toEurIfNeeded(totalLocal) * 12,
    localCurrency: currency,
  };
}
