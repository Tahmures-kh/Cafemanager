"use client";

import type { AuditLogEntry } from "./types";

export type LogAuditEventInput = {
    scope: string;
    action: string;
    description: string;
};

/**
 * Best-effort: a logging failure must never block the manager's actual
 * action (import/edit/delete), so errors are swallowed here.
 */
export async function logAuditEvent(input: LogAuditEventInput) {
    try {
        await fetch("/api/audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
    } catch {
        // ignore — logging is not allowed to break the calling action
    }
}

export async function fetchAuditLog(scope: string): Promise<AuditLogEntry[]> {
    try {
        const response = await fetch(`/api/audit?scope=${encodeURIComponent(scope)}`, { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.entries) ? (data.entries as AuditLogEntry[]) : [];
    } catch {
        return [];
    }
}
