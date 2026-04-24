"use client";

import { useState } from "react";
import type { JurisdictionResult, FormState } from "@/ui/hooks/useSimulation";
import { useI18n } from "@/ui/hooks/useI18n";

interface Props {
  results: JurisdictionResult[];
  form: FormState;
}

export function ExportPdfButton({ results, form }: Props) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (results.length === 0) return;
    setBusy(true);
    try {
      // Dynamic import : @react-pdf/renderer est lourd, on le charge à la demande
      // pour ne pas impacter le TTFB de la page résultats.
      const [{ pdf }, { SimulationPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/ui/pdf/SimulationPdf"),
      ]);
      const blob = await pdf(
        <SimulationPdf results={results} form={form} locale={locale} generatedAt={new Date()} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fiscam-simulation-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button data-variant="ghost" onClick={onClick} disabled={busy || results.length === 0}>
      {busy ? t("results.export.generating") : `↓ ${t("results.export.pdf")}`}
    </button>
  );
}
