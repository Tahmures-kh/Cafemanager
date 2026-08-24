import type { PanelNavLink } from "../components/panels/PanelNav";

/** Canonical per-role nav-link lists. Every page for a role must use the
 * SAME array (same order), so tabs never reshuffle between pages — the
 * active tab is derived from the URL by PanelNav, never hardcoded here. */

export const MANAGER_NAV_LINKS: PanelNavLink[] = [
    { href: "/manager/dashboard", label: "داشبورد" },
    { href: "/manager/orders", label: "درخواست‌ها" },
    { href: "/manager/inventory", label: "موجودی انبار" },
    { href: "/manager/recipes", label: "رسپی‌ها" },
    { href: "/manager/sales", label: "فروش و تحلیل" },
    { href: "/manager/purchases", label: "خریدهای روزانه" },
    { href: "/manager/reports", label: "گزارش دوره‌ای" },
];

export const STAFF_NAV_LINKS: PanelNavLink[] = [
    { href: "/staff/request", label: "ثبت درخواست" },
    { href: "/staff/dashboard", label: "پیگیری سفارش‌ها" },
];

export const STORAGE_NAV_LINKS: PanelNavLink[] = [
    { href: "/storage/orders", label: "درخواست‌ها" },
    { href: "/storage/dashboard", label: "داشبورد انبار" },
    { href: "/storage/reports", label: "گزارش دوره‌ای" },
];

export const ACCOUNTANT_NAV_LINKS: PanelNavLink[] = [
    { href: "/accountant", label: "داشبورد" },
    { href: "/accountant/recipes", label: "رسپی‌ها و قیمت‌گذاری" },
    { href: "/accountant/inventory", label: "موجودی انبار" },
    { href: "/accountant/reports", label: "گزارش دوره‌ای" },
];

export const ADMIN_NAV_LINKS: PanelNavLink[] = [
    { href: "/admin", label: "داشبورد" },
    { href: "/admin/users", label: "کاربران" },
    { href: "/admin/logs", label: "لاگ فعالیت‌ها" },
    { href: "/admin/sessions", label: "نشست‌های فعال" },
];
