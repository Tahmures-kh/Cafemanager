"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAccount, logout, type CurrentAccount } from "../lib/auth-api";
import { clearActivePenzaRole, getRoleLabel } from "../lib/role-session";

/** Global top bar shown on every logged-in page: a read-only profile
 * summary and a single logout entry point, so every page behaves the
 * same way instead of each page wiring its own (inconsistent) logout
 * button. Renders nothing when no session is active (e.g. login page). */
export function AccountMenu() {
    const router = useRouter();
    const [account, setAccount] = useState<CurrentAccount | null>(null);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getCurrentAccount().then(setAccount);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    async function handleLogout() {
        await logout();
        clearActivePenzaRole();
        router.push("/");
    }

    if (!account) return null;

    return (
        <div className="flex justify-end gap-2 px-4 py-2 lg:px-6">
            <div className="relative" ref={containerRef}>
                <button
                    type="button"
                    onClick={() => setOpen((current) => !current)}
                    className="rounded-2xl border border-green-900/15 bg-white px-4 py-2 text-xs font-black text-[#007A00] hover:bg-[#f2fff2]"
                >
                    پروفایل
                </button>

                {open && (
                    <div className="absolute left-0 z-50 mt-2 w-64 rounded-2xl border border-green-900/10 bg-white p-4 shadow-lg">
                        <p className="text-sm font-black text-[#0B2F0B]">{account.displayName ?? account.username}</p>
                        <div className="mt-3 space-y-2 text-xs font-bold text-slate-500">
                            <div className="flex items-center justify-between">
                                <span>نام کاربری</span>
                                <span dir="ltr" className="text-[#0B2F0B]">{account.username}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>نقش</span>
                                <span className="text-[#0B2F0B]">{getRoleLabel(account.role)}</span>
                            </div>
                        </div>
                        <p className="mt-3 border-t border-green-900/10 pt-3 text-[11px] font-bold leading-5 text-slate-400">
                            برای تغییر این اطلاعات با مدیر سیستم تماس بگیرید.
                        </p>
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-green-900/15 bg-white px-4 py-2 text-xs font-black text-red-600 hover:bg-red-50"
            >
                خروج
            </button>
        </div>
    );
}
