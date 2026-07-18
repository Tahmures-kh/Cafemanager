"use client";

import { InventoryPanel } from "../../../components/panels/InventoryPanel";
import { RoleGuard } from "../../../components/RoleGuard";

const navLinks = [
    { href: "/accountant", label: "داشبورد" },
    { href: "/accountant/recipes", label: "رسپی‌ها" },
    { href: "/accountant/reports", label: "گزارش دوره‌ای", primary: true },
];

export default function AccountantInventoryPage() {
    return (
        <RoleGuard role="accountant">
            <InventoryPanel navLinks={navLinks} />
        </RoleGuard>
    );
}
