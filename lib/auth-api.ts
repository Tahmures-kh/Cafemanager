"use client";

import type { PenzaRole } from "./role-session";

export type CurrentAccount = {
    username: string;
    role: PenzaRole;
    displayName: string | null;
};

export type LoginResult =
    | { ok: true; account: CurrentAccount }
    | { ok: false; error: string };

export async function login(username: string, password: string): Promise<LoginResult> {
    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data) {
            return { ok: false, error: data?.error ?? "ورود ناموفق بود." };
        }

        return { ok: true, account: data as CurrentAccount };
    } catch {
        return { ok: false, error: "ارتباط با سرور برقرار نشد." };
    }
}

export async function logout(): Promise<void> {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
    } catch {
        // best-effort
    }
}

export async function getCurrentAccount(): Promise<CurrentAccount | null> {
    try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return null;

        return (await response.json()) as CurrentAccount;
    } catch {
        return null;
    }
}
