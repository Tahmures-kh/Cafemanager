import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { verifyPassword } from "../../../../lib/password";
import { createSession, getClientIp, SESSION_COOKIE_NAME } from "../../../../lib/session";

type AccountRow = {
    id: string;
    username: string;
    password_hash: string;
    password_salt: string;
    role: string;
    display_name: string | null;
    is_active: number;
};

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
        return NextResponse.json({ error: "نام کاربری و رمز عبور الزامی است." }, { status: 400 });
    }

    const db = getDb();
    const account = db
        .prepare("SELECT * FROM accounts WHERE username = ?")
        .get(body.username.trim()) as AccountRow | undefined;

    if (!account || !account.is_active || !verifyPassword(body.password, account.password_hash, account.password_salt)) {
        return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است." }, { status: 401 });
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") ?? "نامشخص";
    const session = createSession(account.id, ip, userAgent);

    const response = NextResponse.json({
        username: account.username,
        role: account.role,
        displayName: account.display_name,
    });

    response.cookies.set(SESSION_COOKIE_NAME, session.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: session.expiresAt,
    });

    return response;
}
