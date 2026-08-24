"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoleGuard } from "../../components/RoleGuard";
import { PanelNav } from "../../components/panels/PanelNav";
import { logout } from "../../lib/auth-api";
import { STAFF_NAV_LINKS } from "../../lib/nav-links";
import { clearActivePenzaRole } from "../../lib/role-session";

const actions = [
    { href: "/staff/request", title: "ثبت درخواست", eyebrow: "شروع شیفت" },
    { href: "/staff/dashboard", title: "پیگیری سفارش‌ها", eyebrow: "وضعیت سفارش" },
];

export default function StaffMainPage() {
    const router = useRouter();

    async function handleLogout() {
        await logout();
        clearActivePenzaRole();
        router.push("/");
    }

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
                                <PanelNav links={STAFF_NAV_LINKS}>
                                    <button type="button" onClick={handleLogout} className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-red-600 hover:bg-red-50">خروج</button>
                                </PanelNav>
                            </div>
                        </div>
                    </section>

                    <section className="mt-5 grid gap-4 md:grid-cols-2">
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
