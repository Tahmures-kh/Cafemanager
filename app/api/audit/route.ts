import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDataDb, nowIso } from "../../../lib/db";
import { getClientIp, requireAuth } from "../../../lib/session";
import type { AuditLogEntry } from "../../../lib/types";

const MAX_ENTRIES_RETURNED = 500;

type AuditLogRow = {
    id: string;
    scope: string;
    action: string;
    description: string | null;
    actor_role: string | null;
    actor_name: string | null;
    ip: string | null;
    user_agent: string | null;
    created_at: string;
};

function mapRow(row: AuditLogRow): AuditLogEntry {
    return {
        id: row.id,
        scope: row.scope,
        action: row.action,
        description: row.description ?? "",
        actorRole: row.actor_role ?? "نامشخص",
        actorName: row.actor_name ?? "نامشخص",
        ip: row.ip ?? "نامشخص",
        userAgent: row.user_agent ?? "نامشخص",
        createdAt: row.created_at,
    };
}

export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);

    if (!body || typeof body.scope !== "string" || typeof body.action !== "string") {
        return NextResponse.json({ error: "scope و action الزامی است." }, { status: 400 });
    }

    // actorName/actorRole come from the verified session, never from the client
    // body — otherwise anyone could plant fabricated entries in the log.
    const entry: AuditLogEntry = {
        id: createRecordId("audit"),
        scope: body.scope,
        action: body.action,
        description: typeof body.description === "string" ? body.description : "",
        actorRole: auth.account.role,
        actorName: auth.account.displayName ?? auth.account.username,
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent") ?? "نامشخص",
        createdAt: nowIso(),
    };

    const db = getDataDb(auth.account.role === "demo");
    db.prepare(
        `INSERT INTO audit_log (id, scope, action, description, actor_role, actor_name, ip, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
        entry.id,
        entry.scope,
        entry.action,
        entry.description,
        entry.actorRole,
        entry.actorName,
        entry.ip,
        entry.userAgent,
        entry.createdAt
    );

    return NextResponse.json({ entry });
}

export async function GET(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const scope = request.nextUrl.searchParams.get("scope");
    const db = getDataDb(auth.account.role === "demo");

    const rows = scope
        ? (db
            .prepare("SELECT * FROM audit_log WHERE scope = ? ORDER BY created_at DESC LIMIT ?")
            .all(scope, MAX_ENTRIES_RETURNED) as AuditLogRow[])
        : (db
            .prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?")
            .all(MAX_ENTRIES_RETURNED) as AuditLogRow[]);

    return NextResponse.json({ entries: rows.map(mapRow) });
}
