"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RoleGuard } from "../../../components/RoleGuard";
import { fetchActiveSessions, revokeSession, type AdminSession } from "../../../lib/admin-api";
import { formatDateTime } from "../../../lib/local-store";
import { getRoleLabel, type PenzaRole } from "../../../lib/role-session";

export default function AdminSessionsPage() {
    const [sessions, setSessions] = useState<AdminSession[]>([]);

    async function refresh() {
        setSessions(await fetchActiveSessions());
    }

    useEffect(() => {
        refresh();
    }, []);

    async function handleRevoke(session: AdminSession) {
        const confirmed = window.confirm(`نشست «${session.username}» از IP ${session.ip} قطع شود؟`);
        if (!confirmed) return;

        await revokeSession(session.id);
        await refresh();
    }

    return (
        <RoleGuard role="admin">
            <main className="penza-page">
                <div className="mx-auto max-w-7xl p-5 lg:p-6">
                    <section className="penza-hero p-5 lg:p-7">
                        <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                    <span className="penza-live-dot" />
                                    Penza · ادمین
                                </p>
                                <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">نشست‌های فعال</h1>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/admin" className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">داشبورد ادمین</Link>
                                <Link href="/admin/users" className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">کاربران</Link>
                                <Link href="/admin/logs" className="penza-button rounded-2xl px-5 py-3 text-sm font-black">لاگ فعالیت‌ها</Link>
                            </div>
                        </div>
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">نشست‌های فعال ({sessions.length})</h2>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                            هر ردیف یک ورود فعال است (یک کاربر ممکن است چند نشست همزمان داشته باشد).
                        </p>

                        <div className="mt-4 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[860px] text-right text-xs">
                                <thead className="penza-table-head font-black">
                                    <tr>
                                        <th className="px-4 py-3">کاربر</th>
                                        <th className="px-4 py-3">نقش</th>
                                        <th className="px-4 py-3">IP</th>
                                        <th className="px-4 py-3">دستگاه/مرورگر</th>
                                        <th className="px-4 py-3">زمان ورود</th>
                                        <th className="px-4 py-3">انقضا</th>
                                        <th className="px-4 py-3">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {sessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-[#f8fff8]">
                                            <td className="px-4 py-3 font-bold text-[#0B2F0B]">
                                                {session.displayName ?? session.username}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{getRoleLabel(session.role as PenzaRole)}</td>
                                            <td className="px-4 py-3 text-slate-600" dir="ltr">{session.ip}</td>
                                            <td className="px-4 py-3 max-w-xs truncate text-slate-600" dir="ltr" title={session.userAgent}>
                                                {session.userAgent}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{formatDateTime(session.createdAt)}</td>
                                            <td className="px-4 py-3 text-slate-600">{formatDateTime(session.expiresAt)}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevoke(session)}
                                                    className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-black text-red-600"
                                                >
                                                    قطع نشست
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {sessions.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center font-bold text-slate-500" colSpan={7}>نشست فعالی وجود ندارد.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </RoleGuard>
    );
}
