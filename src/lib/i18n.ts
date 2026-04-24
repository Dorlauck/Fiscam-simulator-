/**
 * i18n minimaliste FR/EN. Pas de lib externe (pas besoin de next-intl pour 2 langues).
 * Usage : const { t } = useI18n(); t("landing.hero.title")
 */

export type Locale = "fr" | "en";

export const LOCALES: Locale[] = ["fr", "en"];

/** Dictionnaire typé. Garantie que toutes les clés existent dans les 2 langues. */
const STRINGS = {
  "nav.brand": {
    fr: "Fiscam",
    en: "Fiscam",
  },
  "nav.dataDate": {
    fr: "données 2026 · avril",
    en: "2026 data · April",
  },
  "lang.switcher.aria": {
    fr: "Changer la langue",
    en: "Change language",
  },

  // --- Landing
  "landing.kicker": {
    fr: "Avril 2026 · Données officielles",
    en: "April 2026 · Official data",
  },
  "landing.hero.title": {
    fr: "L'impôt réel, pas celui qu'on t'a promis.",
    en: "Real taxes, not the ones you were promised.",
  },
  "landing.hero.lede": {
    fr: "Compare ce qu'il te reste vraiment, dans 7 pays, pour ton profil d'entrepreneur — après impôts, cotisations, loyer et bouffe.",
    en: "Compare what you actually keep, across 7 countries, for your entrepreneur profile — after taxes, social contributions, rent and groceries.",
  },
  "landing.cta.start": {
    fr: "Commencer la simulation →",
    en: "Start the simulation →",
  },
  "landing.promise.noTracking": {
    fr: "On ne te vend rien. Pas d'email. Pas de tracking. Open source.",
    en: "We don't sell you anything. No email. No tracking. Open source.",
  },
  "landing.principles.title": {
    fr: "Ce qu'on fait différemment",
    en: "What we do differently",
  },
  "landing.principle1.title": {
    fr: "✓ Distingue les cotisations réellement utiles des cotisations nominales.",
    en: "✓ Separates actually-valuable contributions from nominal ones.",
  },
  "landing.principle1.body": {
    fr: "Une cotisation retraite qui n'a pas de chance d'être perçue en 2055 pour la génération 30-40 ans n'est pas un avantage, c'est un prélèvement sec. On classe chaque cotisation en **effectivement perçue**, **nominalement valable**, ou **pure charge**.",
    en: "A pension contribution that's unlikely to ever pay out for today's 30-40 year olds isn't a benefit, it's a dead loss. Each contribution is classified as **effectively received**, **nominally valuable**, or **pure cost**.",
  },
  "landing.principle2.title": {
    fr: "✓ Intègre le coût réel de vivre dans chaque ville.",
    en: "✓ Integrates the real cost of living in each city.",
  },
  "landing.principle2.body": {
    fr: "5000 €/mois à Paris ≠ 5000 €/mois à Miami. Le bon indicateur c'est *cashflow disponible après coût de vie standardisé*.",
    en: "€5,000/mo in Paris ≠ €5,000/mo in Miami. The right metric is *cashflow after a standardized cost-of-living basket*.",
  },
  "landing.principle3.title": {
    fr: "✓ Affiche l'exit tax et les pièges de sortie.",
    en: "✓ Shows exit tax and departure traps.",
  },
  "landing.principle3.body": {
    fr: "« Low tax now » peut coûter cher plus tard — exit tax France, IRC 877A US, Temporary Non-Residence Rule UK.",
    en: "\"Low tax now\" may cost you later — France's exit tax, US IRC 877A, UK's Temporary Non-Residence Rule.",
  },

  // --- Form
  "form.step.of": {
    fr: "Étape {n}/3",
    en: "Step {n}/3",
  },
  "form.step1.title": {
    fr: "Étape 1/3 — Ton profil",
    en: "Step 1/3 — Your profile",
  },
  "form.step1.subtitle": {
    fr: "On ajuste les règles fiscales à ton activité.",
    en: "We adapt the tax rules to your activity.",
  },
  "form.profile.label": {
    fr: "Profil d'entrepreneur",
    en: "Entrepreneur profile",
  },
  "form.profile.solo": {
    fr: "freelance / consultant",
    en: "freelance / consultant",
  },
  "form.profile.startup": {
    fr: "fondateur SaaS / produit",
    en: "SaaS / product founder",
  },
  "form.profile.ecom": {
    fr: "e-commerce / DTC",
    en: "e-commerce / DTC",
  },
  "form.revenue.label": {
    fr: "CA annuel brut (€)",
    en: "Annual gross revenue (€)",
  },
  "form.expenses.label": {
    fr: "Charges pro annuelles (€)",
    en: "Annual business expenses (€)",
  },
  "form.family.label": {
    fr: "Situation familiale",
    en: "Family status",
  },
  "form.family.single": {
    fr: "Seul(e)",
    en: "Single",
  },
  "form.family.couple": {
    fr: "Couple",
    en: "Couple",
  },
  "form.family.couple_children": {
    fr: "Couple + enfants",
    en: "Couple + children",
  },
  "form.children.label": {
    fr: "Enfants",
    en: "Children",
  },
  "form.age.label": {
    fr: "Âge",
    en: "Age",
  },
  "form.comp.title": {
    fr: "Rémunération France SASU (optionnel)",
    en: "France SASU compensation (optional)",
  },
  "form.comp.hint": {
    fr: "Tu peux piloter la répartition salaire / dividende pour la simulation France SASU. Les autres juridictions utilisent leurs propres règles.",
    en: "You can pilot the salary vs dividend split for the France SASU simulation. Other jurisdictions use their own rules.",
  },
  "form.comp.salary.label": {
    fr: "Salaire brut annuel",
    en: "Gross annual salary",
  },
  "form.comp.salary.hint": {
    fr: "Montant versé au président. 0 = pas de salaire (tout en dividende).",
    en: "Amount paid to the president. 0 = no salary (everything via dividend).",
  },
  "form.comp.divNet.label": {
    fr: "Dividende NET souhaité",
    en: "Target NET dividend",
  },
  "form.comp.divNet.hint": {
    fr: "Net après PFU 31.4%. Le simulateur calcule le brut et vérifie la faisabilité.",
    en: "Net after 31.4% PFU flat tax. The simulator computes the gross and checks feasibility.",
  },
  "form.next": {
    fr: "Suivant →",
    en: "Next →",
  },
  "form.back": {
    fr: "← Retour",
    en: "← Back",
  },

  "form.step2.title": {
    fr: "Étape 2/3 — Ton mode de vie",
    en: "Step 2/3 — Your lifestyle",
  },
  "form.step2.subtitle": {
    fr: "Sert à calculer le coût de la vie réel dans chaque ville (panier standardisé).",
    en: "Used to compute the real cost of living in each city (standardized basket).",
  },
  "form.housing.label": {
    fr: "Logement cible",
    en: "Target housing",
  },
  "form.location.label": {
    fr: "Quartier",
    en: "Neighbourhood",
  },
  "form.location.center": {
    fr: "Centre",
    en: "Center",
  },
  "form.location.periphery": {
    fr: "Périphérie",
    en: "Periphery",
  },
  "form.car.label": {
    fr: "Voiture",
    en: "Car",
  },
  "form.yes": { fr: "Oui", en: "Yes" },
  "form.no": { fr: "Non", en: "No" },
  "form.health.label": {
    fr: "Assurance santé privée",
    en: "Private health insurance",
  },
  "form.health.hint": {
    fr: "Forcée pour les juridictions US < 65 ans.",
    en: "Forced for US jurisdictions under 65.",
  },
  "form.dining.label": {
    fr: "Restos / sorties",
    en: "Dining out",
  },
  "form.dining.low": { fr: "Rare", en: "Rare" },
  "form.dining.medium": { fr: "Moyen", en: "Medium" },
  "form.dining.high": { fr: "Fréquent", en: "Frequent" },

  "form.step3.title": {
    fr: "Étape 3/3 — Juridictions à comparer",
    en: "Step 3/3 — Jurisdictions to compare",
  },
  "form.step3.subtitle": {
    fr: "Coche au moins 2 juridictions pour lancer la comparaison.",
    en: "Check at least 2 jurisdictions to run the comparison.",
  },
  "form.malta.warning.title": {
    fr: "⚠️ Avertissement Malte / CFC",
    en: "⚠️ Malta / CFC warning",
  },
  "form.malta.warning.body": {
    fr: "Le régime non-dom n'est valide que si tu es réellement résident fiscal maltais (>183 j/an, substance économique, directeur local). Depuis la France, les règles CFC (art. 209B CGI) s'appliquent.",
    en: "The non-dom scheme is only valid if you are a genuine Malta tax resident (>183 d/yr, real economic substance, local director). From France, CFC rules (art. 209B CGI) apply.",
  },
  "form.malta.ack": {
    fr: "Je comprends et je déménagerai physiquement à Malte avec substance réelle",
    en: "I understand and will physically move to Malta with real substance",
  },
  "form.submit": {
    fr: "Lancer la simulation →",
    en: "Run the simulation →",
  },

  // --- Results
  "results.header.prefix": {
    fr: "Profil · CA ·",
    en: "Profile · Revenue ·",
  },
  "results.title": {
    fr: "Comparaison des {n} juridictions",
    en: "Comparing {n} jurisdictions",
  },
  "results.edit": {
    fr: "← Modifier",
    en: "← Edit",
  },
  "results.empty": {
    fr: "Aucune juridiction active. Retourne à l'étape 3 et coche au moins une juridiction. Rappel : Malte nécessite une confirmation explicite.",
    en: "No active jurisdiction. Go back to step 3 and pick at least one. Reminder: Malta requires explicit confirmation.",
  },
  "results.chart.title": {
    fr: "Cashflow réel mensuel — après impôts, cotisations, et coût de la vie",
    en: "Real monthly cashflow — after taxes, contributions, and cost of living",
  },
  "results.chart.subtitle": {
    fr: "Panier standardisé : logement + alimentation + transport + santé + utilities. Triés par cashflow disponible.",
    en: "Standardized basket: housing + food + transport + health + utilities. Sorted by available cashflow.",
  },
  "results.cards.title": {
    fr: "Fiches juridictions",
    en: "Jurisdiction cards",
  },
  "results.cards.hint": {
    fr: "Clique sur une fiche pour voir la décomposition complète.",
    en: "Click a card to see the full breakdown.",
  },
  "results.export.pdf": {
    fr: "Exporter en PDF",
    en: "Export as PDF",
  },
  "results.export.generating": {
    fr: "Génération…",
    en: "Generating…",
  },

  // --- Jurisdiction card
  "card.structure": { fr: "Structure", en: "Structure" },
  "card.taxesAndContrib": { fr: "Impôts & cotis.", en: "Taxes & contributions" },
  "card.colAnnual": { fr: "Coût de vie / an", en: "Cost of living / yr" },
  "card.netAfterTax": { fr: "Net après impôts", en: "Net after tax" },
  "card.cashflowAnnual": { fr: "Cashflow dispo / an", en: "Available cashflow / yr" },
  "card.effectiveRate": { fr: "Taux effectif", en: "Effective rate" },
  "card.score": { fr: "Score", en: "Score" },
  "card.exitTax.none": { fr: "Exit tax : aucune", en: "Exit tax: none" },
  "card.exitTax.low": { fr: "Exit tax : faible", en: "Exit tax: low" },
  "card.exitTax.moderate": { fr: "Exit tax : modérée", en: "Exit tax: moderate" },
  "card.exitTax.high": { fr: "Exit tax : élevée", en: "Exit tax: high" },

  // --- Detail panel
  "detail.title": {
    fr: "Détail fiscal",
    en: "Tax detail",
  },
  "detail.close": { fr: "✕ Fermer", en: "✕ Close" },
  "detail.breakdown.title": { fr: "Décomposition du revenu brut", en: "Gross revenue breakdown" },
  "detail.taxes.title": {
    fr: "Impôts & cotisations",
    en: "Taxes & contributions",
  },
  "detail.col.title": { fr: "Coût de vie détaillé (mensuel EUR)", en: "Cost of living (monthly EUR)" },
  "detail.prosCons.title": { fr: "Points positifs & négatifs (objectifs)", en: "Pros & cons (objective)" },
  "detail.row.corpTax": { fr: "Impôt société (IS)", en: "Corporate income tax" },
  "detail.row.socialContrib": { fr: "Cotisations sociales", en: "Social contributions" },
  "detail.row.effectivelyValuable": { fr: "✓ Effectivement perçues", en: "✓ Effectively received" },
  "detail.row.nominallyValuable": { fr: "⚠ Nominalement valables", en: "⚠ Nominally valuable" },
  "detail.row.pureCost": { fr: "✗ Pure cost / dead weight", en: "✗ Pure cost / dead weight" },
  "detail.row.divTax": { fr: "Flat tax dividendes", en: "Dividend flat tax" },
  "detail.row.incomeTax": { fr: "Impôt sur le revenu", en: "Income tax" },
  "detail.row.other": { fr: "Autres (franchise, MCTMT, etc.)", en: "Other (franchise, MCTMT, etc.)" },
  "detail.row.totalLevied": { fr: "TOTAL PRÉLEVÉ", en: "TOTAL LEVIED" },
  "detail.row.netAfterTax": { fr: "Net en poche (après impôts)", en: "Net in pocket (after tax)" },
  "detail.row.colAnnual": { fr: "Coût de vie standardisé / an", en: "Standardized cost of living / yr" },
  "detail.row.cashflowAnnual": { fr: "CASHFLOW DISPONIBLE / AN", en: "AVAILABLE CASHFLOW / YR" },
  "detail.row.cashflowMonthly": { fr: "Cashflow disponible / mois", en: "Available cashflow / mo" },
  "detail.col.rent": { fr: "Loyer", en: "Rent" },
  "detail.col.food": { fr: "Alimentation (courses)", en: "Groceries" },
  "detail.col.dining": { fr: "Restaurant (dining out)", en: "Dining out" },
  "detail.col.transport": { fr: "Transport", en: "Transport" },
  "detail.col.healthcare": { fr: "Santé (privée)", en: "Healthcare (private)" },
  "detail.col.utilities": { fr: "Utilities + internet", en: "Utilities + internet" },
  "detail.col.gym": { fr: "Gym", en: "Gym" },
  "detail.col.totalMonth": { fr: "TOTAL / MOIS", en: "TOTAL / MO" },
  "detail.pros.empty": { fr: "Rien de particulier à signaler.", en: "Nothing notable to mention." },
  "detail.cons.empty": { fr: "Rien à signaler côté négatif.", en: "Nothing negative to flag." },
  "breakdown.legend.net": { fr: "Net en poche", en: "Net in pocket" },
  "breakdown.legend.effectivelyValuable": { fr: "Effectivement perçu", en: "Effectively received" },
  "breakdown.legend.nominallyValuable": { fr: "Nominal", en: "Nominal" },
  "breakdown.legend.pureCost": { fr: "Pure cost", en: "Pure cost" },

  // --- Staleness banner
  "staleness.banner": {
    fr: "⚠️ Les données fiscales datent de {date}. Les taux de l'année suivante ne sont peut-être pas encore intégrés. Vérifie les sources officielles avant toute décision.",
    en: "⚠️ Tax data dates from {date}. Next year's rates may not be integrated yet. Check official sources before any decision.",
  },

  // --- Salary vs Dividend comparison
  "svd.title": {
    fr: "Salaire vs Dividende — France SASU",
    en: "Salary vs Dividend — France SASU",
  },
  "svd.subtitle": {
    fr: "Pour chaque euro additionnel, quelle route coûte le moins à la société et laisse le plus au dirigeant ?",
    en: "For each additional euro, which route costs the company less and leaves more for the director?",
  },
  "svd.salary.title": {
    fr: "👔 Via Salaire",
    en: "👔 Via Salary",
  },
  "svd.dividend.title": {
    fr: "💰 Via Dividende",
    en: "💰 Via Dividend",
  },
  "svd.costToCompany": {
    fr: "Coût pour la société",
    en: "Cost to the company",
  },
  "svd.netToDirector": {
    fr: "Net en poche du dirigeant",
    en: "Net in director's pocket",
  },
  "svd.efficiency": {
    fr: "Efficacité (net / coût société)",
    en: "Efficiency (net / company cost)",
  },
  "svd.breakdown.title": {
    fr: "Pour 1 000 € additionnels de coût société",
    en: "For €1,000 additional company cost",
  },
  "svd.salary.row.cost": {
    fr: "Coût total société (salaire + cotisations patronales)",
    en: "Total company cost (salary + employer contributions)",
  },
  "svd.salary.row.salaryGross": {
    fr: "Dont salaire brut",
    en: "Of which gross salary",
  },
  "svd.salary.row.employerContrib": {
    fr: "Dont cotisations patronales (~45%)",
    en: "Of which employer contributions (~45%)",
  },
  "svd.salary.row.employeeContrib": {
    fr: "– Cotisations salariales (~22% du brut)",
    en: "– Employee contributions (~22% of gross)",
  },
  "svd.salary.row.incomeTax": {
    fr: "– IR (après abattement 10%, taux marginal)",
    en: "– Income tax (after 10% abatement, marginal rate)",
  },
  "svd.salary.row.net": {
    fr: "= Net en poche",
    en: "= Net in pocket",
  },
  "svd.div.row.companyCost": {
    fr: "Coût total société (avant IS)",
    en: "Total company cost (before corp tax)",
  },
  "svd.div.row.is": {
    fr: "– Impôt société (IS 15% ou 25%)",
    en: "– Corporate income tax (15% or 25%)",
  },
  "svd.div.row.distributable": {
    fr: "= Dividende brut distribuable",
    en: "= Distributable gross dividend",
  },
  "svd.div.row.pfu": {
    fr: "– PFU flat tax 31.4%",
    en: "– 31.4% PFU flat tax",
  },
  "svd.div.row.net": {
    fr: "= Net en poche",
    en: "= Net in pocket",
  },
  "svd.advantages.salary.title": {
    fr: "✓ Avantages du SALAIRE",
    en: "✓ Salary advantages",
  },
  "svd.advantages.salary.list": {
    fr: "Couverture maladie / maternité effective · Cotisations retraite (qualité nominalement valable) · Déductible de l'IS · Abattement IR 10% · Alimente la retraite Agirc-Arrco",
    en: "Effective health/maternity coverage · Pension contributions (nominally valuable) · Deductible from corp tax · 10% income tax abatement · Feeds Agirc-Arrco retirement",
  },
  "svd.advantages.salary.warning": {
    fr: "⚠ PAS de chômage (président SASU exclu). CSG/CRDS sans contrepartie.",
    en: "⚠ NO unemployment (SASU president excluded). CSG/CRDS with no benefit.",
  },
  "svd.advantages.dividend.title": {
    fr: "✓ Avantages du DIVIDENDE",
    en: "✓ Dividend advantages",
  },
  "svd.advantages.dividend.list": {
    fr: "Flat tax 31.4% simple et prévisible · Pas de cotisations sociales · Peut être accumulé dans la société · Modulable (distribution à la demande)",
    en: "Simple, predictable 31.4% flat tax · No social contributions · Can be accumulated in the company · Flexible (distribute on demand)",
  },
  "svd.advantages.dividend.warning": {
    fr: "⚠ Aucune protection sociale (santé, retraite, chômage) · Double imposition IS + PFU ≈ 47.5% cumulé.",
    en: "⚠ No social safety net (health, pension, unemployment) · Double taxation corp + PFU ≈ 47.5% combined.",
  },
  "svd.verdict.salary": {
    fr: "Plus efficient pour alimenter la retraite et bénéficier de la santé — mais cotisations lourdes.",
    en: "More efficient for pension building and health coverage — but heavy contributions.",
  },
  "svd.verdict.dividend": {
    fr: "Plus efficient en cash pur si vous n'avez pas besoin de protection sociale (jeune, santé privée ailleurs).",
    en: "More efficient in raw cash if you don't need social coverage (young, private health elsewhere).",
  },

  // --- Footer / legal
  "footer.disclaimer": {
    fr: "Outil d'aide à la réflexion construit sur des données publiques à date d'avril 2026. Ce n'est ni un conseil fiscal, ni un conseil juridique. Consulte un expert-comptable ou un avocat fiscaliste avant toute décision d'expatriation.",
    en: "Discussion aid built on public data as of April 2026. This is not tax or legal advice. Consult a licensed accountant or tax attorney before any expatriation decision.",
  },
  "footer.noTracking": {
    fr: "Pas de tracking. Pas de backend. Tout tourne dans ton navigateur.",
    en: "No tracking. No backend. Everything runs in your browser.",
  },
} as const;

export type StringKey = keyof typeof STRINGS;

/** Remplace les placeholders {foo} par les valeurs correspondantes. */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    template
  );
}

export function translate(
  locale: Locale,
  key: StringKey,
  params?: Record<string, string | number>
): string {
  const entry = STRINGS[key];
  const str = entry[locale] ?? entry.fr;
  return interpolate(str, params);
}
