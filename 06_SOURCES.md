# Maquette UI — Tax Simulator

## Principe directeur

**Une landing dense en info + trois écrans de simulation.**

L'utilisateur doit pouvoir comparer les 6 juridictions en moins de 60 secondes.

---

## Écran 1 — Landing / Quiz d'entrée

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   L'IMPÔT RÉEL, PAS CELUI QU'ON T'A PROMIS                │
│   ─────────────────────────────────────                    │
│                                                             │
│   Compare ce qu'il te reste vraiment, dans 6 pays,         │
│   pour ton profil d'entrepreneur.                          │
│                                                             │
│   [Commencer la simulation →]                              │
│                                                             │
│   ⚠️ On ne te vend rien. Pas d'email. Pas de tracking.     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CE QU'ON FAIT DIFFÉREMMENT                                 │
│                                                             │
│  ✓ On distingue les cotisations RÉELLEMENT UTILES          │
│    (santé perçue, services) des cotisations NOMINALES       │
│    (retraite qui ne viendra probablement jamais pour        │
│    ta génération) et des PURES CHARGES (CSG, Medicare       │
│    avant 65 ans...).                                        │
│                                                             │
│  ✓ On intègre le coût réel de vivre dans chaque ville.     │
│    5000€ à Paris ≠ 5000€ à Miami.                          │
│                                                             │
│  ✓ On affiche l'exit tax et les pièges de sortie —         │
│    parce que "low tax now" peut coûter cher plus tard.     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Écran 2 — Formulaire d'entrée (3 étapes, 1 page)

```
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 / 3  —  TON PROFIL                                │
│                                                             │
│   [ SOLO ]  [ STARTUP ]  [ ECOM ]                          │
│   freelance  fondateur   e-commerce                         │
│                                                             │
│  CA annuel brut:  [    200 000    ] €                      │
│                                                             │
│  Charges pro     [     20 000     ] €                      │
│  déductibles:                                              │
│                                                             │
│  Famille:  [○ Seul(e)] [○ Couple] [○ Couple + enfants]    │
│  Enfants:  [0 ▼]                                           │
│  Âge:      [    35    ]                                    │
│                                                             │
│  [ Suivant → ]                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 / 3  —  TON MODE DE VIE                           │
│                                                             │
│  Logement cible:  [Studio] [T2/1BR] [T3/2BR] [T4]          │
│  Quartier:        [Centre-ville ▼]                         │
│  Voiture:         [○ Oui  ● Non]                           │
│  Santé privée:    [● Oui  ○ Non]   ← requis aux US        │
│  Restos:          [Rare] [Moyen] [Fréquent]               │
│                                                             │
│  [ Suivant → ]                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 / 3  —  HYPOTHÈSES DE COMPARAISON                 │
│                                                             │
│  Juridictions à comparer:                                  │
│  [x] France (Paris)                                        │
│  [x] USA - New York                                        │
│  [x] USA - Californie                                      │
│  [x] USA - Miami (Floride)                                 │
│  [x] Malte                                                 │
│  [x] Japon (Tokyo)                                         │
│  [x] UK (Londres)                                          │
│                                                             │
│  ⚠️ Si tu coches Malte, on t'assume résident fiscal       │
│  maltais légitime (>183 jours, substance réelle).         │
│                                                             │
│  [ Lancer la simulation → ]                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Écran 3 — Résultat / Comparaison

```
┌──────────────────────────────────────────────────────────────────┐
│  CA 200 000 € / SOLO / Célibataire                                │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  CASHFLOW RÉEL MENSUEL (après impôts, charges, loyer, bouffe)   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  🇲🇹 Malte        ████████████████████████ 10 200 €  [Détails→] │
│  🇺🇸 Miami        █████████████████        7 800 €   [Détails→] │
│  🇯🇵 Tokyo        ██████████████           6 400 €   [Détails→] │
│  🇬🇧 Londres      █████████████            5 900 €   [Détails→] │
│  🇺🇸 New York     ████████████             5 500 €   [Détails→] │
│  🇫🇷 Paris        ██████████               4 600 €   [Détails→] │
│  🇺🇸 Californie   █████████                4 200 €   [Détails→] │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐ ┌─────────────────────────┐
│  🥇 MALTE               │ │  🇫🇷 PARIS              │
│  Score 91/100           │ │  Score 52/100           │
│                         │ │                         │
│  Brut        200 000 €  │ │  Brut        200 000 €  │
│  Impôts      - 18 000 € │ │  Impôts      - 95 000 € │
│  Vie (x12)   - 40 000 € │ │  Vie (x12)   - 50 000 € │
│  ─────────────────────  │ │  ─────────────────────  │
│  Reste       142 000 €  │ │  Reste        55 000 €  │
│                         │ │                         │
│  + Exit tax : aucune    │ │  + Exit tax : lourde    │
│  + Visa     : UE libre  │ │  + Visa     : UE libre  │
│  - Banking  : délicat   │ │  + Santé    : excellente│
│  - Substance: requise   │ │                         │
└─────────────────────────┘ └─────────────────────────┘
```

### Détails d'une juridiction — expansion

```
┌──────────────────────────────────────────────────────────────┐
│  🇫🇷 PARIS — Détail fiscal                                    │
│                                                              │
│  Structure recommandée : SASU à l'IS                         │
│                                                              │
│  [Camembert interactif]                                      │
│                                                              │
│  💰 Sur 200 000 € de CA :                                   │
│                                                              │
│  Charges sociales (dont)                  │  42 200 € │ 21%  │
│    ✓ Santé (réellement perçue)            │  10 000 € │      │
│    ⚠ Retraite (perception incertaine)     │  19 000 € │      │
│    ✗ CSG/CRDS & dead weight               │  13 200 € │      │
│                                                              │
│  Impôt Société (IS 15% + 25%)             │  24 000 € │ 12%  │
│  Flat tax dividendes (31.4%)              │  25 120 € │ 13%  │
│  Impôt sur le revenu                      │   5 802 € │  3%  │
│                                           ├───────────┤      │
│  TOTAL PRÉLEVÉ                            │  97 122 € │ 49%  │
│                                                              │
│  NET EN POCHE                             │ 102 878 € │      │
│                                                              │
│  Coût de vie Paris (T2 centre) / an       │  48 000 € │      │
│                                           ├───────────┤      │
│  DISPO RÉEL / AN                          │  54 878 € │      │
│  DISPO RÉEL / MOIS                        │   4 573 € │      │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  ✅ POINTS POSITIFS (objectifs)                              │
│  • Couverture santé excellente et effectivement perçue      │
│  • Aucune difficulté visa (citoyen UE)                      │
│  • Infrastructure fintech + banque solide                   │
│  • Qualité de vie urbaine reconnue                          │
│                                                              │
│  ❌ POINTS NÉGATIFS (objectifs)                              │
│  • 6.6% du CA = CSG/CRDS sans contrepartie directe          │
│  • 9.5% du CA = cotisations retraite probablement perdues   │
│  • Exit tax (art. 167 bis) verrouille >800k€ de patrimoine  │
│  • Double imposition IS + PFU = ~47% sur les dividendes     │
│  • Président SASU n'a PAS droit au chômage (vs charge prise)│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Composants à construire

### `<ComparisonChart />` (recharts)

```tsx
<BarChart
  data={sortedJurisdictions}
  layout="vertical"
  barSize={30}
>
  <XAxis type="number" unit=" €/mois" />
  <YAxis type="category" dataKey="name" />
  <Bar dataKey="realMonthlyCashflow">
    {entries.map((entry, i) => (
      <Cell key={i} fill={getColorByRank(i)} />
    ))}
  </Bar>
  <Tooltip content={<CustomTooltip />} />
</BarChart>
```

### `<BreakdownPieChart />`

Camembert avec 4 segments :
- Net en poche (vert)
- Cotisations "effectivelyValuable" (vert clair)
- Cotisations "nominallyValuable" (orange)
- Pure cost (rouge)

### `<ProsConsList />`

Liste à deux colonnes. Utilise `Check` / `X` de `lucide-react`.

### `<ExitTaxWarning />`

Badge visible si `exitTaxRisk >= "moderate"`.

---

## Palette de couleurs

- Primary green : `#10b981` (net en poche)
- Yellow warning : `#f59e0b` (nominally valuable)
- Red cost : `#ef4444` (dead weight)
- Neutral : `#64748b`
- Background : `#fafafa` / `#0f172a` (dark mode)

## Responsive

- Mobile (< 768px) : carte par juridiction, scrollable verticalement
- Tablet (768-1024px) : 2 colonnes
- Desktop (> 1024px) : comparaison horizontale complète

## Animations

- Garder minimal. Juste `transition-all` sur les cartes et les graphiques qui s'animent (recharts le fait par défaut).
- PAS de parallaxes, PAS de scroll animations. Le produit est sérieux.

## Dark mode

- Par défaut. Toggle via `next-themes`.

## i18n

- `/fr` (default) et `/en`
- Stockage des strings dans `src/lib/i18n.ts` (objet typé, pas de librairie lourde)
