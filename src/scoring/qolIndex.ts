import type { Jurisdiction } from "../engine/types";

export interface QualityOfLife {
  healthcareQuality: number; // 0-10
  safety: number; // 0-10
  infrastructureTech: number; // 0-10
  visaComplexity: number; // 0-10, 0 = ouvert
  exitCostScore: number; // 0-10, 0 = pas d'exit tax
}

/**
 * Scores QoL objectifs par juridiction. Basé sur :
 * - healthcareQuality : WHO + access + out-of-pocket
 * - safety : UNODC + indices locaux
 * - infrastructureTech : moyenne des champs infrastructureScore.*
 * - visaComplexity : champ dédié dans chaque JSON
 * - exitCostScore : champ exitTax.impactScore (inversé pour convention)
 */
export function getQualityOfLife(jurisdiction: Jurisdiction): QualityOfLife {
  // Les scores sont pré-calibrés à partir des JSON (sources citées).
  // Centralisé ici pour éviter d'alourdir calculateCostOfLiving avec logique QoL.
  const map: Record<Jurisdiction, QualityOfLife> = {
    FR: {
      healthcareQuality: 8,
      safety: 6,
      infrastructureTech: 8, // moyenne 8/9/6/9/8 ≈ 8
      visaComplexity: 1, // UE
      exitCostScore: 7, // art. 167 bis CGI
    },
    US_NY: {
      healthcareQuality: 6, // out-of-pocket élevé pour <65 ans
      safety: 6,
      infrastructureTech: 9,
      visaComplexity: 8, // H-1B lottery / O-1
      exitCostScore: 8, // IRC 877A
    },
    US_CA: {
      healthcareQuality: 6,
      safety: 5, // SF perçue comme dégradée
      infrastructureTech: 9,
      visaComplexity: 8,
      exitCostScore: 8,
    },
    US_FL_MIAMI: {
      healthcareQuality: 6,
      safety: 6,
      infrastructureTech: 7,
      visaComplexity: 8,
      exitCostScore: 8,
    },
    UK: {
      healthcareQuality: 6, // NHS avec longs délais
      safety: 7,
      infrastructureTech: 9,
      visaComplexity: 5, // post-Brexit, complexe pour UE
      exitCostScore: 2, // pas d'exit tax mais TNRR
    },
    MT: {
      healthcareQuality: 7,
      safety: 8,
      infrastructureTech: 6,
      visaComplexity: 3,
      exitCostScore: 0, // pas d'exit tax
    },
    JP: {
      healthcareQuality: 9,
      safety: 10,
      infrastructureTech: 8, // excellent sauf banking_foreigners
      visaComplexity: 6, // Business Manager Visa Oct 2025 strict
      exitCostScore: 7, // exit tax si actifs > ¥100M
    },
  };
  return map[jurisdiction];
}
