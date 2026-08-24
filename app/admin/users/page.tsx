"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "../../../components/RoleGuard";
import { PanelNav } from "../../../components/panels/PanelNav";
import { ADMIN_NAV_LINKS } from "../../../lib/nav-links";
import {
    createAccount,
    deleteAccount,
    fetchAccounts,
    updateAccount,
    type AdminAccount,
} from "../../../lib/admin-api";
import { formatDateTime } from "../../../lib/local-store";
import { getRoleLabel, type PenzaRole } from "../../../lib/role-session";

const ROLES: PenzaRole[] = ["admin", "manager", "staff", "storage", "accountant"];

function emptyNewForm() {
    return { username: "", password: "", role: "manager" as PenzaRole, displayName: "" };
}

export default function AdminUsersPage() {
    const [accounts, setAccounts] = useState<AdminAccount[]>([]);
    const [newForm, setNewForm] = useState(emptyNewForm());
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<PenzaRole>("manager");
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editPassword, setEditPassword] = useState("");

    async function refresh() {
        setAccounts(await fetchAccounts());
    }

    useEffect(() => {
        refresh();
    }, []);

    async function handleCreate() {
        setFormError(null);

        if (!newForm.username.trim() || newForm.password.length < 6) {
            setFormError("نام کاربری الزامی است و رمز عبور باید حداقل ۶ کاراکتر باشد.");
            return;
        }

        setSubmitting(true);
        const result = await createAccount({
            username: newForm.username.trim(),
            password: newForm.password,
            role: newForm.role,
            displayName: newForm.displayName.trim() || undefined,
        });
        setSubmitting(false);

        if (!result.ok) {
            setFormError(result.error);
            return;
        }

        setNewForm(emptyNewForm());
        await refresh();
    }

    function openEdit(account: AdminAccount) {
        setEditingId(account.id);
        setEditRole(account.role as PenzaRole);
        setEditDisplayName(account.displayName ?? "");
        setEditPassword("");
    }

    async function handleSaveEdit(accountId: string) {
        await updateAccount(accountId, {
            role: editRole,
            displayName: editDisplayName.trim() || undefined,
            password: editPassword.length >= 6 ? editPassword : undefined,
        });
        setEditingId(null);
        await refresh();
    }

    async function handleToggleActive(account: AdminAccount) {
        await updateAccount(account.id, { isActive: !account.isActive });
        await refresh();
    }

    async function handleDelete(account: AdminAccount) {
        const confirmed = window.confirm(`حذف اکانت «${account.username}»؟ این کار قابل بازگشت نیست.`);
        if (!confirmed) return;

        await deleteAccount(account.id);
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
                                <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">مدیریت کاربران</h1>
                            </div>
                            <PanelNav links={ADMIN_NAV_LINKS} />
                        </div>
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">اکانت جدید</h2>
                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                            <input
                                value={newForm.username}
                                onChange={(event) => setNewForm((current) => ({ ...current, username: event.target.value }))}
                                placeholder="نام کاربری"
                                dir="ltr"
                                className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                            />
                            <input
                                value={newForm.password}
                                onChange={(event) => setNewForm((current) => ({ ...current, password: event.target.value }))}
                                placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                                type="password"
                                dir="ltr"
                                className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                            />
                            <select
                                value={newForm.role}
                                onChange={(event) => setNewForm((current) => ({ ...current, role: event.target.value as PenzaRole }))}
                                className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                            >
                                {ROLES.map((role) => (
                                    <option key={role} value={role}>{getRoleLabel(role)}</option>
                                ))}
                            </select>
                            <input
                                value={newForm.displayName}
                                onChange={(event) => setNewForm((current) => ({ ...current, displayName: event.target.value }))}
                                placeholder="نام نمایشی (اختیاری)"
                                className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                            />
                        </div>
                        {formError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{formError}</p>}
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleCreate}
                            className="penza-button mt-4 rounded-2xl px-5 py-3 text-sm font-black disabled:opacity-50"
                        >
                            {submitting ? "در حال ساخت..." : "+ ساخت اکانت"}
                        </button>
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">اکانت‌ها ({accounts.length})</h2>
                        <div className="mt-4 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[760px] text-right text-sm">
                                <thead className="penza-table-head text-xs font-black">
                                    <tr>
                                        <th className="px-4 py-3">نام کاربری</th>
                                        <th className="px-4 py-3">نقش</th>
                                        <th className="px-4 py-3">نام نمایشی</th>
                                        <th className="px-4 py-3">وضعیت</th>
                                        <th className="px-4 py-3">تاریخ ساخت</th>
                                        <th className="px-4 py-3">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {accounts.map((account) => (
                                        <tr key={account.id} className="hover:bg-[#f8fff8]">
                                            <td className="px-4 py-3 font-black text-[#0B2F0B]" dir="ltr">{account.username}</td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {editingId === account.id ? (
                                                    <select
                                                        value={editRole}
                                                        onChange={(event) => setEditRole(event.target.value as PenzaRole)}
                                                        className="h-10 rounded-xl border border-green-900/15 bg-white px-2 text-xs font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                                    >
                                                        {ROLES.map((role) => (
                                                            <option key={role} value={role}>{getRoleLabel(role)}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    getRoleLabel(account.role as PenzaRole)
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {editingId === account.id ? (
                                                    <input
                                                        value={editDisplayName}
                                                        onChange={(event) => setEditDisplayName(event.target.value)}
                                                        className="h-10 w-32 rounded-xl border border-green-900/15 bg-white px-2 text-xs font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                                    />
                                                ) : (
                                                    account.displayName ?? "-"
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-3 py-1 text-[11px] font-black ${account.isActive ? "bg-[#e0ffe0] text-[#007A00]" : "bg-red-50 text-red-600"}`}>
                                                    {account.isActive ? "فعال" : "غیرفعال"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{formatDateTime(account.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                {editingId === account.id ? (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <input
                                                            value={editPassword}
                                                            onChange={(event) => setEditPassword(event.target.value)}
                                                            placeholder="رمز جدید (اختیاری)"
                                                            type="password"
                                                            dir="ltr"
                                                            className="h-10 w-32 rounded-xl border border-green-900/15 bg-white px-2 text-xs font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                                        />
                                                        <button type="button" onClick={() => handleSaveEdit(account.id)} className="rounded-full bg-[#e0ffe0] px-3 py-1 text-[11px] font-black text-[#007A00]">ذخیره</button>
                                                        <button type="button" onClick={() => setEditingId(null)} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">انصراف</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button type="button" onClick={() => openEdit(account)} className="rounded-full bg-[#e0ffe0] px-3 py-1 text-[11px] font-black text-[#007A00]">ویرایش</button>
                                                        <button type="button" onClick={() => handleToggleActive(account)} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                                                            {account.isActive ? "غیرفعال کردن" : "فعال کردن"}
                                                        </button>
                                                        <button type="button" onClick={() => handleDelete(account)} className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-black text-red-600">حذف</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {accounts.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-sm font-bold text-slate-500" colSpan={6}>هنوز اکانتی وجود ندارد.</td>
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
