"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
    getActivePenzaRole,
    getRoleLabel,
    PENZA_ROLE_GUARD_MESSAGE_KEY,
    type PenzaRole,
} from "../lib/role-session";

type GuardState = "checking" | "allowed" | "blocked";

export function RoleGuard({ role, children }: { role: PenzaRole; children: ReactNode }) {
    const router = useRouter();
    const [guardState, setGuardState] = useState<GuardState>("checking");

    useEffect(() => {
        const activeRole = getActivePenzaRole();

        if (activeRole === role) {
            setGuardState("allowed");
            return;
        }

        const message = `این صفحه برای ${getRoleLabel(role)} است.`;
        window.localStorage.setItem(PENZA_ROLE_GUARD_MESSAGE_KEY, message);
        setGuardState("blocked");
        router.replace("/?access=denied");
    }, [role, router]);

    if (guardState === "allowed") return <>{children}</>;

    return (
        <main className="penza-page">
            <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-5 text-center">
                <div className="penza-card rounded-[1.5rem] p-6 shadow-sm">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0ffe0] text-2xl">🔒</span>
                    <h1 className="mt-4 text-2xl font-black text-[#0B2F0B]">
                        {guardState === "checking" ? "در حال بررسی..." : "دسترسی مجاز نیست"}
                    </h1>
                </div>
            </div>
        </main>
    );
}
