"use client";

import Link from "next/link";
import { FilePlus2, PackageSearch } from "lucide-react";
import { RoleGuard } from "../../components/RoleGuard";
import { PanelNav } from "../../components/panels/PanelNav";
import { STAFF_NAV_LINKS } from "../../lib/nav-links";

const actions = [
    { href: "/staff/request", title: "ثبت درخواست", icon: FilePlus2 },
    { href: "/staff/dashboard", title: "پیگیری سفارش‌ها", icon: PackageSearch },
];

export default function StaffMainPage() {
    return (
        <RoleGuard role="staff">
            <main className="penza-page">
                <div className="mx-auto max-w-7xl p-5 lg:p-6">
                    <section className="penza-hero p-6 lg:p-8">
                        <div className="relative z-10">
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                <span className="penza-live-dot" />
                                Penza · کافه
                            </p>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-4xl">پنل کافه</h1>
                            <div className="mt-6">
                                <PanelNav links={STAFF_NAV_LINKS} />
                            </div>
                        </div>
                    </section>

                    <section className="mt-5 grid gap-4 md:grid-cols-2">
                        {actions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="group relative flex min-h-[14rem] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-green-900/10 bg-gradient-to-br from-white to-[#f2fff2] p-8 shadow-[0_10px_30px_rgba(0,80,0,0.06)] transition-all hover:-translate-y-1 hover:border-[#00A300]/30 hover:shadow-[0_20px_45px_rgba(0,120,0,0.15)]"
                            >
                                <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-[#00A300]/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00d65f] to-[#007A00] shadow-md">
                                    <action.icon className="h-6 w-6 text-white" strokeWidth={2.25} />
                                </span>
                                <h2 className="relative z-10 mt-auto text-3xl font-black text-[#0B2F0B]">{action.title}</h2>
                            </Link>
                        ))}
                    </section>
                </div>
            </main>
        </RoleGuard>
    );
}
