import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../lib/db";
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

function getClientIp(request: NextRequest) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();

    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    return "نامشخص (بدون پراکسی)";
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.scope !== "string" || typeof body.action !== "string") {
        return NextResponse.json({ error: "scope و action الزامی است." }, { status: 400 });
    }

    const entry: AuditLogEntry = {
        id: createRecordId("audit"),
        scope: body.scope,
        action: body.action,
        description: typeof body.description === "string" ? body.description : "",
        actorRole: typeof body.actorRole === "string" ? body.actorRole : "نامشخص",
        actorName: typeof body.actorName === "string" && body.actorName.trim() ? body.actorName.trim() : "نامشخص",
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent") ?? "نامشخص",
        createdAt: nowIso(),
    };

    const db = getDb();
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
    const scope = request.nextUrl.searchParams.get("scope");
    const db = getDb();

    const rows = scope
        ? (db
            .prepare("SELECT * FROM audit_log WHERE scope = ? ORDER BY created_at DESC LIMIT ?")
            .all(scope, MAX_ENTRIES_RETURNED) as AuditLogRow[])
        : (db
            .prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?")
            .all(MAX_ENTRIES_RETURNED) as AuditLogRow[]);

    return NextResponse.json({ entries: rows.map(mapRow) });
}
