import type { Bracket } from "./types";

export function applyProgressiveBrackets(
  taxableIncome: number,
  brackets: Bracket[]
): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const max = bracket.max ?? Infinity;
    const amountInBracket = Math.min(taxableIncome, max) - bracket.min;
    if (amountInBracket > 0) tax += amountInBracket * bracket.rate;
    if (taxableIncome <= max) break;
  }
  return tax;
}

export function computeQuotientFamilialParts(
  status: "single" | "couple" | "couple_children",
  children: number
): number {
  let parts = status === "single" ? 1 : 2;
  if (children >= 1) parts += 0.5;
  if (children >= 2) parts += 0.5;
  if (children >= 3) parts += children - 2;
  return parts;
}
