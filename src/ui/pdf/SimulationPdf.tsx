"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { JurisdictionResult, FormState } from "@/ui/hooks/useSimulation";
import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import { FLAG, LABEL } from "@/lib/formatters";

// Formatteurs locaux sans narrow no-break space (compatible PDF)
function formatEurPlain(n: number): string {
  const rounded = Math.round(n);
  return new Intl.NumberFormat("en-US").format(rounded) + " EUR";
}
function formatPercentPlain(rate: number, decimals = 1): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 36,
    color: "#0f172a",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 10,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  brand: { fontSize: 14, fontWeight: 700, color: "#10b981" },
  brandSub: { fontSize: 8, color: "#64748b", marginTop: 3 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#475569", marginBottom: 12 },
  section: { marginTop: 12, marginBottom: 4 },
  h2: { fontSize: 11, fontWeight: 700, marginBottom: 6, color: "#0f172a" },

  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  rowAlt: { backgroundColor: "#f8fafc" },
  cellFlag: { width: 20 },
  cellName: { flex: 1.2 },
  cellNum: { flex: 1, textAlign: "right" },
  cellRank: { width: 20, textAlign: "right" },

  h3: { fontSize: 10, fontWeight: 700, marginTop: 8, marginBottom: 4 },
  prosCons: { flexDirection: "row", gap: 12 },
  prosCol: { flex: 1 },
  prosTitle: { color: "#10b981", fontWeight: 700, marginBottom: 3 },
  consTitle: { color: "#ef4444", fontWeight: 700, marginBottom: 3 },
  bullet: { marginBottom: 2, paddingLeft: 8, fontSize: 8 },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
});

export interface SimulationPdfProps {
  results: JurisdictionResult[];
  form: FormState;
  locale: Locale;
  generatedAt?: Date;
}

export function SimulationPdf({ results, form, locale, generatedAt = new Date() }: SimulationPdfProps) {
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) =>
    translate(locale, key, params);

  const familyLabel =
    form.familyStatus === "single"
      ? t("form.family.single")
      : form.familyStatus === "couple"
        ? t("form.family.couple")
        : t("form.family.couple_children");

  const dateStr = generatedAt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>Fiscam Simulator</Text>
            <Text style={styles.brandSub}>{t("nav.dataDate")}</Text>
          </View>
          <Text style={styles.brandSub}>{dateStr}</Text>
        </View>

        <Text style={styles.title}>{t("results.title", { n: results.length })}</Text>
        <Text style={styles.subtitle}>
          {form.profile} · {formatEurPlain(form.grossAnnual)} · {familyLabel} ·{" "}
          {form.lifestyle.housingType.toUpperCase()} · {form.lifestyle.location}
        </Text>

        <View style={styles.section}>
          <Text style={styles.h2}>{t("results.chart.title")}</Text>
        </View>

        <View style={styles.tableHead}>
          <Text style={styles.cellRank}>#</Text>
          <Text style={styles.cellFlag}> </Text>
          <Text style={styles.cellName}>{t("card.structure")}</Text>
          <Text style={styles.cellNum}>{t("card.taxesAndContrib")}</Text>
          <Text style={styles.cellNum}>{t("card.colAnnual")}</Text>
          <Text style={styles.cellNum}>{t("card.netAfterTax")}</Text>
          <Text style={styles.cellNum}>{t("card.cashflowAnnual")}</Text>
          <Text style={styles.cellNum}>{t("card.score")}</Text>
        </View>
        {results.map((r, i) => (
          <View
            key={r.jurisdiction}
            style={i % 2 === 0 ? styles.row : [styles.row, styles.rowAlt]}
          >
            <Text style={styles.cellRank}>{i + 1}</Text>
            <Text style={styles.cellFlag}>{FLAG[r.jurisdiction]}</Text>
            <Text style={styles.cellName}>{LABEL[r.jurisdiction]}</Text>
            <Text style={styles.cellNum}>-{formatEurPlain(r.result.totalTax)}</Text>
            <Text style={styles.cellNum}>-{formatEurPlain(r.col.totalAnnual)}</Text>
            <Text style={styles.cellNum}>{formatEurPlain(r.netInHandEUR)}</Text>
            <Text style={styles.cellNum}>{formatEurPlain(r.netAfterColAnnualEUR)}</Text>
            <Text style={styles.cellNum}>{r.verdict.score}/100</Text>
          </View>
        ))}

        {results.slice(0, 3).map((r) => {
          const b = r.result.socialContributionsBreakdown;
          return (
            <View key={r.jurisdiction} style={styles.section} wrap={false}>
              <Text style={styles.h3}>
                {FLAG[r.jurisdiction]} {LABEL[r.jurisdiction]} · {r.result.structure} ·{" "}
                {formatPercentPlain(r.result.effectiveRate)}
              </Text>
              <View style={styles.prosCons}>
                <View style={styles.prosCol}>
                  <Text style={styles.prosTitle}>✓ Pros</Text>
                  {r.prosCons.pros.length === 0 ? (
                    <Text style={styles.bullet}>—</Text>
                  ) : (
                    r.prosCons.pros.map((p, i) => (
                      <Text key={i} style={styles.bullet}>
                        • {p}
                      </Text>
                    ))
                  )}
                </View>
                <View style={styles.prosCol}>
                  <Text style={styles.consTitle}>✗ Cons</Text>
                  {r.prosCons.cons.length === 0 ? (
                    <Text style={styles.bullet}>—</Text>
                  ) : (
                    r.prosCons.cons.map((c, i) => (
                      <Text key={i} style={styles.bullet}>
                        • {c}
                      </Text>
                    ))
                  )}
                </View>
              </View>
              <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>
                {t("detail.row.effectivelyValuable")}: {formatEurPlain(b.effectivelyValuable)}
                {"   "}
                {t("detail.row.nominallyValuable")}: {formatEurPlain(b.nominallyValuable)}
                {"   "}
                {t("detail.row.pureCost")}: {formatEurPlain(b.pureCost)}
              </Text>
            </View>
          );
        })}

        <Text style={styles.footer} fixed>
          {t("footer.disclaimer")} · fiscam simulator · {dateStr}
        </Text>
      </Page>
    </Document>
  );
}
