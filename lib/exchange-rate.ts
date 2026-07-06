export type ExchangeRates = {
    usd: number;
    eur: number;
    try: number;
};

// Public Telegram channel that posts hourly Tehran free-market rates
// (https://t.me/irancurrency). The public "/s/" preview endpoint requires no
// login/API key and lists messages oldest-first, so the *last* match for
// each currency in the page is the most recent quote.
const CHANNEL_PREVIEW_URL = process.env.EXCHANGE_RATE_SOURCE_URL ?? "https://t.me/s/irancurrency";

export function isExchangeRateConfigured() {
    return true;
}

function extractLatestTomanValue(html: string, label: string): number | null {
    const pattern = new RegExp(`${label}\\s*:\\s*([\\d,]+)\\s*تومان`, "gu");
    const matches = [...html.matchAll(pattern)];
    if (matches.length === 0) return null;

    const lastMatch = matches[matches.length - 1];
    const parsed = Number.parseFloat(lastMatch[1].replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchLiveExchangeRates(): Promise<ExchangeRates | null> {
    try {
        const response = await fetch(CHANNEL_PREVIEW_URL, { cache: "no-store" });
        if (!response.ok) return null;

        const html = await response.text();

        const usd = extractLatestTomanValue(html, "دلار");
        const eur = extractLatestTomanValue(html, "یورو");
        const tryRate = extractLatestTomanValue(html, "لیر");

        if (usd === null || eur === null || tryRate === null) return null;

        return { usd, eur, try: tryRate };
    } catch {
        return null;
    }
}
