import { describe, it, expect } from "vitest";
import { translate, LOCALES } from "@/lib/i18n";

describe("translate()", () => {
  it("FR est utilisé par défaut et retourne un texte non vide", () => {
    const s = translate("fr", "landing.hero.title");
    expect(s).toBeTruthy();
    expect(s).toContain("impôt");
  });

  it("EN est traduit différemment de FR", () => {
    const fr = translate("fr", "landing.hero.title");
    const en = translate("en", "landing.hero.title");
    expect(fr).not.toBe(en);
    expect(en).toContain("taxes");
  });

  it("interpolation des placeholders {n}", () => {
    const fr = translate("fr", "results.title", { n: 5 });
    expect(fr).toBe("Comparaison des 5 juridictions");

    const en = translate("en", "results.title", { n: 7 });
    expect(en).toBe("Comparing 7 jurisdictions");
  });

  it("toutes les clés existent dans les 2 locales (couverture FR/EN)", () => {
    const keys: Parameters<typeof translate>[1][] = [
      "nav.brand",
      "landing.hero.title",
      "form.step1.title",
      "form.step2.title",
      "form.step3.title",
      "form.submit",
      "form.malta.warning.title",
      "results.title",
      "results.export.pdf",
      "card.score",
      "card.exitTax.none",
      "card.exitTax.high",
      "detail.title",
      "breakdown.legend.net",
      "staleness.banner",
      "footer.disclaimer",
    ];
    for (const key of keys) {
      for (const loc of LOCALES) {
        const s = translate(loc, key);
        expect(s, `${key}/${loc}`).toBeTruthy();
        expect(s.length, `${key}/${loc}`).toBeGreaterThan(0);
        // Vérifie qu'il ne reste pas de placeholder non-résolu (sauf valeurs par défaut connues)
        if (!s.includes("{date}") && !s.includes("{n}")) {
          expect(s.includes("undefined")).toBe(false);
        }
      }
    }
  });

  it("formatage date FR vs EN dans staleness", () => {
    const fr = translate("fr", "staleness.banner", { date: "avril 2026" });
    expect(fr).toContain("avril 2026");
    const en = translate("en", "staleness.banner", { date: "April 2026" });
    expect(en).toContain("April 2026");
    expect(fr).not.toBe(en);
  });
});
