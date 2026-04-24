"use client";

import type { JurisdictionResult } from "@/ui/hooks/useSimulation";
import { FLAG, LABEL, formatEUR } from "@/lib/formatters";
import { useI18n } from "@/ui/hooks/useI18n";

interface Props {
  results: JurisdictionResult[];
  onSelect?: (j: JurisdictionResult["jurisdiction"]) => void;
}

export function ComparisonChart({ results, onSelect }: Props) {
  const { t } = useI18n();
  if (results.length === 0) return null;
  const positive = results.filter((r) => r.netAfterColMonthlyEUR > 0);
  const max = Math.max(...positive.map((r) => r.netAfterColMonthlyEUR), 1);

  const color = (rank: number) => {
    if (rank === 0) return "var(--primary)";
    if (rank === 1) return "#34d399";
    if (rank === 2) return "#fbbf24";
    if (rank >= results.length - 1) return "var(--danger)";
    return "#94a3b8";
  };

  return (
    <div className="card">
      <h3>{t("results.chart.title")}</h3>
      <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>
        {t("results.chart.subtitle")}
      </p>
      <div className="mt-3">
        {results.map((r, i) => {
          const width = Math.max(2, (r.netAfterColMonthlyEUR / max) * 100);
          return (
            <button
              key={r.jurisdiction}
              className="compare-row"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--border)",
                width: "100%",
                textAlign: "left",
                padding: "0.5rem 0",
                cursor: onSelect ? "pointer" : "default",
              }}
              onClick={() => onSelect?.(r.jurisdiction)}
            >
              <div className="compare-label">
                <span style={{ marginRight: "0.5rem" }}>{FLAG[r.jurisdiction]}</span>
                {LABEL[r.jurisdiction]}
              </div>
              <div className="compare-bar-track">
                <div
                  className="compare-bar-fill"
                  style={{
                    width: `${r.netAfterColMonthlyEUR > 0 ? width : 2}%`,
                    background:
                      r.netAfterColMonthlyEUR > 0 ? color(i) : "var(--danger)",
                  }}
                />
              </div>
              <div className="compare-value">{formatEUR(r.netAfterColMonthlyEUR)}/mo</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
