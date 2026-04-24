const nbsp = " "; // narrow no-break space (FR)

export function formatEUR(n: number, opts: { decimals?: number } = {}): string {
  const decimals = opts.decimals ?? 0;
  const fixed = Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
  const parts = fixed.toFixed(decimals).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, nbsp);
  return parts.join(",") + `${nbsp}€`;
}

export function formatPercent(rate: number, decimals = 1): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

export function formatMonthly(n: number): string {
  return formatEUR(n / 12);
}

export const FLAG: Record<string, string> = {
  FR: "🇫🇷",
  US_NY: "🗽",
  US_CA: "🌴",
  US_FL_MIAMI: "☀️",
  MT: "🇲🇹",
  JP: "🇯🇵",
  UK: "🇬🇧",
};

export const LABEL: Record<string, string> = {
  FR: "Paris",
  US_NY: "New York",
  US_CA: "Californie",
  US_FL_MIAMI: "Miami",
  MT: "Malte",
  JP: "Tokyo",
  UK: "Londres",
};
