import { NextRequest, NextResponse } from "next/server";
import { getDataDb, nowIso } from "../../../lib/db";
import { requireAuth } from "../../../lib/session";

type PriceRow = {
    product_id: string;
    product_name: string;
    unit_price: number;
    stock_unit: string | null;
    updated_at: string;
};

export async function GET(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const db = getDataDb(auth.account.role === "demo");
    const rows = db.prepare("SELECT * FROM ingredient_prices").all() as PriceRow[];

    return NextResponse.json({
        prices: rows.map((row) => ({
            productId: row.product_id,
            productName: row.product_name,
            unitPrice: row.unit_price,
            stockUnit: row.stock_unit ?? undefined,
            updatedAt: row.updated_at,
        })),
    });
}

export async function PUT(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);

    if (!body || typeof body.productId !== "string" || typeof body.unitPrice !== "number" || body.unitPrice < 0) {
        return NextResponse.json({ error: "productId و unitPrice معتبر الزامی است." }, { status: 400 });
    }

    const db = getDataDb(auth.account.role === "demo");
    const now = nowIso();

    db.prepare(
        `INSERT INTO ingredient_prices (product_id, product_name, unit_price, stock_unit, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(product_id) DO UPDATE SET
            product_name = excluded.product_name,
            unit_price = excluded.unit_price,
            stock_unit = excluded.stock_unit,
            updated_at = excluded.updated_at`
    ).run(
        body.productId,
        typeof body.productName === "string" ? body.productName : body.productId,
        body.unitPrice,
        typeof body.stockUnit === "string" ? body.stockUnit : null,
        now
    );

    return NextResponse.json({ success: true });
}
