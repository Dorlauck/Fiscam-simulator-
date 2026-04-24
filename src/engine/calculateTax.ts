import type { SimulationInput, StructureResult } from "./types";
import franceData from "../data/france-2026.json";
import usaNyData from "../data/usa-ny-2026.json";
import usaCaData from "../data/usa-ca-2026.json";
import maltaData from "../data/malta-2026.json";
import ukData from "../data/uk-2026.json";
import japanData from "../data/japan-2026.json";

import { calculateMicroEntreprise } from "./structures/micro-entreprise";
import { calculateSASU } from "./structures/sasu";
import { calculateEURL_TNS } from "./structures/eurl-tns";
import { calculateUsaLLC } from "./structures/usa-llc";
import { calculateUsaSCorp } from "./structures/usa-scorp";
import { calculateUkLtd } from "./structures/uk-ltd";
import { calculateMaltaNonDom } from "./structures/malta-nondom";
import { calculateJapanSoleProp } from "./structures/japan-sole";

const EXCHANGE = {
  EUR_USD: 1.09,
  EUR_GBP: 0.83,
  EUR_JPY: 163,
};

export function calculateTax(input: SimulationInput): StructureResult {
  const { profile, revenue, compensation, personal, jurisdiction } = input;
  const salary = compensation?.salaryBrutAnnual ?? 0;
  const dividend = compensation?.dividendTarget ?? 0;

  // ---- France
  if (jurisdiction === "FR") {
    if (profile === "SOLO") {
      const micro = calculateMicroEntreprise(
        {
          revenueGross: revenue.grossAnnual,
          activity: "liberal_BNC_nonCipav",
          familyStatus: personal.familyStatus,
          children: personal.children,
        },
        franceData
      );
      if (!micro.capExceeded) return micro;
    }
    if (profile === "ECOM") {
      return calculateEURL_TNS(
        {
          revenueGross: revenue.grossAnnual,
          businessExpenses: revenue.businessExpensesAnnual + (revenue.stockCosts ?? 0),
          remunerationBrute: salary || 60_000,
          familyStatus: personal.familyStatus,
          children: personal.children,
        },
        franceData
      );
    }
    return calculateSASU(
      {
        revenueGross: revenue.grossAnnual,
        businessExpenses: revenue.businessExpensesAnnual,
        salaryBrutAnnual: salary || 60_000,
        dividendTarget: dividend,
        dividendNetTarget: compensation?.dividendNetTarget,
        familyStatus: personal.familyStatus,
        children: personal.children,
      },
      franceData
    );
  }

  // ---- USA (entrée EUR → conversion USD)
  const usd = (eur: number) => eur * EXCHANGE.EUR_USD;

  if (jurisdiction === "US_NY") {
    if (profile === "STARTUP") {
      return calculateUsaSCorp(
        {
          revenueGrossUSD: usd(revenue.grossAnnual),
          businessExpensesUSD: usd(revenue.businessExpensesAnnual),
          salaryW2USD: usd(salary || revenue.grossAnnual * 0.4),
          distributionUSD: dividend ? usd(dividend) : undefined,
          state: "NY",
          city: "NYC",
          filing: personal.familyStatus === "single" ? "single" : "mfj",
          age: personal.age,
          familyStatus: personal.familyStatus,
          children: personal.children,
        },
        usaNyData,
        { ny_state: usaNyData.ny_state, nyc_local: usaNyData.nyc_local }
      );
    }
    return calculateUsaLLC(
      {
        revenueGrossUSD: usd(revenue.grossAnnual),
        businessExpensesUSD: usd(revenue.businessExpensesAnnual + (revenue.stockCosts ?? 0)),
        state: "NY",
        city: "NYC",
        filing: personal.familyStatus === "single" ? "single" : "mfj",
        age: personal.age,
        familyStatus: personal.familyStatus,
        children: personal.children,
      },
      usaNyData,
      { ny_state: usaNyData.ny_state, nyc_local: usaNyData.nyc_local }
    );
  }

  if (jurisdiction === "US_CA") {
    return calculateUsaLLC(
      {
        revenueGrossUSD: usd(revenue.grossAnnual),
        businessExpensesUSD: usd(revenue.businessExpensesAnnual + (revenue.stockCosts ?? 0)),
        state: "CA",
        city: "SF",
        filing: personal.familyStatus === "single" ? "single" : "mfj",
        age: personal.age,
        familyStatus: personal.familyStatus,
        children: personal.children,
      },
      usaNyData,
      {
        ca_state: {
          incomeTaxBrackets_single_2026: usaCaData.ca_state.incomeTaxBrackets_single_2026,
          standardDeduction_single_2026: usaCaData.ca_state.standardDeduction_single_2026,
        },
        llc_specificTaxes: usaCaData.llc_specificTaxes,
      }
    );
  }

  if (jurisdiction === "US_FL_MIAMI") {
    return calculateUsaLLC(
      {
        revenueGrossUSD: usd(revenue.grossAnnual),
        businessExpensesUSD: usd(revenue.businessExpensesAnnual + (revenue.stockCosts ?? 0)),
        state: "FL",
        city: "MIAMI",
        filing: personal.familyStatus === "single" ? "single" : "mfj",
        age: personal.age,
        familyStatus: personal.familyStatus,
        children: personal.children,
      },
      usaNyData,
      {}
    );
  }

  // ---- UK
  if (jurisdiction === "UK") {
    const gbp = (eur: number) => eur * EXCHANGE.EUR_GBP;
    return calculateUkLtd(
      {
        revenueGrossGBP: gbp(revenue.grossAnnual),
        businessExpensesGBP: gbp(revenue.businessExpensesAnnual + (revenue.stockCosts ?? 0)),
        salaryBrutGBP: gbp(salary || 12_570 / EXCHANGE.EUR_GBP), // default = personal allowance
        dividendTargetGBP: gbp(dividend || revenue.grossAnnual * 0.2),
        familyStatus: personal.familyStatus,
        children: personal.children,
      },
      ukData
    );
  }

  // ---- Malte (non-dom simple : remittance cible = min(profit net, 50k))
  if (jurisdiction === "MT") {
    const profit = Math.max(0, revenue.grossAnnual - revenue.businessExpensesAnnual);
    const remittance = Math.min(profit, 50_000);
    return calculateMaltaNonDom(
      {
        foreignIncomeTotalEUR: revenue.grossAnnual,
        businessExpensesEUR: revenue.businessExpensesAnnual,
        remittanceToMaltaEUR: remittance,
        maltaSourceIncomeEUR: 0,
        familyStatus: personal.familyStatus,
        children: personal.children,
      },
      maltaData
    );
  }

  // ---- Japon
  if (jurisdiction === "JP") {
    const jpy = (eur: number) => eur * EXCHANGE.EUR_JPY;
    return calculateJapanSoleProp(
      {
        revenueGrossJPY: jpy(revenue.grossAnnual),
        businessExpensesJPY: jpy(revenue.businessExpensesAnnual + (revenue.stockCosts ?? 0)),
        useBlueReturn: true,
        familyStatus: personal.familyStatus,
        children: personal.children,
        age: personal.age,
      },
      japanData
    );
  }

  throw new Error(`Jurisdiction ${jurisdiction} not implemented.`);
}

/**
 * Compare un input donné à travers les 7 juridictions. Retourne des résultats
 * convertis en EUR pour comparaison directe.
 */
export function compareJurisdictions(
  baseInput: Omit<SimulationInput, "jurisdiction">,
  jurisdictions: SimulationInput["jurisdiction"][] = [
    "FR",
    "US_NY",
    "US_CA",
    "US_FL_MIAMI",
    "UK",
    "MT",
    "JP",
  ]
): Array<StructureResult & { netInHandEUR: number }> {
  return jurisdictions.map((j) => {
    const result = calculateTax({ ...baseInput, jurisdiction: j });
    let netInHandEUR = result.netInHand;
    // Reconversion locale → EUR
    if (j === "US_NY" || j === "US_CA" || j === "US_FL_MIAMI") {
      netInHandEUR = result.netInHand / EXCHANGE.EUR_USD;
    } else if (j === "UK") {
      netInHandEUR = result.netInHand / EXCHANGE.EUR_GBP;
    } else if (j === "JP") {
      netInHandEUR = result.netInHand / EXCHANGE.EUR_JPY;
    }
    return { ...result, netInHandEUR };
  });
}
