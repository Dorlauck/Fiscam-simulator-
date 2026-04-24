"use client";

import type { FormState } from "@/ui/hooks/useSimulation";
import type { Jurisdiction, LifestyleInput } from "@/engine/types";
import { FLAG, LABEL } from "@/lib/formatters";
import { useI18n } from "@/ui/hooks/useI18n";

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

const PROFILES: Array<FormState["profile"]> = ["SOLO", "STARTUP", "ECOM"];
const HOUSING: Array<LifestyleInput["housingType"]> = ["studio", "t2", "t3", "t4"];
const HOUSING_LABEL: Record<LifestyleInput["housingType"], string> = {
  studio: "Studio",
  t2: "T2 / 1BR",
  t3: "T3 / 2BR",
  t4: "T4 / 3BR+",
};
const DINING: Array<LifestyleInput["diningOutFrequency"]> = ["low", "medium", "high"];
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
  const { t } = useI18n();

  const profileSub: Record<FormState["profile"], string> = {
    SOLO: t("form.profile.solo"),
    STARTUP: t("form.profile.startup"),
    ECOM: t("form.profile.ecom"),
  };
  const diningLabel: Record<LifestyleInput["diningOutFrequency"], string> = {
    low: t("form.dining.low"),
    medium: t("form.dining.medium"),
    high: t("form.dining.high"),
  };

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
          <h2>{t("form.step1.title")}</h2>
          <p className="text-muted">{t("form.step1.subtitle")}</p>

          <label className="mt-3">{t("form.profile.label")}</label>
          <div className="segmented">
            {PROFILES.map((p) => (
              <button
                key={p}
                data-active={form.profile === p}
                onClick={() => update("profile", p)}
              >
                <div>{p}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{profileSub[p]}</div>
              </button>
            ))}
          </div>

          <div className="grid-2 mt-3">
            <div>
              <label>{t("form.revenue.label")}</label>
              <input
                type="number"
                value={form.grossAnnual}
                min={10_000}
                step={5_000}
                onChange={(e) => update("grossAnnual", Number(e.target.value))}
              />
            </div>
            <div>
              <label>{t("form.expenses.label")}</label>
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
            <label>{t("form.family.label")}</label>
            <div className="segmented">
              <button
                data-active={form.familyStatus === "single"}
                onClick={() => update("familyStatus", "single")}
              >
                {t("form.family.single")}
              </button>
              <button
                data-active={form.familyStatus === "couple"}
                onClick={() => update("familyStatus", "couple")}
              >
                {t("form.family.couple")}
              </button>
              <button
                data-active={form.familyStatus === "couple_children"}
                onClick={() => update("familyStatus", "couple_children")}
              >
                {t("form.family.couple_children")}
              </button>
            </div>
          </div>

          <div className="grid-2 mt-3">
            <div>
              <label>{t("form.children.label")}</label>
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
              <label>{t("form.age.label")}</label>
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
              {t("form.next")}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2>{t("form.step2.title")}</h2>
          <p className="text-muted">{t("form.step2.subtitle")}</p>

          <label className="mt-3">{t("form.housing.label")}</label>
          <div className="segmented">
            {HOUSING.map((h) => (
              <button
                key={h}
                data-active={form.lifestyle.housingType === h}
                onClick={() => updateLifestyle("housingType", h)}
              >
                {HOUSING_LABEL[h]}
              </button>
            ))}
          </div>

          <div className="grid-2 mt-3">
            <div>
              <label>{t("form.location.label")}</label>
              <div className="segmented">
                <button
                  data-active={form.lifestyle.location === "center"}
                  onClick={() => updateLifestyle("location", "center")}
                >
                  {t("form.location.center")}
                </button>
                <button
                  data-active={form.lifestyle.location === "periphery"}
                  onClick={() => updateLifestyle("location", "periphery")}
                >
                  {t("form.location.periphery")}
                </button>
              </div>
            </div>
            <div>
              <label>{t("form.car.label")}</label>
              <div className="segmented">
                <button
                  data-active={form.lifestyle.carOwnership === false}
                  onClick={() => updateLifestyle("carOwnership", false)}
                >
                  {t("form.no")}
                </button>
                <button
                  data-active={form.lifestyle.carOwnership === true}
                  onClick={() => updateLifestyle("carOwnership", true)}
                >
                  {t("form.yes")}
                </button>
              </div>
            </div>
          </div>

          <div className="grid-2 mt-3">
            <div>
              <label>{t("form.health.label")}</label>
              <div className="segmented">
                <button
                  data-active={form.lifestyle.privateHealthcare === true}
                  onClick={() => updateLifestyle("privateHealthcare", true)}
                >
                  {t("form.yes")}
                </button>
                <button
                  data-active={form.lifestyle.privateHealthcare === false}
                  onClick={() => updateLifestyle("privateHealthcare", false)}
                >
                  {t("form.no")}
                </button>
              </div>
              <p className="text-dim" style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                {t("form.health.hint")}
              </p>
            </div>
            <div>
              <label>{t("form.dining.label")}</label>
              <div className="segmented">
                {DINING.map((d) => (
                  <button
                    key={d}
                    data-active={form.lifestyle.diningOutFrequency === d}
                    onClick={() => updateLifestyle("diningOutFrequency", d)}
                  >
                    {diningLabel[d]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="row mt-4" style={{ justifyContent: "space-between" }}>
            <button data-variant="ghost" onClick={onBack}>
              {t("form.back")}
            </button>
            <button data-variant="primary" onClick={onNext}>
              {t("form.next")}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2>{t("form.step3.title")}</h2>
          <p className="text-muted">{t("form.step3.subtitle")}</p>

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
              <strong>{t("form.malta.warning.title")}</strong>
              <p style={{ margin: "0.5rem 0 0" }}>{t("form.malta.warning.body")}</p>
              <label className="checkbox mt-2">
                <input
                  type="checkbox"
                  checked={form.maltaAcknowledged}
                  onChange={(e) => update("maltaAcknowledged", e.target.checked)}
                />
                <span>{t("form.malta.ack")}</span>
              </label>
            </div>
          )}

          <div className="row mt-4" style={{ justifyContent: "space-between" }}>
            <button data-variant="ghost" onClick={onBack}>
              {t("form.back")}
            </button>
            <button
              data-variant="primary"
              onClick={onSubmit}
              disabled={form.jurisdictions.length < 2}
            >
              {t("form.submit")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
