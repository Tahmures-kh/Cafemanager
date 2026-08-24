"use client";

import Link from "next/link";
import { RoleGuard } from "../../components/RoleGuard";
import { PanelNav } from "../../components/panels/PanelNav";
import { MANAGER_NAV_LINKS } from "../../lib/nav-links";

export default function ManagerMainPage() {
    const actionCards = [
        { href: "/manager/dashboard", title: "داشبورد" },
        { href: "/manager/orders", title: "درخواست‌ها" },
        { href: "/manager/inventory", title: "موجودی انبار" },
        { href: "/manager/recipes", title: "رسپی‌ها" },
        { href: "/manager/sales", title: "فروش و تحلیل" },
        { href: "/manager/purchases", title: "خریدهای روزانه" },
    ];

    return (
        <RoleGuard role="manager">
            <main className="penza-page">
                <div className="mx-auto max-w-7xl p-5 lg:p-6">
                    <section className="penza-hero p-6 lg:p-8">
                        <div className="relative z-10">
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm"><span className="penza-live-dot" />Penza · مدیر</p>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-4xl">داشبورد مدیر</h1>
                            <div className="mt-6">
                                <PanelNav links={MANAGER_NAV_LINKS} />
                            </div>
                        </div>
                    </section>

                    <section className="mt-5 grid gap-4 md:grid-cols-3">
                        {actionCards.map((card) => (
                            <Link key={card.href} href={card.href} className="penza-card penza-card-hover rounded-[1.5rem] p-6">
                                <h2 className="text-2xl font-black text-[#0B2F0B]">{card.title}</h2>
                            </Link>
                        ))}
                    </section>

                    <section className="mt-5">
                        <div className="penza-card rounded-[1.5rem] p-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-black text-[#0B2F0B]">گزارش</h2>
                                <Link href="/manager/reports" className="rounded-full bg-[#00A300] px-3 py-1 text-xs font-black text-white">مشاهده</Link>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </RoleGuard>
    );
}
