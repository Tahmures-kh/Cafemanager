"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "../../../components/RoleGuard";
import { PanelNav } from "../../../components/panels/PanelNav";
import { fetchAuditLog } from "../../../lib/audit-log";
import { formatDateTime } from "../../../lib/local-store";
import { ADMIN_NAV_LINKS } from "../../../lib/nav-links";
import type { AuditLogEntry } from "../../../lib/types";

const SCOPE_LABELS: Record<string, string> = {
    recipes: "رسپی‌ها",
    sales: "فروش",
    purchases: "خریدهای روزانه",
};

export default function AdminLogsPage() {
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [scopeFilter, setScopeFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    async function refresh() {
        setEntries(await fetchAuditLog(""));
    }

    useEffect(() => {
        refresh();
    }, []);

    const scopes = useMemo(() => Array.from(new Set(entries.map((entry) => entry.scope))).sort(), [entries]);

    const filteredEntries = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return entries.filter((entry) => {
            if (scopeFilter && entry.scope !== scopeFilter) return false;
            if (!search) return true;

            return (
                entry.actorName.toLowerCase().includes(search) ||
                entry.action.toLowerCase().includes(search) ||
                entry.description.toLowerCase().includes(search) ||
                entry.ip.toLowerCase().includes(search)
            );
        });
    }, [entries, scopeFilter, searchTerm]);

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
                                <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">لاگ فعالیت‌ها</h1>
                            </div>
                            <PanelNav links={ADMIN_NAV_LINKS} />
                        </div>
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <h2 className="text-xl font-black text-[#0B2F0B]">همه‌ی فعالیت‌ها ({filteredEntries.length})</h2>
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={scopeFilter}
                                    onChange={(event) => setScopeFilter(event.target.value)}
                                    className="h-11 rounded-2xl border border-green-900/15 bg-white px-3 text-xs font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                >
                                    <option value="">همه‌ی بخش‌ها</option>
                                    {scopes.map((scope) => (
                                        <option key={scope} value={scope}>{SCOPE_LABELS[scope] ?? scope}</option>
                                    ))}
                                </select>
                                <input
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="جست‌وجو در کاربر، عملیات، توضیحات یا IP..."
                                    className="h-11 min-w-[16rem] rounded-2xl border border-green-900/15 bg-white px-4 text-right text-xs font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                />
                            </div>
                        </div>

                        <div className="mt-4 overflow-x-auto rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[860px] text-right text-xs">
                                <thead className="penza-table-head font-black">
                                    <tr>
                                        <th className="px-4 py-3">تاریخ و ساعت</th>
                                        <th className="px-4 py-3">بخش</th>
                                        <th className="px-4 py-3">کاربر</th>
                                        <th className="px-4 py-3">عملیات</th>
                                        <th className="px-4 py-3">توضیحات</th>
                                        <th className="px-4 py-3">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {filteredEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-[#f8fff8]">
                                            <td className="px-4 py-3 text-slate-600">{formatDateTime(entry.createdAt)}</td>
                                            <td className="px-4 py-3 text-slate-600">{SCOPE_LABELS[entry.scope] ?? entry.scope}</td>
                                            <td className="px-4 py-3 font-bold text-[#0B2F0B]">{entry.actorName} ({entry.actorRole})</td>
                                            <td className="px-4 py-3 text-slate-600">{entry.action}</td>
                                            <td className="px-4 py-3 text-slate-600">{entry.description}</td>
                                            <td className="px-4 py-3 text-slate-600" dir="ltr">{entry.ip}</td>
                                        </tr>
                                    ))}
                                    {filteredEntries.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center font-bold text-slate-500" colSpan={6}>فعالیتی پیدا نشد.</td>
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
