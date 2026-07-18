"use client";

export type AdminAccount = {
    id: string;
    username: string;
    role: string;
    displayName?: string;
    isActive: boolean;
    createdAt: string;
};

export type AdminAccountInput = {
    username: string;
    password: string;
    role: string;
    displayName?: string;
};

export type AdminAccountUpdateInput = {
    role?: string;
    displayName?: string;
    isActive?: boolean;
    password?: string;
};

export type AdminSession = {
    id: string;
    accountId: string;
    username: string;
    role: string;
    displayName?: string;
    ip: string;
    userAgent: string;
    createdAt: string;
    expiresAt: string;
};

export async function fetchAccounts(): Promise<AdminAccount[]> {
    try {
        const response = await fetch("/api/admin/accounts", { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.accounts) ? (data.accounts as AdminAccount[]) : [];
    } catch {
        return [];
    }
}

export type AccountActionResult =
    | { ok: true; account: AdminAccount }
    | { ok: false; error: string };

export async function createAccount(input: AdminAccountInput): Promise<AccountActionResult> {
    try {
        const response = await fetch("/api/admin/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data) {
            return { ok: false, error: data?.error ?? "ساخت اکانت ناموفق بود." };
        }

        return { ok: true, account: data.account as AdminAccount };
    } catch {
        return { ok: false, error: "ارتباط با سرور برقرار نشد." };
    }
}

export async function updateAccount(accountId: string, input: AdminAccountUpdateInput): Promise<AccountActionResult> {
    try {
        const response = await fetch(`/api/admin/accounts/${accountId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data) {
            return { ok: false, error: data?.error ?? "بروزرسانی اکانت ناموفق بود." };
        }

        return { ok: true, account: data.account as AdminAccount };
    } catch {
        return { ok: false, error: "ارتباط با سرور برقرار نشد." };
    }
}

export async function deleteAccount(accountId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/admin/accounts/${accountId}`, { method: "DELETE" });
        return response.ok;
    } catch {
        return false;
    }
}

export async function fetchActiveSessions(): Promise<AdminSession[]> {
    try {
        const response = await fetch("/api/admin/sessions", { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.sessions) ? (data.sessions as AdminSession[]) : [];
    } catch {
        return [];
    }
}

export async function revokeSession(sessionId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/admin/sessions/${sessionId}`, { method: "DELETE" });
        return response.ok;
    } catch {
        return false;
    }
}
