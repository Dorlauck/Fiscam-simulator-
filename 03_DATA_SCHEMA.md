# Architecture Technique — Tax Simulator

## Structure du monorepo

```
tax-simulator/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                  # landing + quiz
│   ├── simulator/
│   │   ├── [jurisdiction]/page.tsx
│   │   └── compare/page.tsx      # comparaison multi-juridictions
│   ├── api/
│   │   └── export-pdf/route.ts
│   └── globals.css
│
├── src/
│   ├── engine/                   # MOTEUR FISCAL PUR (aucune dépendance UI)
│   │   ├── index.ts
│   │   ├── calculateTax.ts       # orchestrator principal
│   │   ├── jurisdictions/
│   │   │   ├── france.ts
│   │   │   ├── usa-ny.ts
│   │   │   ├── usa-ca.ts
│   │   │   ├── usa-fl.ts
│   │   │   ├── malta.ts
│   │   │   ├── japan.ts
│   │   │   └── uk.ts
│   │   ├── structures/
│   │   │   ├── micro-entreprise.ts
│   │   │   ├── sasu-eurl.ts
│   │   │   ├── llc-scorp.ts
│   │   │   ├── ltd-company.ts
│   │   │   ├── malta-ltd.ts
│   │   │   └── japan-kk-gk.ts
│   │   ├── socialContributions.ts # isolement des cotisations par type
│   │   ├── dividendTax.ts
│   │   ├── progressiveBrackets.ts # util pour tranches progressives
│   │   └── types.ts
│   │
│   ├── scoring/
│   │   ├── composite.ts           # score /100
│   │   ├── prosCons.ts            # générateur objectif pros/cons
│   │   └── qolIndex.ts            # quality of life index
│   │
│   ├── costOfLiving/
│   │   ├── calculate.ts
│   │   └── basket.ts              # panier standardisé
│   │
│   ├── data/                      # JSON structurés — voir 03_DATA_SCHEMA.md
│   │   ├── fr/
│   │   │   ├── brackets-2026.json
│   │   │   ├── micro.json
│   │   │   ├── sasu.json
│   │   │   └── col-paris.json
│   │   ├── us-ny/ ...
│   │   ├── us-ca/ ...
│   │   ├── us-fl/ ...
│   │   ├── mt/ ...
│   │   ├── jp/ ...
│   │   ├── uk/ ...
│   │   └── meta.json              # version, date, sources
│   │
│   ├── ui/
│   │   ├── components/
│   │   │   ├── ProfileSelector.tsx
│   │   │   ├── RevenueInput.tsx
│   │   │   ├── JurisdictionCard.tsx
│   │   │   ├── ComparisonChart.tsx      # bar chart recharts
│   │   │   ├── BreakdownPieChart.tsx
│   │   │   ├── ProsConsList.tsx
│   │   │   └── ExportButton.tsx
│   │   └── hooks/
│   │       ├── useSimulation.ts
│   │       └── useJurisdictionData.ts
│   │
│   └── lib/
│       ├── i18n.ts                # français / anglais
│       ├── currency.ts            # conversions EUR/USD/GBP/JPY
│       ├── formatters.ts
│       └── constants.ts
│
├── tests/
│   ├── engine.france.test.ts
│   ├── engine.us-ny.test.ts
│   ├── engine.us-ca.test.ts
│   ├── engine.us-fl.test.ts
│   ├── engine.malta.test.ts
│   ├── engine.japan.test.ts
│   ├── engine.uk.test.ts
│   └── fixtures/
│       └── validated-examples.json # cas de test de 07_EXAMPLES.md
│
├── public/
│   └── flags/
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Dépendances principales

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.383.0",
    "zod": "^3.23.0",
    "@react-pdf/renderer": "^3.4.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0"
  }
}
```

## Signature du moteur fiscal principal

```typescript
// src/engine/calculateTax.ts

import type { SimulationInput, SimulationOutput } from "./types";
import { calculateFrance } from "./jurisdictions/france";
import { calculateUsaNy } from "./jurisdictions/usa-ny";
// ... etc

export function calculateTax(input: SimulationInput): SimulationOutput {
  switch (input.jurisdiction) {
    case "FR":           return calculateFrance(input);
    case "US_NY":        return calculateUsaNy(input);
    case "US_CA":        return calculateUsaCa(input);
    case "US_FL_MIAMI":  return calculateUsaFl(input);
    case "MT":           return calculateMalta(input);
    case "JP":           return calculateJapan(input);
    case "UK":           return calculateUk(input);
  }
}

export function compareJurisdictions(
  input: Omit<SimulationInput, "jurisdiction">,
  jurisdictions: Jurisdiction[]
): SimulationOutput[] {
  return jurisdictions
    .map(j => calculateTax({ ...input, jurisdiction: j }))
    .sort((a, b) => b.verdict.score - a.verdict.score);
}
```

## Règle de précision

Toutes les fonctions du moteur doivent être **pures** (pas d'effets de bord), **déterministes**, et leur résultat doit matcher les exemples de `07_EXAMPLES.md` au **1% près**. Les tests Vitest valident ça à chaque commit.

## Gestion des devises

Tous les calculs internes se font dans la **devise locale de la juridiction** (EUR pour FR/MT, USD pour US, GBP pour UK, JPY pour JP). La conversion vers EUR pour l'affichage se fait **en toute dernière étape**.

Taux de change par défaut (mise à jour avril 2026) — à stocker dans `data/meta.json` avec possibilité de surcharge :

- 1 EUR = 1.09 USD
- 1 EUR = 0.83 GBP
- 1 EUR = 163 JPY

## Approche UI : comparaison plutôt que simulation seule

La vraie valeur du produit = **voir côte à côte**. Écran principal :

```
┌─────────────────────────────────────────────────────┐
│ CA : 200 000 €  |  Solo  |  Single                  │
├────────┬──────┬──────┬──────┬──────┬──────┬────────┤
│        │  FR  │ NYC  │  CA  │ MIA  │  MT  │ TOKYO  │
├────────┼──────┼──────┼──────┼──────┼──────┼────────┤
│ Net    │ 125k │ 120k │ 108k │ 152k │ 172k │ 128k   │
│ Vie    │  4k  │  6k  │  5k  │  4k  │  2k  │  3k    │
│ Réel   │  77k │  48k │  48k │ 104k │ 148k │  92k   │
│ Score  │ 62   │ 58   │ 55   │ 83   │ 91   │ 73     │
└────────┴──────┴──────┴──────┴──────┴──────┴────────┘
```

## Performance

- Tous les calculs sont synchrones et légers (<50ms total sur un MacBook Air M1)
- Pas de state management lourd (Zustand ou même useState suffisent)
- Les fichiers JSON de `data/` sont bundlés avec Next (import statique)
- Pas de base de données, pas d'auth — projet 100% statique déployable sur Vercel gratuit
