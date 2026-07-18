"use client";

export type PenzaRole = "admin" | "manager" | "staff" | "storage" | "accountant";

export const PENZA_ROLE_SESSION_KEY = "penza-cafe-active-role";
export const PENZA_ROLE_GUARD_MESSAGE_KEY = "penza-role-guard-message";

const validRoles: PenzaRole[] = ["admin", "manager", "staff", "storage", "accountant"];

export function isPenzaRole(value: string | null): value is PenzaRole {
    return Boolean(value && validRoles.includes(value as PenzaRole));
}

export function setActivePenzaRole(role: PenzaRole) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PENZA_ROLE_SESSION_KEY, role);
}

export function getActivePenzaRole(): PenzaRole | null {
    if (typeof window === "undefined") return null;

    const storedRole = window.localStorage.getItem(PENZA_ROLE_SESSION_KEY);
    return isPenzaRole(storedRole) ? storedRole : null;
}

export function clearActivePenzaRole() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PENZA_ROLE_SESSION_KEY);
}

export function getRoleLabel(role: PenzaRole) {
    const labels: Record<PenzaRole, string> = {
        admin: "ادمین",
        manager: "مدیر",
        staff: "کاربر کافه",
        storage: "انباردار",
        accountant: "حسابدار",
    };

    return labels[role];
}
