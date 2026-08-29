import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDataDb, nowIso } from "../../../lib/db";
import { requireAuth } from "../../../lib/session";

type UnitTypeRow = {
    id: string;
    name: string;
    created_at: string;
};

export async function GET(request: NextRequest) {
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;

    const db = getDataDb(auth.account.role === "demo");
    const rows = db.prepare("SELECT * FROM unit_types ORDER BY name COLLATE NOCASE ASC").all() as UnitTypeRow[];

    return NextResponse.json({ unitTypes: rows.map((row) => row.name) });
}

export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "storage"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
        return NextResponse.json({ error: "نام واحد الزامی است." }, { status: 400 });
    }

    const db = getDataDb(auth.account.role === "demo");
    const existing = db.prepare("SELECT * FROM unit_types WHERE name = ?").get(name) as UnitTypeRow | undefined;

    if (!existing) {
        db.prepare("INSERT INTO unit_types (id, name, created_at) VALUES (?, ?, ?)").run(
            createRecordId("unit"),
            name,
            nowIso()
        );
    }

    const rows = db.prepare("SELECT * FROM unit_types ORDER BY name COLLATE NOCASE ASC").all() as UnitTypeRow[];

    return NextResponse.json({ unitTypes: rows.map((row) => row.name) });
}
