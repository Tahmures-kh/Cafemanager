import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { hashPassword } from "../../../../../lib/password";
import { requireAuth } from "../../../../../lib/session";

const VALID_ROLES = ["admin", "manager", "staff", "storage"];

type AccountRow = {
    id: string;
    username: string;
    role: string;
    display_name: string | null;
    is_active: number;
    created_at: string;
};

function mapAccount(row: AccountRow) {
    return {
        id: row.id,
        username: row.username,
        role: row.role,
        displayName: row.display_name ?? undefined,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
    };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request, ["admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const db = getDb();
    const existing = db.prepare("SELECT * FROM accounts WHERE id = ?").get(id) as
        | (AccountRow & { password_hash: string; password_salt: string })
        | undefined;

    if (!existing) {
        return NextResponse.json({ error: "اکانت پیدا نشد." }, { status: 404 });
    }

    if (body?.isActive === false && existing.id === auth.account.id) {
        return NextResponse.json({ error: "نمی‌توانید اکانت خودتان را غیرفعال کنید." }, { status: 400 });
    }

    const role = typeof body?.role === "string" && VALID_ROLES.includes(body.role) ? body.role : existing.role;
    const displayName = typeof body?.displayName === "string" ? body.displayName : existing.display_name;
    const isActive = typeof body?.isActive === "boolean" ? (body.isActive ? 1 : 0) : existing.is_active;

    let passwordHash = existing.password_hash;
    let passwordSalt = existing.password_salt;
    if (typeof body?.password === "string" && body.password.length >= 6) {
        const hashed = hashPassword(body.password);
        passwordHash = hashed.hash;
        passwordSalt = hashed.salt;
    }

    db.prepare(
        `UPDATE accounts SET role = ?, display_name = ?, is_active = ?, password_hash = ?, password_salt = ? WHERE id = ?`
    ).run(role, displayName, isActive, passwordHash, passwordSalt, id);

    const row = db
        .prepare("SELECT id, username, role, display_name, is_active, created_at FROM accounts WHERE id = ?")
        .get(id) as AccountRow;

    return NextResponse.json({ account: mapAccount(row) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request, ["admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;

    if (id === auth.account.id) {
        return NextResponse.json({ error: "نمی‌توانید اکانت خودتان را حذف کنید." }, { status: 400 });
    }

    getDb().prepare("DELETE FROM accounts WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
}
