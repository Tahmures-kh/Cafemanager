import { NextRequest, NextResponse } from "next/server";
import { getDataDb } from "../../../../lib/db";
import { requireAuth } from "../../../../lib/session";
import type { Employee } from "../../../../lib/types";

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const db = getDataDb(auth.account.role === "demo");
    const existing = db.prepare("SELECT * FROM employees WHERE id = ?").get(id) as EmployeeRow | undefined;

    if (!existing) {
        return NextResponse.json({ error: "پرسنل پیدا نشد." }, { status: 404 });
    }

    const fullName = typeof body?.fullName === "string" && body.fullName.trim() ? body.fullName.trim() : existing.full_name;
    const position = typeof body?.position === "string" ? (body.position.trim() || null) : existing.position;
    const baseSalary = Number.isFinite(Number(body?.baseSalary)) ? Math.max(0, Number(body.baseSalary)) : existing.base_salary;
    const isActive = typeof body?.isActive === "boolean" ? (body.isActive ? 1 : 0) : existing.is_active;

    db.prepare("UPDATE employees SET full_name = ?, position = ?, base_salary = ?, is_active = ? WHERE id = ?").run(
        fullName,
        position,
        baseSalary,
        isActive,
        id
    );

    const row = db.prepare("SELECT * FROM employees WHERE id = ?").get(id) as EmployeeRow;

    return NextResponse.json({ employee: mapEmployee(row) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const db = getDataDb(auth.account.role === "demo");

    db.prepare("DELETE FROM employees WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
}
