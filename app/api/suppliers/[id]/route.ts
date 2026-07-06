import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import type { Supplier } from "../../../../lib/types";

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body.name !== "string" || !body.name.trim() || typeof body.phone !== "string" || !body.phone.trim()) {
        return NextResponse.json({ error: "نام و شماره تماس فروشنده الزامی است." }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id) as SupplierRow | undefined;

    if (!existing) {
        return NextResponse.json({ error: "فروشنده پیدا نشد." }, { status: 404 });
    }

    db.prepare("UPDATE suppliers SET name = ?, phone = ?, website = ?, notes = ? WHERE id = ?").run(
        body.name.trim(),
        body.phone.trim(),
        typeof body.website === "string" && body.website.trim() ? body.website.trim() : null,
        typeof body.notes === "string" ? body.notes : null,
        id
    );

    const row = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id) as SupplierRow;

    return NextResponse.json({ supplier: mapSupplier(row) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const db = getDb();

    db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
}
