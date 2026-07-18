"use client";

import { InventoryPanel } from "../../../components/panels/InventoryPanel";
import { RoleGuard } from "../../../components/RoleGuard";

const navLinks = [
    { href: "/manager/dashboard", label: "داشبورد" },
    { href: "/manager/orders", label: "درخواست‌ها" },
    { href: "/manager/reports", label: "گزارش دوره‌ای", primary: true },
    { href: "/manager/recipes", label: "رسپی‌ها" },
    { href: "/manager/sales", label: "فروش و تحلیل" },
    { href: "/manager/purchases", label: "خریدهای روزانه" },
];

export default function ManagerInventoryPage() {
    return (
        <RoleGuard role="manager">
            <InventoryPanel navLinks={navLinks} />
        </RoleGuard>
    );
}
