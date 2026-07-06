import type { PenzaRole } from "./role-session";

export const PENZA_CREDENTIALS: Record<PenzaRole, { username: string; password: string }> = {
    manager: { username: "manager", password: "manager123" },
    staff: { username: "staff", password: "staff123" },
    storage: { username: "storage", password: "storage123" },
};

export function findRoleByCredentials(username: string, password: string): PenzaRole | null {
    const normalizedUsername = username.trim();

    const match = (Object.entries(PENZA_CREDENTIALS) as Array<[PenzaRole, { username: string; password: string }]>)
        .find(([, credentials]) => credentials.username === normalizedUsername && credentials.password === password);

    return match ? match[0] : null;
}
