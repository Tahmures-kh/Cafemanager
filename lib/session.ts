import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createRecordId, getDb } from "./db";

export const SESSION_COOKIE_NAME = "penza_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionAccount = {
    id: string;
    username: string;
    role: string;
    displayName: string | null;
};

type SessionJoinRow = {
    id: string;
    username: string;
    role: string;
    display_name: string | null;
    is_active: number;
    session_expires_at: string;
};

export function createSession(accountId: string, ip: string, userAgent: string) {
    const db = getDb();
    const id = createRecordId("session");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    db.prepare(
        `INSERT INTO sessions (id, account_id, ip, user_agent, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, accountId, ip, userAgent, now.toISOString(), expiresAt.toISOString());

    return { id, expiresAt };
}

export function deleteSession(sessionId: string) {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function getClientIp(request: NextRequest) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();

    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    return "نامشخص (بدون پراکسی)";
}

export function getSessionAccount(request: NextRequest): SessionAccount | null {
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionId) return null;

    const row = getDb()
        .prepare(
            `SELECT accounts.id, accounts.username, accounts.role, accounts.display_name, accounts.is_active,
                    sessions.expires_at as session_expires_at
             FROM sessions JOIN accounts ON accounts.id = sessions.account_id
             WHERE sessions.id = ?`
        )
        .get(sessionId) as SessionJoinRow | undefined;

    if (!row) return null;
    if (!row.is_active) return null;
    if (new Date(row.session_expires_at).getTime() < Date.now()) return null;

    return { id: row.id, username: row.username, role: row.role, displayName: row.display_name };
}

export function getSessionId(request: NextRequest): string | null {
    return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export type AuthResult =
    | { ok: true; account: SessionAccount }
    | { ok: false; response: NextResponse };

/**
 * Gate for every API route. `admin` always passes regardless of
 * `allowedRoles` — admin gets access to everything. `demo` passes the same
 * way EXCEPT on routes restricted to admin (allowedRoles containing
 * "admin") — the demo account can see/do everything except admin actions.
 */
export function requireAuth(request: NextRequest, allowedRoles?: string[]): AuthResult {
    const account = getSessionAccount(request);

    if (!account) {
        return { ok: false, response: NextResponse.json({ error: "ورود لازم است." }, { status: 401 }) };
    }

    const demoBypass = account.role === "demo" && !(allowedRoles && allowedRoles.includes("admin"));

    if (allowedRoles && account.role !== "admin" && !demoBypass && !allowedRoles.includes(account.role)) {
        return { ok: false, response: NextResponse.json({ error: "دسترسی مجاز نیست." }, { status: 403 }) };
    }

    return { ok: true, account };
}
