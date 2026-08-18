"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoleGuard } from "../../components/RoleGuard";
import { logout } from "../../lib/auth-api";
import { clearActivePenzaRole } from "../../lib/role-session";

const actions = [
    { href: "/storage/orders", title: "درخواست‌ها", eyebrow: "لیست اصلی کار" },
    { href: "/storage/dashboard", title: "داشبورد انبار", eyebrow: "نمای روزانه" },
    { href: "/storage/reports", title: "گزارش انبار", eyebrow: "گزارش دوره‌ای" },
];

export default function StorageMainPage() {
    const router = useRouter();

    async function handleLogout() {
        await logout();
        clearActivePenzaRole();
        router.push("/");
    }

    return (
        <RoleGuard role="storage">
            <main className="penza-page">
                <div className="mx-auto max-w-7xl p-5 lg:p-6">
                    <section className="penza-hero p-6 lg:p-8">
                        <div className="relative z-10">
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                <span className="penza-live-dot" />
                                Penza · انبار
                            </p>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-4xl">پنل انبار</h1>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link href="/storage/orders" className="penza-button rounded-2xl px-5 py-3 text-sm font-black">درخواست‌ها</Link>
                                <Link href="/storage/dashboard" className="penza-ghost-button rounded-2xl px-5 py-3 text-sm font-black hover:bg-green-50">داشبورد انبار</Link>
                                <Link href="/storage/reports" className="penza-ghost-button rounded-2xl px-5 py-3 text-sm font-black hover:bg-green-50">گزارش</Link>
                                <button type="button" onClick={handleLogout} className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-red-600 hover:bg-red-50">خروج</button>
                            </div>
                        </div>
                    </section>

                    <section className="mt-5 grid gap-4 md:grid-cols-3">
                        {actions.map((action) => (
                            <Link key={action.href} href={action.href} className="penza-card penza-card-hover rounded-[1.5rem] p-6">
                                <p className="text-sm font-black text-[#007A00]">{action.eyebrow}</p>
                                <h2 className="mt-3 text-2xl font-black text-[#0B2F0B]">{action.title}</h2>
                            </Link>
                        ))}
                    </section>
                </div>
            </main>
        </RoleGuard>
    );
}
