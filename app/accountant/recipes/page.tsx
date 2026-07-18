"use client";

import { RecipesPanel } from "../../../components/panels/RecipesPanel";
import { RoleGuard } from "../../../components/RoleGuard";

const navLinks = [
    { href: "/accountant", label: "داشبورد" },
    { href: "/accountant/inventory", label: "موجودی انبار" },
    { href: "/accountant/reports", label: "گزارش دوره‌ای", primary: true },
];

export default function AccountantRecipesPage() {
    return (
        <RoleGuard role="accountant">
            <RecipesPanel navLinks={navLinks} />
        </RoleGuard>
    );
}
