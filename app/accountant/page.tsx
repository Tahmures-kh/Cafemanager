"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoleGuard } from "../../components/RoleGuard";
import { PanelNav } from "../../components/panels/PanelNav";
import { logout } from "../../lib/auth-api";
import { ACCOUNTANT_NAV_LINKS } from "../../lib/nav-links";
import { clearActivePenzaRole } from "../../lib/role-session";

export default function AccountantMainPage() {
    const router = useRouter();

    const actionCards = [
        { href: "/accountant/recipes", title: "رسپی‌ها و قیمت‌گذاری", eyebrow: "مواد اولیه و قیمت روز" },
        { href: "/accountant/inventory", title: "موجودی انبار", eyebrow: "مشاهده (بدون امکان ویرایش)" },
        { href: "/accountant/reports", title: "گزارش دوره‌ای", eyebrow: "تحلیل و آمار" },
    ];

    async function handleLogout() {
        await logout();
        clearActivePenzaRole();
        router.push("/");
    }

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
                                <PanelNav links={ACCOUNTANT_NAV_LINKS}>
                                    <button type="button" onClick={handleLogout} className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-red-600 hover:bg-red-50">خروج</button>
                                </PanelNav>
                            </div>
                        </div>
                    </section>

                    <section className="mt-5 grid gap-4 md:grid-cols-3">
                        {actionCards.map((card) => (
                            <Link key={card.href} href={card.href} className="penza-card penza-card-hover rounded-[1.5rem] p-6">
                                <p className="text-sm font-black text-[#007A00]">{card.eyebrow}</p>
                                <h2 className="mt-3 text-2xl font-black text-[#0B2F0B]">{card.title}</h2>
                            </Link>
                        ))}
                    </section>
                </div>
            </main>
        </RoleGuard>
    );
}
