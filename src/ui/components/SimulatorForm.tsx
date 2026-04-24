"use client";

import type { FormState } from "@/ui/hooks/useSimulation";
import type { Jurisdiction, LifestyleInput } from "@/engine/types";
import { FLAG, LABEL } from "@/lib/formatters";

interface Props {
  step: 1 | 2 | 3;
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  updateLifestyle: <K extends keyof LifestyleInput>(key: K, value: LifestyleInput[K]) => void;
  toggleJurisdiction: (j: Jurisdiction) => void;
  onNext: () => void;
  onBack?: () => void;
  onSubmit: () => void;
}

const PROFILES: Array<{ id: FormState["profile"]; label: string; sub: string }> = [
  { id: "SOLO", label: "SOLO", sub: "freelance / consultant" },
  { id: "STARTUP", label: "STARTUP", sub: "fondateur SaaS / produit" },
  { id: "ECOM", label: "ECOM", sub: "e-commerce / DTC" },
];

const HOUSING: Array<{ id: LifestyleInput["housingType"]; label: string }> = [
  { id: "studio", label: "Studio" },
  { id: "t2", label: "T2 / 1BR" },
  { id: "t3", label: "T3 / 2BR" },
  { id: "t4", label: "T4 / 3BR+" },
];

const DINING: Array<{ id: LifestyleInput["diningOutFrequency"]; label: string }> = [
  { id: "low", label: "Rare" },
  { id: "medium", label: "Moyen" },
  { id: "high", label: "Fréquent" },
];

const ALL_JURISDICTIONS: Jurisdiction[] = [
  "FR",
  "US_NY",
  "US_CA",
  "US_FL_MIAMI",
  "MT",
  "JP",
  "UK",
];

export function SimulatorForm(props: Props) {
  const { step, form, update, updateLifestyle, toggleJurisdiction, onNext, onBack, onSubmit } =
    props;

  return (
    <div className="container container--narrow">
      <div className="stepper">
        {[1, 2, 3].map((s) => (
          <div key={s} className="dot" data-active={step === s}>
            {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <h2>Étape 1/3 — Ton profil</h2>
          <p className="text-muted">On ajuste les règles fiscales à ton activité.</p>

          <label className="mt-3">Profil d'entrepreneur</label>
          <div className="segmented">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                data-active={form.profile === p.id}
                onClick={() => update("profile", p.id)}
              >
                <div>{p.label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{p.sub}</div>
              </button>
            ))}
          </div>

          <div className="grid-2 mt-3">
            <div>
              <label>CA annuel brut (€)</label>
              <input
                type="number"
                value={form.grossAnnual}
                min={10_000}
                step={5_000}
                onChange={(e) => update("grossAnnual", Number(e.target.value))}
              />
            </div>
            <div>
              <label>Charges pro annuelles (€)</label>
              <input
                type="number"
                value={form.businessExpenses}
                min={0}
                step={1_000}
                onChange={(e) => update("businessExpenses", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-3">
            <label>Situation familiale</label>
            <div className="segmented">
              <button
                data-active={form.familyStatus === "single"}
                onClick={() => update("familyStatus", "single")}
              >
                Seul(e)
              </button>
              <button
                data-active={form.familyStatus === "couple"}
                onClick={() => update("familyStatus", "couple")}
              >
                Couple
              </button>
              <button
                data-active={form.familyStatus === "couple_children"}
                onClick={() => update("familyStatus", "couple_children")}
              >
                Couple + enfants
              </button>
            </div>
          </div>

          <div className="grid-2 mt-3">
            <div>
              <label>Enfants</label>
              <select
                value={form.children}
                onChange={(e) => update("children", Number(e.target.value))}
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Âge</label>
              <input
                type="number"
                value={form.age}
                min={18}
                max={80}
                onChange={(e) => update("age", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="row mt-4" style={{ justifyContent: "flex-end" }}>
            <button data-variant="primary" onClick={onNext}>
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2>Étape 2/3 — Ton mode de vie</h2>
          <p className="text-muted">
            Sert à calculer le coût de la vie réel dans chaque ville (panier standardisé).
          </p>

          <label className="mt-3">Logement cible</label>
          <div className="segmented">
            {HOUSING.map((h) => (
              <button
                key={h.id}
                data-active={form.lifestyle.housingType === h.id}
                onClick={() => updateLifestyle("housingType", h.id)}
              >
                {h.label}
              </button>
            ))}
          </div>

          <div className="grid-2 mt-3">
            <div>
              <label>Quartier</label>
              <div className="segmented">
                <button
                  data-active={form.lifestyle.location === "center"}
                  onClick={() => updateLifestyle("location", "center")}
                >
                  Centre
                </button>
                <button
                  data-active={form.lifestyle.location === "periphery"}
                  onClick={() => updateLifestyle("location", "periphery")}
                >
                  Périphérie
                </button>
              </div>
            </div>
            <div>
              <label>Voiture</label>
              <div className="segmented">
                <button
                  data-active={form.lifestyle.carOwnership === false}
                  onClick={() => updateLifestyle("carOwnership", false)}
                >
                  Non
                </button>
                <button
                  data-active={form.lifestyle.carOwnership === true}
                  onClick={() => updateLifestyle("carOwnership", true)}
                >
                  Oui
                </button>
              </div>
            </div>
          </div>

          <div className="grid-2 mt-3">
            <div>
              <label>Assurance santé privée</label>
              <div className="segmented">
                <button
                  data-active={form.lifestyle.privateHealthcare === true}
                  onClick={() => updateLifestyle("privateHealthcare", true)}
                >
                  Oui
                </button>
                <button
                  data-active={form.lifestyle.privateHealthcare === false}
                  onClick={() => updateLifestyle("privateHealthcare", false)}
                >
                  Non
                </button>
              </div>
              <p className="text-dim" style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                Forcée pour les juridictions US &lt; 65 ans.
              </p>
            </div>
            <div>
              <label>Restos / sorties</label>
              <div className="segmented">
                {DINING.map((d) => (
                  <button
                    key={d.id}
                    data-active={form.lifestyle.diningOutFrequency === d.id}
                    onClick={() => updateLifestyle("diningOutFrequency", d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="row mt-4" style={{ justifyContent: "space-between" }}>
            <button data-variant="ghost" onClick={onBack}>
              ← Retour
            </button>
            <button data-variant="primary" onClick={onNext}>
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2>Étape 3/3 — Juridictions à comparer</h2>
          <p className="text-muted">Coche au moins 2 juridictions pour lancer la comparaison.</p>

          <div className="stack mt-3">
            {ALL_JURISDICTIONS.map((j) => {
              const selected = form.jurisdictions.includes(j);
              return (
                <label key={j} className="checkbox">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleJurisdiction(j)}
                  />
                  <span>
                    {FLAG[j]} {LABEL[j]}
                  </span>
                </label>
              );
            })}
          </div>

          {form.jurisdictions.includes("MT") && (
            <div className="banner mt-3">
              <strong>⚠️ Avertissement Malte / CFC</strong>
              <p style={{ margin: "0.5rem 0 0" }}>
                Le régime non-dom n'est valide que si tu es réellement résident fiscal maltais
                (&gt;183 j/an, substance économique, directeur local). Depuis la France, les
                règles CFC (art. 209B CGI) s'appliquent. Coche ci-dessous pour confirmer.
              </p>
              <label className="checkbox mt-2">
                <input
                  type="checkbox"
                  checked={form.maltaAcknowledged}
                  onChange={(e) => update("maltaAcknowledged", e.target.checked)}
                />
                <span>
                  Je comprends et je déménagerai physiquement à Malte avec substance réelle
                </span>
              </label>
            </div>
          )}

          <div className="row mt-4" style={{ justifyContent: "space-between" }}>
            <button data-variant="ghost" onClick={onBack}>
              ← Retour
            </button>
            <button
              data-variant="primary"
              onClick={onSubmit}
              disabled={form.jurisdictions.length < 2}
            >
              Lancer la simulation →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
