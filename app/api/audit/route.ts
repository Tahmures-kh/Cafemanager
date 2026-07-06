import { mkdir, readFile, appendFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import type { AuditLogEntry } from "../../../lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(DATA_DIR, "audit-log.jsonl");
const MAX_ENTRIES_RETURNED = 500;

function createId() {
    return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getClientIp(request: NextRequest) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();

    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    return "نامشخص (بدون پراکسی)";
}

async function readAllEntries(): Promise<AuditLogEntry[]> {
    try {
        const raw = await readFile(LOG_FILE, "utf-8");
        return raw
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                try {
                    return JSON.parse(line) as AuditLogEntry;
                } catch {
                    return null;
                }
            })
            .filter((entry): entry is AuditLogEntry => entry !== null);
    } catch {
        return [];
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.scope !== "string" || typeof body.action !== "string") {
        return NextResponse.json({ error: "scope و action الزامی است." }, { status: 400 });
    }

    const entry: AuditLogEntry = {
        id: createId(),
        scope: body.scope,
        action: body.action,
        description: typeof body.description === "string" ? body.description : "",
        actorRole: typeof body.actorRole === "string" ? body.actorRole : "نامشخص",
        actorName: typeof body.actorName === "string" && body.actorName.trim() ? body.actorName.trim() : "نامشخص",
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent") ?? "نامشخص",
        createdAt: new Date().toISOString(),
    };

    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf-8");

    return NextResponse.json({ entry });
}

export async function GET(request: NextRequest) {
    const scope = request.nextUrl.searchParams.get("scope");
    const entries = await readAllEntries();

    const filtered = scope ? entries.filter((entry) => entry.scope === scope) : entries;
    const sorted = filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ entries: sorted.slice(0, MAX_ENTRIES_RETURNED) });
}
