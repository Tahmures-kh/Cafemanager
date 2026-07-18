"use client";

import { RecipesPanel } from "../../../components/panels/RecipesPanel";
import { RoleGuard } from "../../../components/RoleGuard";

const navLinks = [
    { href: "/manager/dashboard", label: "داشبورد" },
    { href: "/manager/orders", label: "درخواست‌ها" },
    { href: "/manager/inventory", label: "موجودی انبار" },
    { href: "/manager/reports", label: "گزارش دوره‌ای", primary: true },
    { href: "/manager/sales", label: "فروش و تحلیل" },
    { href: "/manager/purchases", label: "خریدهای روزانه" },
];

export default function ManagerRecipesPage() {
    return (
        <RoleGuard role="manager">
            <RecipesPanel navLinks={navLinks} />
        </RoleGuard>
    );
}
