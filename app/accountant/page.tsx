"use client";

import Link from "next/link";
import { RoleGuard } from "../../components/RoleGuard";
import { PanelNav } from "../../components/panels/PanelNav";
import { ACCOUNTANT_NAV_LINKS } from "../../lib/nav-links";

export default function AccountantMainPage() {
    const actionCards = [
        { href: "/accountant/recipes", title: "رسپی‌ها و قیمت‌گذاری" },
        { href: "/accountant/inventory", title: "موجودی انبار" },
        { href: "/accountant/reports", title: "گزارش دوره‌ای" },
    ];

    return (
        <RoleGuard role="accountant">
            <main className="penza-page">
                <div className="mx-auto max-w-7xl p-5 lg:p-6">
                    <section className="penza-hero p-6 lg:p-8">
                        <div className="relative z-10">
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                <span className="penza-live-dot" />
                                Penza · حسابدار
                            </p>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-4xl">پنل حسابدار</h1>
                            <div className="mt-6">
                                <PanelNav links={ACCOUNTANT_NAV_LINKS} />
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
                </div>
            </main>
        </RoleGuard>
    );
}
