# Méthodologie de recherche & Sources

## Principe directeur

Toutes les données fiscales proviennent de **sources officielles gouvernementales** (primaires) ou de **cabinets d'audit Big 4 / EY** (secondaires mais fiables).

Les hypothèses économiques (perception future de la retraite, état du NHS, projections démographiques) sont **explicitement signalées** comme hypothèses avec leurs sources.

---

## Sources primaires par juridiction

### 🇫🇷 France (avril 2026)

| Donnée | Source | Date |
|---|---|---|
| Barème IR 2026 | service-public.fr | Feb 2026 |
| Micro-entreprise 2026 | economie.gouv.fr + urssaf | Jan 2026 |
| LFSS 2026 (ACRE réduit, cotis BNC +1pt) | Journal Officiel | Feb 2026 |
| PFU 2026 (31.4% = 12.8 IR + 18.6 PS) | compta-online.com référence BOFIP | Mar 2026 |
| SASU charges sociales (~82% brut/net) | keobiz.fr, socic.fr | Mar 2026 |
| Exit tax (art. 167 bis CGI) | bofip.impots.gouv.fr | — |

### 🇺🇸 USA fédéral (2026)

| Donnée | Source | Date |
|---|---|---|
| Tranches IR 2026 | IRS Revenue Procedure 2025-32 (via Tax Foundation) | Oct 2025 |
| Self-Employment Tax 2026 | IRS Topic 751, SS Admin | 2026 |
| SS Wage Base 2026 | Social Security Administration | 2026 |
| Standard deduction ($16,100 single, $32,200 MFJ) | OBBBA Act July 2025 + inflation | 2026 |
| QBI deduction | IRS Code §199A | 2026 |
| C-corp rate 21% | IRC §11 | — |
| Exit tax IRC §877A | IRS 2026 | — |

### 🗽 New York State + NYC (2026)

| Donnée | Source |
|---|---|
| NY State 9 brackets 4-10.9% | NY DTF + CBIZ FY 2026 Budget |
| NYC city tax 3.078-3.876% | NYC Comptroller + DTF |
| MCTMT new rates (zone 1 0.6%, zone 2 0.34%) | CBIZ NY Budget 2026 |
| PTET 6.85% | NY DTF AB 150 |
| NYC S-Corp → GCT 8.85% | NYC Dept of Finance |

### 🌴 Californie (2026)

| Donnée | Source |
|---|---|
| CA 9 brackets 1-13.3% | FTB 540 tax rate schedules 2025/2026 |
| $800 franchise tax + LLC gross receipts fee | CA RTC §23153, §17942 |
| CA S-Corp 1.5% entity tax | FTB S-Corp guidelines |
| PTET 9.3% | AB 150 |
| First year LLC exemption (through 2026) | AB 85 extensions |

### ☀️ Floride / Miami (2026)

| Donnée | Source |
|---|---|
| No personal income tax | FL Constitution |
| C-Corp 5.5% | Florida Department of Revenue |
| Sales tax Miami-Dade 7% | FL DoR + county |

### 🇲🇹 Malte (2026)

| Donnée | Source |
|---|---|
| Brackets IR 2026 single/parent | PwC Malta Tax Summary 2026 + MTCA.gov.mt |
| Non-dom remittance basis + €5k min | Income Tax Act chap 123 + 2018 amendments |
| GRP 15% flat + €15k min | Global Residence Programme Rules 2013 |
| 6/7 refund mechanism | Income Tax Management Act |
| MPRP 2025 updates (€500k assets) | Malta Residency Agency 2025 |

### 🇯🇵 Japon (2026)

| Donnée | Source |
|---|---|
| Brackets 5-45% national | National Tax Agency |
| Basic deduction 2026 ¥620k | EY FY2026 Tax Reform Outline Dec 2025 |
| Surtax 2.1% reconstruction | NTA, valid through 2037 |
| Local inhabitant 10% + forest env ¥1k | Municipality/Prefecture codes |
| Non-permanent resident 5-year rule | Japan-guide.com + JETRO |
| Business Manager Visa Oct 2025 new rules | Immigration Services Agency |
| Digital Nomad Visa 2024 | ISA |
| Blue Return ¥650k deduction | NTA |
| Inheritance tax 55% + 10-year rule | JETRO Section 3.7 |

### 🇬🇧 UK (2026/27 tax year)

| Donnée | Source |
|---|---|
| IR brackets 2026/27 | HMRC + theaccountancy.co.uk |
| NI Class 1/4 rates 2026/27 | HMRC guidance |
| Dividend rates NEW 2026 (10.75 / 35.75 / 39.35) | Autumn Budget 2025 announcement |
| Corporation tax 19/25% + marginal relief | HMRC |
| FIG regime replaces old non-dom (April 2025) | Finance Act 2025 |
| BADR increase to 18% (April 2026) | Autumn Budget 2025 |
| MTD for ITSA April 2026 | HMRC |
| IHT reform £2.5M BPR cap | Finance Act 2026 |
| Carried interest → income tax | Finance Act 2026 |

---

## Sources pour coût de la vie

- **Numbeo** (numbeo.com) : base collaborative, large couverture, mis à jour continu
- **Expatistan** (expatistan.com) : benchmark alternatif
- **Coco Community** (coco-community.com) : données locales Paris précises
- **LivingCost.org** : comparaisons inter-villes

**Note** : les prix loyer sont des médianes — l'utilisateur peut ajuster dans les inputs.

---

## Sources pour perception de la retraite

Le choix de classer la retraite comme `nominallyValuable` plutôt que `effectivelyValuable` est **l'hypothèse forte du produit**. Elle repose sur :

### France
- Rapport COR (Conseil d'Orientation des Retraites) — projections démographiques
- Ratio cotisants/retraités : 1.7 en 2026, projeté 1.3 en 2050
- Pension moyenne : 1500€/mois brut — largement insuffisante dans les grandes métropoles
- Historique des "réformes" : recul âge 62→64, probablement 65-67 à horizon 2035-40
- Source : www.cor-retraites.fr

### USA
- Social Security Trust Fund épuisement : **2034** (dernier rapport Trustees 2024)
- Sans réforme, baisse automatique de 21% des paiements
- Source : SSA.gov Annual Trustees Report

### UK
- State Pension age : 66 → 67 (2028) → 68 (2039). Probable recul supplémentaire
- Max £221.20/semaine = ~£11,500/an — insuffisant à Londres
- Source : gov.uk/state-pension

### Japon
- Pire démographie OCDE : ratio 1.6 (2025), 1.1 (2050)
- Kokumin Nenkin max ~¥67,000/mois (~400€) — ne couvre pas Tokyo
- Source : Japan Ministry of Health, Labour and Welfare

### Malte
- Système petit, population 500k
- Expatriés non-dom cotisent rarement (structure offshore)
- Source : social security.gov.mt

---

## Hypothèse critique : taux de change EUR

Tous les montants finaux sont convertis en EUR pour comparaison.

| Paire | Taux avril 2026 (estimé) |
|---|---|
| EUR/USD | 1.09 |
| EUR/GBP | 0.83 |
| EUR/JPY | 163 |

**Limite** : si un utilisateur veut une simulation à 6 mois, les taux auront bougé. Le simulateur doit permettre de surcharger ces taux dans les paramètres avancés.

---

## Ce qui manque volontairement

- **Succession / patrimoine** (hors IHT UK basique) : pas dans MVP, complexité énorme
- **Investment gains / crypto** : v2
- **Statut marital fiscal complexe** (non-dom marié avec dom) : v2
- **Plans de retraite privés optimisables** (401k, PER, ISA) : v2
- **Structures hybrides** (IP box, SIBA Malte, patent box UK) : v2

---

## Check-list de fraîcheur des données

Claude Code doit implémenter un banner qui s'affiche si la date actuelle > 12 mois après `meta.lastUpdated`. Le produit ne doit jamais afficher des données fiscales obsolètes sans avertir l'utilisateur.

```tsx
{shouldShowStalenessWarning && (
  <Banner variant="warning">
    ⚠️ Les données fiscales datent du {meta.lastUpdated}. 
    Les taux 2027 ne sont peut-être pas encore intégrés. 
    Vérifiez sur les sites officiels avant toute décision.
  </Banner>
)}
```

---

## Processus de mise à jour annuelle

1. **Janvier** : publier les projections fiscales de l'année N+1 (loi de finances, budget acts)
2. **Avril** : mise à jour des coûts de vie (indexation automatique via Numbeo)
3. **Mai-Juin** : ajustements après entrée en vigueur (Financial Acts)
4. **Novembre** : annonce des changements N+1 (autumn statements)

Idéalement : fork GitHub public, pull requests ouvertes, communauté qui contribue.
