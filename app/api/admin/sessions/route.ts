import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { requireAuth } from "../../../../lib/session";

type SessionRow = {
    id: string;
    account_id: string;
    ip: string | null;
    user_agent: string | null;
    created_at: string;
    expires_at: string;
    username: string;
    role: string;
    display_name: string | null;
};

export async function GET(request: NextRequest) {
    const auth = requireAuth(request, ["admin"]);
    if (!auth.ok) return auth.response;

    const rows = getDb()
        .prepare(
            `SELECT sessions.id, sessions.account_id, sessions.ip, sessions.user_agent, sessions.created_at, sessions.expires_at,
                    accounts.username, accounts.role, accounts.display_name
             FROM sessions
             JOIN accounts ON accounts.id = sessions.account_id
             WHERE sessions.expires_at > ?
             ORDER BY sessions.created_at DESC`
        )
        .all(new Date().toISOString()) as SessionRow[];

    return NextResponse.json({
        sessions: rows.map((row) => ({
            id: row.id,
            accountId: row.account_id,
            username: row.username,
            role: row.role,
            displayName: row.display_name ?? undefined,
            ip: row.ip ?? "نامشخص",
            userAgent: row.user_agent ?? "نامشخص",
            createdAt: row.created_at,
            expiresAt: row.expires_at,
        })),
    });
}
