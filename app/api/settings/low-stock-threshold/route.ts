import { NextRequest, NextResponse } from "next/server";
import { getDataDb, LOW_STOCK_ALERT_PERCENT_SETTING_KEY } from "../../../../lib/db";
import { requireAuth } from "../../../../lib/session";

const DEFAULT_PERCENT = 20;

export async function GET(request: NextRequest) {
    // Read-only: manager also needs the current threshold to compute its own
    // resupply-count indicator. Only storage can change it (see PATCH below).
    const auth = requireAuth(request, ["storage", "manager"]);
    if (!auth.ok) return auth.response;

    const db = getDataDb(auth.account.role === "demo");
    const row = db.prepare("SELECT value FROM app_settings WHERE key = ?").get(LOW_STOCK_ALERT_PERCENT_SETTING_KEY) as
        | { value: string }
        | undefined;

    const percent = row ? Number(row.value) : DEFAULT_PERCENT;
    return NextResponse.json({ percent: Number.isFinite(percent) ? percent : DEFAULT_PERCENT });
}

export async function PATCH(request: NextRequest) {
    const auth = requireAuth(request, ["storage"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    const percent = Number(body?.percent);

    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        return NextResponse.json({ error: "درصد هشدار باید عددی بین ۱ تا ۱۰۰ باشد." }, { status: 400 });
    }

    const db = getDataDb(auth.account.role === "demo");
    db.prepare(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run(LOW_STOCK_ALERT_PERCENT_SETTING_KEY, String(percent));

    return NextResponse.json({ percent });
}
