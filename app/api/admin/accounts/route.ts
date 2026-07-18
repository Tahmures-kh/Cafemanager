import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../../lib/db";
import { hashPassword } from "../../../../lib/password";
import { requireAuth } from "../../../../lib/session";

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

export async function GET(request: NextRequest) {
    const auth = requireAuth(request, ["admin"]);
    if (!auth.ok) return auth.response;

    const rows = getDb()
        .prepare("SELECT id, username, role, display_name, is_active, created_at FROM accounts ORDER BY created_at DESC")
        .all() as AccountRow[];

    return NextResponse.json({ accounts: rows.map(mapAccount) });
}

export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["admin"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);

    if (
        !body ||
        typeof body.username !== "string" ||
        !body.username.trim() ||
        typeof body.password !== "string" ||
        body.password.length < 6 ||
        typeof body.role !== "string" ||
        !VALID_ROLES.includes(body.role)
    ) {
        return NextResponse.json(
            { error: "نام کاربری، رمز عبور (حداقل ۶ کاراکتر) و نقش معتبر الزامی است." },
            { status: 400 }
        );
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM accounts WHERE username = ?").get(body.username.trim());
    if (existing) {
        return NextResponse.json({ error: "این نام کاربری قبلاً استفاده شده است." }, { status: 409 });
    }

    const { hash, salt } = hashPassword(body.password);
    const id = createRecordId("account");
    const now = nowIso();

    db.prepare(
        `INSERT INTO accounts (id, username, password_hash, password_salt, role, display_name, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(id, body.username.trim(), hash, salt, body.role, typeof body.displayName === "string" ? body.displayName : null, now);

    const row = db
        .prepare("SELECT id, username, role, display_name, is_active, created_at FROM accounts WHERE id = ?")
        .get(id) as AccountRow;

    return NextResponse.json({ account: mapAccount(row) });
}
