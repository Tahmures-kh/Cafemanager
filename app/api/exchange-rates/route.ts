import { NextRequest, NextResponse } from "next/server";
import { getDataDb, nowIso } from "../../../lib/db";
import { fetchLiveExchangeRates, isExchangeRateConfigured } from "../../../lib/exchange-rate";
import { requireAuth } from "../../../lib/session";

// Refreshed at most twice a day, matching the update cadence of the source channel.
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CURRENCIES = ["USD", "EUR", "TRY"] as const;

type RateRow = { currency: string; rate_to_toman: number; fetched_at: string };

export async function GET(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const db = getDataDb(auth.account.role === "demo");
    const rows = db.prepare("SELECT * FROM exchange_rates").all() as RateRow[];
    const byCurrency = new Map(rows.map((row) => [row.currency, row]));

    const oldestFetchMs = rows.length > 0 ? Math.min(...rows.map((row) => new Date(row.fetched_at).getTime())) : 0;
    const isStale = rows.length < CURRENCIES.length || Date.now() - oldestFetchMs > CACHE_TTL_MS;

    if (isStale && isExchangeRateConfigured()) {
        const live = await fetchLiveExchangeRates();

        if (live) {
            const now = nowIso();
            const upsert = db.prepare(
                `INSERT INTO exchange_rates (currency, rate_to_toman, fetched_at) VALUES (?, ?, ?)
                 ON CONFLICT(currency) DO UPDATE SET rate_to_toman = excluded.rate_to_toman, fetched_at = excluded.fetched_at`
            );
            upsert.run("USD", live.usd, now);
            upsert.run("EUR", live.eur, now);
            upsert.run("TRY", live.try, now);

            return NextResponse.json({
                configured: true,
                rates: { usd: live.usd, eur: live.eur, try: live.try },
                fetchedAt: now,
            });
        }
    }

    if (!isExchangeRateConfigured() || rows.length === 0) {
        return NextResponse.json({ configured: false });
    }

    return NextResponse.json({
        configured: true,
        rates: {
            usd: byCurrency.get("USD")?.rate_to_toman ?? 0,
            eur: byCurrency.get("EUR")?.rate_to_toman ?? 0,
            try: byCurrency.get("TRY")?.rate_to_toman ?? 0,
        },
        fetchedAt: rows[0]?.fetched_at ?? null,
    });
}
