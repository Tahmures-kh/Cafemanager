"use client";

import Link from "next/link";
import { Calculator, Package, FileBarChart2 } from "lucide-react";
import { RoleGuard } from "../../components/RoleGuard";
import { PanelNav } from "../../components/panels/PanelNav";
import { ACCOUNTANT_NAV_LINKS } from "../../lib/nav-links";

export default function AccountantMainPage() {
    const actionCards = [
        { href: "/accountant/recipes", title: "رسپی‌ها و قیمت‌گذاری", icon: Calculator },
        { href: "/accountant/inventory", title: "موجودی انبار", icon: Package },
        { href: "/accountant/reports", title: "گزارش دوره‌ای", icon: FileBarChart2 },
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
                            <Link
                                key={card.href}
                                href={card.href}
                                className="group relative flex min-h-[13rem] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-green-900/10 bg-gradient-to-br from-white to-[#f2fff2] p-7 shadow-[0_10px_30px_rgba(0,80,0,0.06)] transition-all hover:-translate-y-1 hover:border-[#00A300]/30 hover:shadow-[0_20px_45px_rgba(0,120,0,0.15)]"
                            >
                                <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#00A300]/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                                <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00d65f] to-[#007A00] shadow-md">
                                    <card.icon className="h-5 w-5 text-white" strokeWidth={2.25} />
                                </span>
                                <h2 className="relative z-10 mt-auto text-2xl font-black text-[#0B2F0B]">{card.title}</h2>
                            </Link>
                        ))}
                    </section>
                </div>
            </main>
        </RoleGuard>
    );
}
