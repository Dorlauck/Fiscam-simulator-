import type { SimulationInput, StructureResult } from "./types";
import franceData from "../data/france-2026.json";
import { calculateMicroEntreprise } from "./structures/micro-entreprise";
import { calculateSASU } from "./structures/sasu";
import { calculateEURL_TNS } from "./structures/eurl-tns";

/**
 * Orchestrateur principal. Phase 1 : France uniquement (micro, SASU, EURL TNS).
 * Les autres juridictions arrivent en Phase 2.
 */
export function calculateTax(input: SimulationInput): StructureResult {
  if (input.jurisdiction !== "FR") {
    throw new Error(
      `Jurisdiction ${input.jurisdiction} not yet implemented (Phase 1 = France only).`
    );
  }

  const { profile, revenue, compensation, personal } = input;

  // Heuristique : SOLO sous plafond BNC → micro-entreprise, sinon SASU.
  //               STARTUP → SASU par défaut (salaire + dividendes).
  //               ECOM    → EURL TNS (optimisation cotisations sur marge serrée).
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
    // Dépassement → bascule SASU avec tout en salaire (pas de dividendes par défaut)
    return calculateSASU(
      {
        revenueGross: revenue.grossAnnual,
        businessExpenses: revenue.businessExpensesAnnual,
        salaryBrutAnnual: compensation?.salaryBrutAnnual ?? Math.min(revenue.grossAnnual, 60_000),
        dividendTarget: compensation?.dividendTarget ?? 0,
        familyStatus: personal.familyStatus,
        children: personal.children,
      },
      franceData
    );
  }

  if (profile === "STARTUP") {
    return calculateSASU(
      {
        revenueGross: revenue.grossAnnual,
        businessExpenses: revenue.businessExpensesAnnual,
        salaryBrutAnnual: compensation?.salaryBrutAnnual ?? 60_000,
        dividendTarget: compensation?.dividendTarget ?? 0,
        familyStatus: personal.familyStatus,
        children: personal.children,
      },
      franceData
    );
  }

  // ECOM
  return calculateEURL_TNS(
    {
      revenueGross: revenue.grossAnnual,
      businessExpenses: revenue.businessExpensesAnnual + (revenue.stockCosts ?? 0),
      remunerationBrute: compensation?.salaryBrutAnnual ?? 60_000,
      familyStatus: personal.familyStatus,
      children: personal.children,
    },
    franceData
  );
}
