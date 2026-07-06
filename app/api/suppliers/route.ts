import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../lib/db";
import type { Supplier } from "../../../lib/types";

type SupplierRow = { id: string; name: string; phone: string; website: string | null; notes: string | null; created_at: string };

function mapSupplier(row: SupplierRow): Supplier {
    return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        website: row.website ?? undefined,
        notes: row.notes ?? undefined,
        createdAt: row.created_at,
    };
}

export async function GET() {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM suppliers ORDER BY name ASC").all() as SupplierRow[];

    return NextResponse.json({ suppliers: rows.map(mapSupplier) });
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.name !== "string" || !body.name.trim() || typeof body.phone !== "string" || !body.phone.trim()) {
        return NextResponse.json({ error: "نام و شماره تماس فروشنده الزامی است." }, { status: 400 });
    }

    const db = getDb();
    const id = createRecordId("supplier");
    const now = nowIso();

    db.prepare("INSERT INTO suppliers (id, name, phone, website, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
        id,
        body.name.trim(),
        body.phone.trim(),
        typeof body.website === "string" && body.website.trim() ? body.website.trim() : null,
        typeof body.notes === "string" ? body.notes : null,
        now
    );

    const row = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id) as SupplierRow;

    return NextResponse.json({ supplier: mapSupplier(row) });
}
