import { NextRequest, NextResponse } from "next/server";
import { getDataDb } from "../../../../lib/db";
import { requireAuth } from "../../../../lib/session";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const db = getDataDb(auth.account.role === "demo");

    db.prepare("DELETE FROM payroll_records WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
}
