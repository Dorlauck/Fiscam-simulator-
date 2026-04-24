import type { StructureResult } from "../engine/types";
import type { CostOfLivingResult } from "../costOfLiving/calculate";
import type { QualityOfLife } from "./qolIndex";

export interface ProsConsInputs {
  result: StructureResult;
  col: CostOfLivingResult;
  qol: QualityOfLife;
  revenueGrossEUR: number;
}

export interface ProsCons {
  pros: string[];
  cons: string[];
}

/**
 * Génère des pros/cons OBJECTIFS, vérifiables. Aucun jugement politique.
 * Chaque item est lié à un seuil chiffré ou à une donnée JSON.
 */
export function generateProsCons(inputs: ProsConsInputs): ProsCons {
  const { result, col, qol, revenueGrossEUR } = inputs;
  const pros: string[] = [];
  const cons: string[] = [];

  // ---- Pression fiscale
  if (result.effectiveRate < 0.15) {
    pros.push(`Pression fiscale très basse (${(result.effectiveRate * 100).toFixed(1)}% du CA)`);
  } else if (result.effectiveRate < 0.25) {
    pros.push(`Pression fiscale modérée (${(result.effectiveRate * 100).toFixed(1)}% du CA)`);
  } else if (result.effectiveRate > 0.45) {
    cons.push(`Pression fiscale très élevée (${(result.effectiveRate * 100).toFixed(1)}% du CA)`);
  } else if (result.effectiveRate > 0.35) {
    cons.push(`Pression fiscale élevée (${(result.effectiveRate * 100).toFixed(1)}% du CA)`);
  }

  // ---- Dead weight loss (cotisations pureCost)
  const dwl = result.socialContributionsBreakdown.pureCost;
  if (revenueGrossEUR > 0) {
    const dwlRatio = dwl / revenueGrossEUR;
    if (dwlRatio > 0.15) {
      cons.push(
        `${(dwlRatio * 100).toFixed(0)}% du CA en cotisations sans contrepartie réelle (CSG/CRDS, retraite improbable, Medicare <65 ans, etc.)`
      );
    } else if (dwlRatio < 0.03) {
      pros.push("Quasi aucune cotisation 'pureCost' — ce que vous payez vous revient");
    }
  }

  // ---- Santé
  if (qol.healthcareQuality >= 9) {
    pros.push("Couverture santé excellente et effectivement perçue");
  } else if (qol.healthcareQuality >= 7) {
    pros.push("Couverture santé de qualité et accessible");
  } else if (qol.healthcareQuality <= 6) {
    cons.push("Couverture santé limitée — assurance privée quasi-obligatoire");
  }

  // ---- Exit tax
  if (qol.exitCostScore === 0) {
    pros.push("Aucune exit tax — liberté totale de sortie");
  } else if (qol.exitCostScore >= 7) {
    cons.push("Exit tax agressive si vous quittez plus tard (verrou fiscal)");
  }

  // ---- Visa
  if (qol.visaComplexity <= 2) {
    pros.push("Accès facile (UE ou équivalent — pas de visa complexe)");
  } else if (qol.visaComplexity >= 7) {
    cons.push("Visa très difficile à obtenir pour non-nationaux");
  }

  // ---- Sécurité
  if (qol.safety >= 9) {
    pros.push("Sécurité personnelle excellente");
  } else if (qol.safety < 5) {
    cons.push("Indices de sécurité préoccupants pour une ville majeure");
  }

  // ---- Coût de la vie vs cashflow
  if (revenueGrossEUR > 0) {
    const colBurdenRatio = col.totalAnnual / revenueGrossEUR;
    if (colBurdenRatio > 0.5) {
      cons.push(
        `Coût de la vie très élevé : ${(colBurdenRatio * 100).toFixed(0)}% du CA brut en dépenses standardisées`
      );
    } else if (colBurdenRatio < 0.2) {
      pros.push("Coût de la vie raisonnable par rapport au CA");
    }
  }

  // ---- Warnings spécifiques (ex. Malta CFC)
  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      cons.push(`⚠️ ${w}`);
    }
  }

  return { pros, cons };
}
