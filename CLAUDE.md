# Exemples de Calculs Validés — Tests unitaires du moteur fiscal

Tous ces exemples doivent **passer** dans les tests Vitest avec une tolérance de ±1% sur les montants finaux.

Ils sont dérivés des barèmes 2026 officiels. Tolérance ±2% acceptable sur les arrondis de cotisations sociales.

---

## EXEMPLE 1 — SOLO freelance, CA 100k€, célibataire

### 1A. FRANCE — Micro-entreprise BNC (libéral non-CIPAV)

```
INPUT:
- Profile: SOLO
- CA annuel brut: 100 000 €
- Charges pro: N/A (forfait)
- Statut: célibataire
- Ville: Paris
- Structure: Micro-entreprise BNC

CALCULS:
- Plafond micro-entreprise BNC: 83 600 € → DÉPASSÉ
- ⚠️ DOIT BASCULER EN RÉGIME RÉEL (via EURL ou EI)

Le simulateur doit détecter ce cas et afficher un warning:
"À 100k€ vous dépassez le plafond micro-entreprise BNC (83.6k). 
 Simulation réalisée en EURL ou SASU à la place."

=> Redirection vers calcul SASU/EURL
```

### 1B. FRANCE — Micro-entreprise BNC, CA 80 000 € (sous plafond)

```
INPUT:
- CA annuel brut: 80 000 €
- Structure: Micro-entreprise BNC non-CIPAV
- Statut: célibataire
- ACRE: NON (entrepreneur établi)

CALCULS:
- Cotisations sociales: 80 000 × 25.6% = 20 480 €
- CFP: 80 000 × 0.2% = 160 €
- Abattement forfaitaire IR: 80 000 × 34% = 27 200 € de frais réputés
- Revenu imposable IR: 80 000 − 27 200 = 52 800 €
- IR (barème 2026, célibataire):
  - 0 à 11 497 = 0
  - 11 497 à 29 315 = 17 818 × 11% = 1 959.98
  - 29 315 à 52 800 = 23 485 × 30% = 7 045.50
  - Total IR ≈ 9 005 €

TOTAL PRÉLÈVEMENTS: 20 480 + 160 + 9 005 = 29 645 €
NET ANNUEL: 80 000 - 29 645 = 50 355 €
NET MENSUEL: 4 196 €
TAUX EFFECTIF: 37.1%

Décomposition objective:
- Santé "effectivelyValuable": ~7.5% × 80k = 6 000 €
- Retraite "nominallyValuable": ~9.8% × 80k = 7 840 €
- CSG/CRDS + autres "pureCost": ~8.3% × 80k = 6 640 €
```

### 1C. USA — New York City, LLC single-member

```
INPUT:
- Revenue: $109 000 (= 100k€ × 1.09)
- Structure: LLC sole prop (default tax treatment)
- Filing: Single
- Age: 35
- Standard deduction: $16 100 (2026)

CALCULS:
1. Self-Employment Tax:
   - Net SE earnings = 109 000 × 0.9235 = 100 661.50
   - SS portion = 100 661.50 × 12.4% = 12 482 (sous le cap $184,500)
   - Medicare portion = 100 661.50 × 2.9% = 2 919
   - SE Tax total = 15 401

2. Federal Income Tax:
   - Half SE tax deduction = 7 700
   - QBI deduction (20% of ~101k qualified) ≈ 20 200
   - Standard deduction = 16 100
   - AGI = 109 000 − 7 700 = 101 300
   - Taxable income ≈ 101 300 − 16 100 − 20 200 = 65 000
   - IR fédéral (barème single 2026):
     - 0-11 925 = 1 192.50
     - 11 925-48 475 = 36 550 × 12% = 4 386
     - 48 475-65 000 = 16 525 × 22% = 3 635.50
     - Total = 9 214

3. NY State Tax (taxable NY ~78 000):
   - Barème single, approx 6.3% effective ≈ 4 900

4. NYC Tax (taxable ~78 000):
   - Approx 3.8% effective = 2 964

5. MCTMT: SE earnings > $50k → 0.47% × 100 661 = 473
   (note: if over $150k threshold increases but not here)

TOTAL TAXES: 15 401 + 9 214 + 4 900 + 2 964 + 473 = 32 952 USD ≈ 30 230 €
NET ANNUEL: 109 000 - 32 952 = 76 048 USD ≈ 69 770 €
NET MENSUEL: ~5 814 €
TAUX EFFECTIF: 30.2%

⚠️ MAIS À AJOUTER: Assurance santé privée ~ $7 500/an = 6 880 €
NET RÉEL APRÈS SANTÉ: 62 890 €
TAUX EFFECTIF RÉEL: 37.1% (similaire à France)

Décomposition objective:
- Social Security "nominallyValuable" (< 35 ans): 12 482
- Medicare "pureCost before 65": 2 919
- All income taxes: "government services"
```

### 1D. USA — Miami (Floride), LLC single-member

```
INPUT:
- Revenue: $109 000
- Structure: LLC sole prop
- Filing: Single

CALCULS:
1. SE Tax: identique à NYC = 15 401
2. Federal Income Tax: identique à NYC = 9 214
3. FL State Tax: 0
4. Miami City Tax: 0

TOTAL TAXES: 15 401 + 9 214 = 24 615 USD ≈ 22 583 €
NET ANNUEL: 109 000 - 24 615 = 84 385 USD ≈ 77 417 €
NET MENSUEL: ~6 450 €
TAUX EFFECTIF: 22.6%

À AJOUTER:
- Assurance santé: ~$7 500/an = 6 880 €
- Assurance habitation ouragans: ~$5 500/an = 5 046 €
NET RÉEL: 65 490 €
TAUX EFFECTIF RÉEL: 39.9%

⚠️ IMPORTANT: À faible CA, Miami perd son avantage à cause du healthcare + home insurance.
Break-even point estimé: CA > 150-180k USD
```

### 1E. MALTE — Résident non-dom, tout revenu offshore (ex. holding UAE)

```
INPUT:
- CA annuel brut: 100 000 € (via holding UAE, encaissé sur compte offshore)
- Résidence fiscale: Malte non-dom
- Remittance to Malta: 35 000 € seulement (consommation courante)

CALCULS:
Scénario A — Revenu entièrement étranger non remitté:
- Remittance: 35 000 € ramenés à Malte (pour vivre)
- Imposable en Malta: 35 000 €
- Barème single 2026:
  - 0-12 000 = 0
  - 12 000-16 000 = 4 000 × 15% = 600
  - 16 000-35 000 = 19 000 × 25% = 4 750
  - Total IR = 5 350 €
- Mais: minimum tax non-dom > 35k foreign income → 5 000 € minimum ⚠️ ALREADY MET

TOTAL TAXES: 5 350 €
NET ANNUEL: 100 000 - 5 350 = 94 650 €
NET MENSUEL: ~7 888 €
TAUX EFFECTIF: 5.35%

⚠️ REQUIREMENTS:
- Besoin d'une structure offshore pour la source (UAE, Jersey, etc.)
- Vraiment vivre hors France (CFC rules art. 209B du CGI)
- Aucun revenu maltais
```

### 1F. MALTE — Scheme classique Malta Ltd avec 6/7 refund

```
INPUT:
- CA annuel: 100 000 €
- Charges opérationnelles: 20 000 € (dont salaire admin)
- Bénéfice imposable: 80 000 €

CALCULS:
1. Malta Corp Tax: 80 000 × 35% = 28 000 €
2. Distribution dividende: 80 000 - 28 000 = 52 000 €
3. Refund 6/7 à l'actionnaire: 28 000 × 6/7 = 24 000 €

Net effectif taxes MT Corp: 28 000 - 24 000 = 4 000 € (soit 5% du bénéfice)

4. Actionnaire personne physique non-dom:
   - Reçoit: 52 000 € (dividende) + 24 000 € (refund) = 76 000 €
   - Si le refund va sur compte maltais PERSO → imposable en Malta comme income
   - ⚠️ SOLUTION: faire passer par Holding Malta → refund exempté en Holding via participation exemption
   - Distribution finale au personne physique: selon remittance
   
Si remittance limitée à 35k€/an:
   - Tax Malta perso: ~4 750 € + minimum non-dom 5 000 € = 5 000 €
   - Actif accumulé en Holding MT sans tax

EFFECTIVE TAX RATE EFFECTIVE: ~9% (corp 5% + perso 4%)
```

---

## EXEMPLE 2 — STARTUP fondateur, CA 250k€, se paye 60k salaire + 80k dividendes

### 2A. FRANCE — SASU à l'IS

```
INPUT:
- Profile: STARTUP
- CA annuel: 250 000 €
- Charges pro (loyer bureau, outils, freelances): 50 000 €
- Bénéfice avant IS: 200 000 €
- Salaire président brut: 60 000 € (salaire net ~40 000 €)
- Dividendes distribués: 80 000 €

CALCULS:
1. Charges sociales président (SASU = assimilé-salarié):
   - Charges patronales ≈ 45% × 60 000 = 27 000 €
   - Charges salariales ≈ 22% × 60 000 = 13 200 €
   - Total charges SECU président: ~40 200 €
   - Coût entreprise: 60 000 + 27 000 = 87 000 €
   - Salaire net président: 60 000 - 13 200 = 46 800 €

2. IS société:
   - Bénéfice imposable: 200 000 - 87 000 = 113 000 €
   - IS réduit 15% jusqu'à 42 500: 6 375 €
   - IS 25% de 42 500 à 113 000: 17 625 €
   - Total IS: 24 000 €

3. Trésorerie après IS: 113 000 - 24 000 = 89 000 €
   - Distribuable en dividende: 80 000 €
   - Reste en réserve: 9 000 €

4. PFU sur dividendes (2026 flat tax 31.4%):
   - 80 000 × 31.4% = 25 120 €
   - Net dividende reçu: 80 000 - 25 120 = 54 880 €

5. IR sur salaire (1 part, 46 800 net + abattement 10%):
   - Revenu imposable: 46 800 × 0.9 = 42 120 €
   - IR:
     - 0-11 497 = 0
     - 11 497-29 315 = 17 818 × 11% = 1 960
     - 29 315-42 120 = 12 805 × 30% = 3 842
     - Total IR: 5 802 €

TOTAL PRÉLÈVEMENTS:
- Charges sociales: 40 200
- IS: 24 000
- PFU dividendes: 25 120
- IR salaire: 5 802
- TOTAL: 95 122 €

NET DISPONIBLE ANNUEL: 40 998 (salaire net après IR) + 54 880 (dividende net) = 95 878 €
Wait, let me recalculate:
- Salaire net in hand: 46 800 - 5 802 (IR) = 40 998 €
- Dividende net: 54 880 €
- Total net disponible: 95 878 €

De 250 000 € de CA à 95 878 € en poche = 38.4%

TAUX EFFECTIF TOTAL: 61.6%
(si on compte charges + IS + divid tax + IR, sans compter CSG sur salaire)
```

### 2B. USA — NY, S-Corp election

```
INPUT:
- Revenue: $272 500 (= 250k€)
- Business expenses: $54 500
- Net profit before compensation: $218 000
- Reasonable salary W-2: $85 000
- Distribution: $95 000

CALCULS:
1. Payroll taxes sur W-2 salary $85k:
   - Employer FICA (7.65%) = 6 502
   - Employee FICA (7.65%) = 6 502
   - Total payroll: 13 004 (50/50 split)

2. Federal income tax sur W-2 + distribution (flow-through):
   - Salary: 85 000
   - Distribution (K-1): 95 000 (pas de SE tax ici — c'est l'avantage S-Corp)
   - Half SE tax deduction: 0 (S-corp n'a pas de SE tax sur distribution)
   - QBI deduction: 20% × 95 000 = 19 000 (sur distribution, phases out at higher income)
   - Standard deduction: 16 100
   - Taxable income: 85 000 + 95 000 - 19 000 - 16 100 = 144 900
   - Federal IR:
     - 0-11 925 = 1 192.50
     - 11 925-48 475 = 4 386
     - 48 475-103 350 = 12 073
     - 103 350-144 900 = 9 972
     - Total: 27 623

3. NY State:
   - Taxable NY ~145 000 × ~6.5% = 9 425

4. NYC:
   - ~145 000 × 3.88% = 5 626

5. Additional Medicare 0.9% on salary > $200k: N/A here

TOTAL USD: 13 004 + 27 623 + 9 425 + 5 626 = 55 678 USD ≈ 51 080 €
NET: 272 500 − 54 500 (expenses) − 55 678 = 162 322 USD ≈ 148 920 €

TAUX EFFECTIF TAX / PROFIT: 55 678 / 218 000 = 25.5%
```

### 2C. MALTE — OpCo + Holdco structure

```
INPUT:
- CA facturé par OpCo Malta: 250 000 €
- Charges opérationnelles (dont salaire admin local): 50 000 €
- Bénéfice OpCo: 200 000 €
- Salaire fondateur résident MT: 0 € (vit de dividendes)

CALCULS:
1. OpCo Malta Corp Tax: 200 000 × 35% = 70 000 €
2. OpCo distribue 130 000 € en dividende à Holdco
3. Refund 6/7 à Holdco: 70 000 × 6/7 = 60 000 €
4. Holdco reçoit 130 000 + 60 000 = 190 000 € (exempté via participation exemption)
5. Net effectif Corp Tax: 70 000 - 60 000 = 10 000 € (5%)

6. Fondateur personne physique non-dom, remittance 50 000 €/an:
   - Imposable Malta: 50 000 €
   - Barème: 0-12k = 0, 12-16k = 600, 16-50k = 8 500 → IR = 9 100 €
   - Minimum non-dom check: 50k foreign > 35k → min 5k... déjà dépassé
   
TOTAL PRÉLÈVEMENTS:
- Corp MT: 10 000 €
- IR personne physique: 9 100 €
- TOTAL: 19 100 €

CASH FLOW ACCUMULÉ EN HOLDCO: 190 000 - 50 000 = 140 000 € disponibles pour réinvestissement

TAUX EFFECTIF (TAX / PROFIT 200k): 9.55%

COMPARAISON:
- France SASU : 61.6% → 76 700 € en poche sur 200k profit
- USA NY S-Corp: 25.5% → 149 000 € en poche
- Malta: 9.55% → 181 000 € + accumulable en Holdco
```

---

## EXEMPLE 3 — ECOM, CA 500k€, marges 25%

### 3A. FRANCE — EURL à l'IS

```
INPUT:
- CA brut: 500 000 €
- Coût achats: 350 000 € (70%)
- Charges pro (pub, shipping, tools): 50 000 €
- Bénéfice avant IS: 100 000 €
- Gérant TNS (régime travailleurs non-salariés) rémunération: 60 000 €

CALCULS:
1. Cotisations TNS (SSI) sur rémunération 60k:
   - Taux global approximatif: 40% (plus bas que SASU — avantage EURL)
   - Cotisations: ~24 000 €

2. IS société:
   - Bénéfice après rému: 100 000 - 60 000 - 24 000 (cotisations pros) = 16 000 €
   - IS 15%: 2 400 €

3. Pas de dividendes (tout pris en rému)

4. IR sur rému TNS 60 000:
   - Revenu imposable: 60 000 - abattement 10% = 54 000
   - IR barème: 8 770 €

TOTAL PRÉLÈVEMENTS: 24 000 + 2 400 + 8 770 = 35 170 €
NET ANNUEL: 60 000 (rému) - 24 000 - 8 770 + 13 600 (résultat net société) = 40 830 €
TAUX EFFECTIF: 35%

⚠️ NOTE POUR ECOM: À 500k CA avec marge 25% c'est serré. La structure doit minimiser les cotisations.
```

### 3B. UK — Ltd Company (stratégie salaire £12,570 + dividendes)

```
INPUT:
- Revenue GBP: 413 000 (= 500k€)
- COGS: 289 000 (70%)
- OpEx: 41 300
- Profit before salary: 82 700 £
- Director salary: 12 570 £ (personal allowance)
- Retained for dividends: 70 130 £

CALCULS:
1. Employer NI on salary above £5k secondary threshold:
   - (12 570 - 5 000) × 15% = 1 135 £

2. Employee NI: 0 (below primary threshold £12,570)

3. Income tax on salary: 0 (entirely within personal allowance)

4. Corporation Tax sur profit £82,700 - £1,135 (employer NI) = 81 565:
   - Small profits rate 19% (< £50k)... but here 81.5k so marginal relief
   - Marginal rate entre £50k et £250k ≈ 26.5% effective
   - Approximation: (50 000 × 19%) + (31 565 × 26.5%) = 9 500 + 8 365 = 17 865 £

5. Distribuable dividend: 81 565 - 17 865 = 63 700 £
   (après corp tax, avant withdrawal)

6. Dividend tax (2026/27, barèmes majorés):
   - Personal allowance déjà utilisée par salaire £12,570
   - Dividend allowance: £500 tax-free
   - Basic rate slice (jusqu'à £50,270 total income): 50,270 - 12,570 - 500 = 37,200 × 10.75% = 3 999
   - Higher rate slice (50,270 to 63,700 total) = 13 430 × 35.75% = 4 801
   - Total dividend tax: 8 800 £

TOTAL PRÉLÈVEMENTS GBP: 1 135 + 17 865 + 8 800 = 27 800 £ ≈ 33 500 €
NET DIRECTEUR:
  - Salary: 12 570 £
  - Dividend net: 63 700 - 8 800 = 54 900 £
  - Total: 67 470 £ ≈ 81 290 €

TAUX EFFECTIF sur profit 82.7k: 33.6% (avant hausse dividend 2026 c'était 28%)

⚠️ Hausse dividende 2026 = perte nette de ~£1500 vs 2025.
```

---

## EXEMPLE 4 — Solo freelance dev, CA 150k€, célibataire, comparaison des 6 juridictions

Résultats attendus du moteur (NET disponible après impôts et cotisations, sans coût de vie):

| Juridiction | Structure | Net annuel | % effectif | Rang |
|---|---|---|---|---|
| Malte non-dom | Holding + OpCo | ~135 000 € | 10% | 1 |
| Miami (FL) | LLC/S-corp | ~108 000 € | 28% | 2 |
| Londres UK | Ltd Co optimized | ~95 000 € | 37% | 3 |
| Tokyo JP | Sole prop Blue | ~92 000 € | 39% | 4 |
| New York NY | LLC + S-Corp | ~85 000 € | 43% | 5 |
| Californie | LLC | ~78 000 € | 48% | 6 |
| Paris FR | SASU | ~67 000 € | 55% | 7 |

**MAIS** après intégration du coût de la vie (loyer 1BR centre, bouffe, transport, santé):

| Juridiction | Cashflow réel/mois | Rang "vie réelle" |
|---|---|---|
| Malte non-dom | 8 700 € | 1 |
| Miami | 4 900 € | 2 |
| Tokyo | 4 900 € | 3 (ex aequo, malgré impôts élevés — coût de vie bas relatif) |
| Londres | 4 200 € | 4 |
| New York | 3 200 € | 5 |
| Paris | 3 100 € | 6 |
| San Francisco | 2 800 € | 7 |

**Insight clé**: La Californie chute tout en bas du classement "vie réelle" à cause du loyer SF. Tokyo remonte malgré une fiscalité élevée. Malte domine quand le setup fiscal est légitime.

---

## Conditions d'invalidation du scheme Malta depuis la France

**WARNING à afficher dans l'UI quand simulation Malta :**

- Si l'utilisateur déclare habiter encore en France > 183 jours → simulation invalidée
- Si famille principale reste en France → CFC 209B risk
- Si >50% des clients sont français → risque de caractérisation établissement stable en France
- Si pas de locaux/substance en Malta → scheme invalidé (ATAD)

Le simulateur doit forcer l'utilisateur à cocher :
- [ ] Je déménagerai physiquement à Malte >183j/an
- [ ] Je n'aurai plus de résidence principale en France
- [ ] Ma société aura un directeur résident maltais + bureau physique
- [ ] Je comprends qu'un fiscaliste international est indispensable

Sinon, afficher : "Scheme invalide dans votre situation. Voir avec un fiscaliste."
