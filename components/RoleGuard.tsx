"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAccount } from "../lib/auth-api";
import { PENZA_ROLE_GUARD_MESSAGE_KEY, getRoleLabel, setActivePenzaRole, type PenzaRole } from "../lib/role-session";

type GuardState = "checking" | "allowed" | "blocked";

export function RoleGuard({ role, children }: { role: PenzaRole | PenzaRole[]; children: ReactNode }) {
    const router = useRouter();
    const [guardState, setGuardState] = useState<GuardState>("checking");

    const allowedRoles = Array.isArray(role) ? role : [role];

    useEffect(() => {
        let cancelled = false;

        getCurrentAccount().then((account) => {
            if (cancelled) return;

            const demoBypass = account?.role === "demo" && !allowedRoles.includes("admin");

            if (account && (allowedRoles.includes(account.role) || account.role === "admin" || demoBypass)) {
                setActivePenzaRole(account.role);
                setGuardState("allowed");
                return;
            }

            const message = `این صفحه برای ${allowedRoles.map(getRoleLabel).join(" یا ")} است.`;
            window.localStorage.setItem(PENZA_ROLE_GUARD_MESSAGE_KEY, message);
            setGuardState("blocked");
            router.replace("/?access=denied");
        });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowedRoles.join(","), router]);

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
