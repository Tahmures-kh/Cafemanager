import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDataDb, nowIso } from "../../../lib/db";
import { requireAuth } from "../../../lib/session";
import type { Employee } from "../../../lib/types";

type EmployeeRow = {
    id: string;
    full_name: string;
    position: string | null;
    base_salary: number;
    is_active: number;
    created_at: string;
};

function mapEmployee(row: EmployeeRow): Employee {
    return {
        id: row.id,
        fullName: row.full_name,
        position: row.position ?? undefined,
        baseSalary: row.base_salary,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
    };
}

export async function GET(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const db = getDataDb(auth.account.role === "demo");
    const rows = db.prepare("SELECT * FROM employees ORDER BY full_name COLLATE NOCASE ASC").all() as EmployeeRow[];

    return NextResponse.json({ employees: rows.map(mapEmployee) });
}

export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

    if (!fullName) {
        return NextResponse.json({ error: "نام پرسنل الزامی است." }, { status: 400 });
    }

    const db = getDataDb(auth.account.role === "demo");
    const id = createRecordId("employee");

    db.prepare(
        `INSERT INTO employees (id, full_name, position, base_salary, is_active, created_at)
         VALUES (?, ?, ?, ?, 1, ?)`
    ).run(
        id,
        fullName,
        typeof body.position === "string" && body.position.trim() ? body.position.trim() : null,
        Number.isFinite(Number(body.baseSalary)) ? Math.max(0, Number(body.baseSalary)) : 0,
        nowIso()
    );

    const row = db.prepare("SELECT * FROM employees WHERE id = ?").get(id) as EmployeeRow;

    return NextResponse.json({ employee: mapEmployee(row) });
}
