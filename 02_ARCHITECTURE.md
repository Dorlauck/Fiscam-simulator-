# PRD — Simulateur d'Impôts & Pouvoir d'Achat pour Entrepreneurs

> **Version 1.0 — Avril 2026**
> Document à destination de Claude Code pour l'implémentation.

---

## 1. Vision produit

Un simulateur **brutalement honnête** qui répond à une seule question :

> *"Combien il me reste vraiment dans la poche, à la fin du mois, après impôts, charges, loyer et nourriture — et qu'est-ce que j'obtiens en échange ?"*

Le point de différenciation : **pas de bullshit étatique**. Les "avantages" affichés ne sont retenus que s'ils sont **effectivement perçus par l'entrepreneur**. Une cotisation retraite qui a 0% de chance d'être versée dans 40 ans n'est **pas** un avantage, c'est un prélèvement sec.

### 1.1 Utilisateur cible

Entrepreneur entre 25 et 45 ans, CA annuel entre 80k€ et 500k€, 3 profils :
- **SOLO** : freelance / consultant / créateur (agence perso, dev, coach) — 1 personne, pas d'équipe
- **STARTUP** : fondateur SaaS / produit tech — mix salaire + dividendes, vise la croissance
- **ECOM** : e-commerce / DTC / dropshipping — marges volatiles, stocks, TVA internationale

### 1.2 Non-objectifs

- ❌ Ce n'est **pas** un outil de conformité fiscale (pas de déclaration automatique).
- ❌ Ce n'est **pas** un simulateur pour salariés.
- ❌ Ce n'est **pas** un comparateur de pays de vacances / retraite.
- ❌ Ne gère **pas** les holdings multi-juridictions (v2).

---

## 2. Architecture fonctionnelle

### 2.1 Flow utilisateur

```
[1] INPUT               [2] CALCUL            [3] OUTPUT
─────────────           ──────────────        ─────────────
Profil (solo/startup)   → moteur fiscal →    Net dans la poche (€/mois)
CA annuel brut          → +coût de vie →    Pouvoir d'achat réel
Statut familial         → +qualité vie →    Score composite /100
Pays/ville              ↓                    Pros/Cons objectifs
Charges pro réelles     Données JSON          Ranking des 6 juridictions
```

### 2.2 Modules

1. **`engine/`** — calculs fiscaux purs (pas d'UI)
2. **`data/`** — JSON par pays (tranches, cotisations, seuils)
3. **`cost-of-living/`** — JSON logement, alimentation, transport, santé
4. **`scoring/`** — composite score + pros/cons
5. **`ui/`** — Next.js + Tailwind (suggestion)
6. **`tests/`** — cas de test validés à la main (voir 07_EXAMPLES.md)

---

## 3. Modèle de données — entrée utilisateur

```typescript
type SimulationInput = {
  profile: "SOLO" | "STARTUP" | "ECOM";
  revenue: {
    grossAnnual: number;          // CA HT annuel en EUR
    businessExpensesAnnual: number; // charges pro déductibles
    stockCosts?: number;          // pour ECOM uniquement
  };
  compensation: {              // pour STARTUP uniquement
    salaryShare: number;       // % du net à prendre en salaire (0-100)
    dividendShare: number;     // % en dividendes
  };
  personal: {
    familyStatus: "single" | "couple" | "couple_children";
    children: number;
    age: number;               // impact assurance santé US
  };
  jurisdiction: "FR" | "US_NY" | "US_CA" | "US_FL_MIAMI" | "MT" | "JP" | "UK";
  residencyStatus?: {
    isNonDom?: boolean;        // Malte, UK avant 2025
    residencyYears?: number;   // Japon (< 5 ans = non-permanent)
  };
  lifestyle: {
    housingType: "studio" | "t2" | "t3" | "t4";
    location: "center" | "periphery";
    carOwnership: boolean;
    privateHealthcare: boolean;
    diningOutFrequency: "low" | "medium" | "high";
  };
};
```

---

## 4. Modèle de données — sortie

```typescript
type SimulationOutput = {
  jurisdiction: string;
  profile: string;
  
  // 1. Bloc fiscal pur
  taxation: {
    corporateTax: number;        // annuel EUR
    incomeTax: number;
    socialContributions: number;
    socialContributionsBreakdown: {
      effectivelyValuable: number;  // santé réelle, indemnités courtes
      nominallyValuable: number;    // retraite, chômage (selon pays)
      pureCost: number;             // CRDS, PUMa, fractions hors prestations
    };
    dividendTax?: number;
    vatNet?: number;             // pour ECOM
    localTaxes: number;          // CFE, council tax, NYC income tax, etc.
    totalTaxAndContributions: number;
    effectiveRate: number;       // %
  };

  // 2. Coût de la vie (benchmarks)
  costOfLiving: {
    rent: number;
    food: number;
    transport: number;
    healthcare: number;          // cotisations privées ou out-of-pocket
    utilities: number;
    totalMonthly: number;
  };

  // 3. Pouvoir d'achat net
  netPurchasingPower: {
    grossRevenue: number;
    netAfterTax: number;
    netAfterCOL: number;          // après coût de la vie
    realMonthlyCashflow: number;
    savingsRate: number;          // %
  };

  // 4. Qualité de vie (scoring 0-10, pas d'opinion sur la "culture")
  qualityOfLife: {
    healthcareQuality: number;   // basé sur WHO + out-of-pocket
    safety: number;              // basé sur UNODC + indices
    infrastructureTech: number;  // internet, coworking, banking
    visaComplexity: number;      // 0 = ouvert, 10 = fermé
    exitCostScore: number;       // exit tax, plus-values en sortie
  };

  // 5. Verdict objectif
  verdict: {
    score: number;                // /100
    rank: number;                 // position vs autres juridictions
    pros: string[];               // objectivement vérifiables
    cons: string[];
    deadWeightLoss: number;       // cotisations sans contrepartie réelle
    exitTaxRisk: "none" | "low" | "moderate" | "high";
  };
};
```

---

## 5. Règles d'objectivité (RULES ENGINE)

**Principe N°1 : une cotisation n'est un "avantage" que si elle est probable à la perception et perçue par le profil cible (25-45 ans, entrepreneur).**

| Cotisation | Traitement |
|---|---|
| Retraite France (système par répartition, ratio démographique qui se dégrade) | ❌ `pureCost` — probabilité perception < 50% pour <45 ans |
| Retraite UK (State Pension) | ⚠️ `nominallyValuable` — existe mais ~£230/semaine max, insuffisant |
| Retraite US (Social Security) | ⚠️ `nominallyValuable` — Trust Fund épuisement prévu ~2034 |
| Retraite Japon (Kokumin Nenkin) | ⚠️ `nominallyValuable` — défi démographique majeur |
| Retraite Malte | ⚠️ `nominallyValuable` — système plus petit, plus fragile |
| Santé France (Assurance Maladie) | ✅ `effectivelyValuable` — prestation réelle et accessible |
| Santé UK (NHS) | ⚠️ mixte — prestation existe mais délais d'attente majeurs |
| Santé US (Medicare part via FICA) | ❌ pour <65 ans : pure taxe, pas de prestation avant 65 ans |
| Santé Japon (Kenko Hoken) | ✅ `effectivelyValuable` — haute qualité, 30% reste à charge |
| Assurance chômage (salarié) | ⚠️ `nominallyValuable` — entrepreneurs souvent exclus |
| PUMa France | ❌ `pureCost` pour non-assujettis à prestations distinctes |
| CSG/CRDS France | ❌ `pureCost` — pas de contrepartie directe |

**Principe N°2 : distinguer le nominal du réel.**
Le taux d'IS à 25% français est nominal — il faut ajouter la flat tax dividende (30% en 2026) pour obtenir le taux réel de sortie de cash : environ **47,5% de double imposition cumulée**.

**Principe N°3 : intégrer le risque de sortie.**
La France applique une exit tax si l'entrepreneur détient >800k€ ou >50% d'une société. Les US appliquent une expatriation tax (IRC 877A). Le UK a une Temporary Non-Residence Rule. Malte et le Japon n'en ont pas (avantage).

**Principe N°4 : coût de la vie = partie du calcul, pas une annexe.**
Un net de 5000€/mois à Paris ≠ 5000€/mois à Miami. Le vrai indicateur est le **cashflow disponible après coût de vie standardisé** (panier commun : logement équivalent, alimentation correcte, transport, santé de base).

---

## 6. Juridictions couvertes — v1

| Code | Nom | Particularité v1 |
|---|---|---|
| `FR` | France (Paris) | Micro-entreprise, SASU, EURL IS |
| `US_NY` | USA — New York City | LLC, S-Corp, fédéral + NY State + NYC |
| `US_CA` | USA — Californie (SF/LA) | LLC + franchise tax, S-Corp à 1.5% |
| `US_FL_MIAMI` | USA — Miami (Floride) | Pas d'impôt d'État |
| `MT` | Malte (Valletta/Sliema) | Non-dom + 6/7 refund corporate |
| `JP` | Japon (Tokyo) | Résident non-permanent, KK, GK |
| `UK` | Royaume-Uni (Londres) | Ltd, sole trader, nouveau FIG 2025 |

---

## 7. Livrables attendus de Claude Code

1. **Next.js 15 + TypeScript** (App Router)
2. **shadcn/ui** + Tailwind
3. Pur client-side : tous les calculs tournent dans le navigateur (pas de backend)
4. Tests unitaires Vitest sur chaque fonction du moteur fiscal (cas de 07_EXAMPLES.md doivent passer au euro près, tolérance ±1%)
5. Export PDF du résultat de la simulation
6. Design responsive mobile-first
7. Accessible en français **et** anglais (i18n)
8. Open data : tous les fichiers JSON de `data/` sont versionnés et datés

---

## 8. Avertissement légal (à intégrer dans l'UI)

> Ce simulateur est un outil d'aide à la réflexion construit à partir de données publiques à date d'avril 2026. Les taux et barèmes évoluent chaque année. Ce n'est ni un conseil fiscal, ni un conseil en investissement, ni un conseil juridique. Consulte un avocat fiscaliste ou un expert-comptable avant toute décision d'expatriation ou de restructuration.

---

## 9. Feuille de route

- **v1.0** (MVP) — 6 juridictions, 3 profils, moteur fiscal complet, scoring
- **v1.1** — ajout Dubai, Portugal (NHR 2.0), Suisse (Genève/Zoug)
- **v1.2** — simulation multi-années (scale-up à 5 ans)
- **v2.0** — holdings internationales, structure multi-juridictions
