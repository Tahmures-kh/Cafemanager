"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cafes, users } from "../lib/mock-data";
import { formatDateTime, useCafeStorageStore } from "../lib/local-store";
import { formatOrderQuantity, formatStockQuantity, getOrderUnit } from "../lib/product-units";
import type { CafeOrder, OrderItem, Product, StockMovementType } from "../lib/types";
import { RoleGuard } from "./RoleGuard";
import { BackButton } from "./BackButton";

type ReportRole = "manager" | "storage";

type TopProduct = {
    product: Product;
    quantity: number;
};

function dateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function todayInputValue() {
    return dateInputValue(new Date());
}

function daysAgoInputValue(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return dateInputValue(date);
}

function monthStartInputValue() {
    const date = new Date();
    date.setDate(1);

    return dateInputValue(date);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

function parseDateRange(startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    return { start, end };
}

function isInsideRange(value: string, start: Date, end: Date) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return false;

    return date >= start && date <= end;
}

function getProduct(productId: string, products: Product[]) {
    return products.find((product) => product.id === productId);
}

function getOrderItems(order: CafeOrder, orderItems: OrderItem[]) {
    return orderItems.filter((item) => item.orderId === order.id);
}

function getCafeName(cafeId: string) {
    return cafes.find((cafe) => cafe.id === cafeId)?.name ?? "Penza";
}

function getUserName(userId: string) {
    return users.find((user) => user.id === userId)?.name ?? "کاربر نامشخص";
}

function movementLabel(type: StockMovementType) {
    const labels: Record<StockMovementType, string> = {
        stock_in: "افزودن موجودی",
        packed_for_cafe: "آماده‌سازی",
        sent_to_cafe: "تحویل درخواست",
        manual_correction: "اصلاح موجودی",
        damaged: "کسر موجودی",
    };

    return labels[type];
}

function orderStatusLabel(status: CafeOrder["status"]) {
    if (status === "sent" || status === "received") return "تحویل درخواست";
    if (status === "cancelled") return "لغو شده";
    return "درخواست کالا";
}

function orderStatusStyle(status: CafeOrder["status"]) {
    if (status === "sent" || status === "received") return "bg-[#e0ffe0] text-[#007A00]";
    if (status === "cancelled") return "bg-zinc-200 text-zinc-700";
    return "bg-green-50 text-[#007A00]";
}

function buildCsv(rows: string[][]) {
    return rows
        .map((row) =>
            row
                .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
                .join(",")
        )
        .join("\n");
}


function escapeHtml(value: string | number) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function buildExcelTable(title: string, rows: Array<Array<string | number>>) {
    const tableRows = rows
        .map((row, rowIndex) => {
            const cellTag = rowIndex === 0 ? "th" : "td";
            return `<tr>${row.map((cell) => `<${cellTag}>${escapeHtml(cell)}</${cellTag}>`).join("")}</tr>`;
        })
        .join("");

    return `<h2>${escapeHtml(title)}</h2><table>${tableRows}</table>`;
}

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}

export function PeriodReport({ role }: { role: ReportRole }) {
    const { orders, orderItems, products, stockMovements } = useCafeStorageStore();
    const [startDate, setStartDate] = useState(daysAgoInputValue(7));
    const [endDate, setEndDate] = useState(todayInputValue());
    const [copied, setCopied] = useState(false);

    const { start, end } = useMemo(() => parseDateRange(startDate, endDate), [startDate, endDate]);

    const filteredOrders = useMemo(
        () => orders.filter((order) => isInsideRange(order.createdAt, start, end)),
        [orders, start, end]
    );

    const filteredMovements = useMemo(
        () => stockMovements.filter((movement) => isInsideRange(movement.createdAt, start, end)),
        [stockMovements, start, end]
    );

    const deliveredOrders = filteredOrders.filter((order) => ["sent", "received"].includes(order.status));
    const receivedOrders = filteredOrders.filter((order) => order.status === "received");

    const filteredOrderItems = filteredOrders.flatMap((order) => getOrderItems(order, orderItems));
    const deliveredOrderItems = deliveredOrders.flatMap((order) => getOrderItems(order, orderItems));

    const totalRequestedQuantity = filteredOrderItems.reduce((sum, item) => sum + item.requestedQuantity, 0);
    const totalDeliveredQuantity = deliveredOrderItems.reduce((sum, item) => sum + item.packedQuantity, 0);

    const topDeliveredProducts = useMemo<TopProduct[]>(() => {
        const totals = new Map<string, number>();

        deliveredOrderItems.forEach((item) => {
            totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.packedQuantity);
        });

        return [...totals.entries()]
            .map(([productId, quantity]) => {
                const product = getProduct(productId, products);
                return product ? { product, quantity } : null;
            })
            .filter((item): item is TopProduct => Boolean(item))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 8);
    }, [deliveredOrderItems, products]);

    const summaryCards = [
        { title: "تعداد درخواست", value: filteredOrders.length, hint: "در بازه انتخابی" },
        { title: "تحویل درخواست", value: deliveredOrders.length, hint: "ارسال یا تایید شده" },
        { title: "تایید دریافت", value: receivedOrders.length, hint: "توسط کافه" },
        { title: "گردش موجودی", value: filteredMovements.length, hint: "افزودن، اصلاح یا تحویل" },
        { title: "مجموع تعداد درخواستی", value: totalRequestedQuantity, hint: "جمع تعداد در قلم‌های درخواستی" },
        { title: "مجموع تعداد تحویل‌شده", value: totalDeliveredQuantity, hint: "جمع تعداد در قلم‌های تحویل‌شده" },
    ];

    const summaryText = [
        `گزارش Penza از ${startDate} تا ${endDate}`,
        `تعداد درخواست: ${filteredOrders.length}`,
        `تحویل درخواست: ${deliveredOrders.length}`,
        `تایید دریافت: ${receivedOrders.length}`,
        `مجموع تعداد درخواستی: ${formatNumber(totalRequestedQuantity)}`,
        `مجموع تعداد تحویل‌شده: ${formatNumber(totalDeliveredQuantity)}`,
        `گردش موجودی: ${filteredMovements.length}`,
    ].join("\n");

    function applyPreset(preset: "today" | "week" | "month") {
        setEndDate(todayInputValue());

        if (preset === "today") {
            setStartDate(todayInputValue());
            return;
        }

        if (preset === "week") {
            setStartDate(daysAgoInputValue(7));
            return;
        }

        setStartDate(monthStartInputValue());
    }

    function reportRows() {
        return [
            ["نوع", "تاریخ", "کافه/کالا", "کاربر", "تعداد", "توضیح"],
            ...filteredOrders.map((order) => [
                orderStatusLabel(order.status),
                formatDateTime(order.createdAt),
                getCafeName(order.cafeId),
                getUserName(order.requestedBy),
                String(getOrderItems(order, orderItems).reduce((sum, item) => sum + item.requestedQuantity, 0)),
                order.note ?? "",
            ]),
            ...filteredMovements.map((movement) => {
                const product = getProduct(movement.productId, products);
                return [
                    movementLabel(movement.type),
                    formatDateTime(movement.createdAt),
                    product?.name ?? "کالای حذف‌شده",
                    getUserName(movement.createdBy),
                    product ? formatStockQuantity(product, movement.quantity) : String(movement.quantity),
                    movement.description,
                ];
            }),
        ];
    }

    async function copySummary() {
        try {
            await navigator.clipboard.writeText(summaryText);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    }

    function exportCsv() {
        const csv = `\ufeff${buildCsv(reportRows())}`;
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, `penza-report-${startDate}-to-${endDate}.csv`);
    }

    function exportExcel() {
        const summaryRows: Array<Array<string | number>> = [
            ["عنوان", "مقدار"],
            ["از تاریخ", startDate],
            ["تا تاریخ", endDate],
            ["تعداد درخواست", filteredOrders.length],
            ["تحویل درخواست", deliveredOrders.length],
            ["تایید دریافت", receivedOrders.length],
            ["مجموع تعداد درخواستی", totalRequestedQuantity],
            ["مجموع تعداد تحویل‌شده", totalDeliveredQuantity],
            ["گردش موجودی", filteredMovements.length],
        ];

        const topProductRows: Array<Array<string | number>> = [
            ["کالا", "واحد درخواست", "تعداد تحویل‌شده"],
            ...topDeliveredProducts.map((item) => [item.product.name, getOrderUnit(item.product), item.quantity]),
        ];

        const html = `
            <html dir="rtl">
                <head>
                    <meta charset="utf-8" />
                    <style>
                        body { font-family: Tahoma, Arial, sans-serif; direction: rtl; }
                        h1 { color: #0B2F0B; }
                        h2 { margin-top: 24px; color: #007A00; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                        th, td { border: 1px solid #b7d7b7; padding: 8px; text-align: right; }
                        th { background: #e0ffe0; color: #0B2F0B; }
                    </style>
                </head>
                <body>
                    <h1>گزارش Penza</h1>
                    ${buildExcelTable("خلاصه", summaryRows)}
                    ${buildExcelTable("بیشترین کالاهای تحویل‌شده", topProductRows)}
                    ${buildExcelTable("درخواست‌ها و گردش موجودی", reportRows())}
                </body>
            </html>
        `;

        const blob = new Blob([`\ufeff${html}`], { type: "application/vnd.ms-excel;charset=utf-8" });
        downloadBlob(blob, `penza-report-${startDate}-to-${endDate}.xls`);
    }

    const workLinks = role === "manager"
        ? [
            { href: "/manager/orders", label: "درخواست‌ها" },
            { href: "/manager/inventory", label: "موجودی انبار" },
        ]
        : [
            { href: "/storage/orders", label: "درخواست‌ها" },
            { href: "/storage/dashboard", label: "داشبورد انبار" },
        ];
    const title = "گزارش";

    return (
        <RoleGuard role={role}>
            <main className="penza-page">
                <div className="mx-auto max-w-7xl p-5 lg:p-6">
                    <section className="penza-hero p-6 lg:p-8">
                        <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                    <span className="penza-live-dot" />
                                    Penza · گزارش دوره‌ای
                                </p>
                                <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">{title}</h1>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <BackButton className="penza-ghost-button rounded-2xl px-4 py-3 text-sm font-black hover:bg-green-50" />
                                {workLinks.map((link) => (
                                    <Link key={link.href} href={link.href} className="rounded-2xl border border-green-900/15 bg-white px-4 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                        {link.label}
                                    </Link>
                                ))}
                                <button type="button" onClick={() => window.print()} className="penza-ghost-button rounded-2xl px-4 py-3 text-sm font-black hover:bg-green-50">
                                    PDF / چاپ
                                </button>
                                <button type="button" onClick={copySummary} className="penza-button rounded-2xl px-4 py-3 text-sm font-black">
                                    {copied ? "کپی شد" : "کپی خلاصه"}
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="penza-card mt-5 rounded-[1.5rem] p-5">
                        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                            <label className="block text-sm font-black text-[#0B2F0B]">
                                از تاریخ
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(event) => setStartDate(event.target.value)}
                                    className="mt-2 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-4 text-sm font-black text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                />
                            </label>
                            <label className="block text-sm font-black text-[#0B2F0B]">
                                تا تاریخ
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(event) => setEndDate(event.target.value)}
                                    className="mt-2 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-4 text-sm font-black text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                />
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={exportExcel} className="penza-button h-12 rounded-2xl px-5 text-sm font-black">
                                    خروجی Excel
                                </button>
                                <button type="button" onClick={exportCsv} className="rounded-2xl border border-green-900/15 bg-white px-5 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                    CSV
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => applyPreset("today")} className="rounded-2xl bg-[#f2fff2] px-4 py-2 text-xs font-black text-[#007A00] hover:bg-[#e0ffe0]">
                                امروز
                            </button>
                            <button type="button" onClick={() => applyPreset("week")} className="rounded-2xl bg-[#f2fff2] px-4 py-2 text-xs font-black text-[#007A00] hover:bg-[#e0ffe0]">
                                7 روز اخیر
                            </button>
                            <button type="button" onClick={() => applyPreset("month")} className="rounded-2xl bg-[#f2fff2] px-4 py-2 text-xs font-black text-[#007A00] hover:bg-[#e0ffe0]">
                                ماه جاری
                            </button>
                        </div>
                    </section>

                    <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {summaryCards.map((card) => (
                            <div key={card.title} className="penza-card rounded-[1.5rem] p-5">
                                <p className="text-sm font-black text-slate-500">{card.title}</p>
                                <p className="mt-2 text-4xl font-black text-[#007A00]">{formatNumber(card.value)}</p>
                                <p className="mt-1 text-xs font-bold text-slate-500">{card.hint}</p>
                            </div>
                        ))}
                    </section>

                    <section className="mt-5">
                        <div className="penza-card rounded-[1.5rem] p-5">
                            <h2 className="text-xl font-black text-[#0B2F0B]">بیشترین کالاهای تحویل‌شده</h2>
                            <div className="mt-4 space-y-2">
                                {topDeliveredProducts.map((item) => (
                                    <div key={item.product.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8fff8] p-3">
                                        <div>
                                            <p className="text-sm font-black text-[#0B2F0B]">{item.product.name}</p>
                                            <p className="mt-1 text-xs font-bold text-slate-500">واحد درخواست: {getOrderUnit(item.product)}</p>
                                        </div>
                                        <p className="text-lg font-black text-[#007A00]">{formatOrderQuantity(item.product, item.quantity)}</p>
                                    </div>
                                ))}
                                {topDeliveredProducts.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-green-900/20 bg-white p-5 text-center text-sm font-bold text-slate-500">
                                        هنوز تحویلی در این بازه ثبت نشده است.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="penza-card mt-5 overflow-hidden rounded-[1.5rem]">
                        <div className="border-b border-green-900/10 p-5">
                            <h2 className="text-xl font-black text-[#0B2F0B]">درخواست‌ها</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-right text-sm">
                                <thead className="bg-[#f2fff2] text-xs font-black text-[#0B2F0B]">
                                    <tr>
                                        <th className="px-4 py-3">تاریخ</th>
                                        <th className="px-4 py-3">کافه</th>
                                        <th className="px-4 py-3">ثبت‌کننده</th>
                                        <th className="px-4 py-3">وضعیت</th>
                                        <th className="px-4 py-3">تعداد درخواستی</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {filteredOrders.map((order) => {
                                        const items = getOrderItems(order, orderItems);
                                        const requestedQuantity = items.reduce((sum, item) => sum + item.requestedQuantity, 0);

                                        return (
                                            <tr key={order.id} className="hover:bg-[#f8fff8]">
                                                <td className="px-4 py-3 font-bold text-slate-600">{formatDateTime(order.createdAt)}</td>
                                                <td className="px-4 py-3 font-black text-[#0B2F0B]">{getCafeName(order.cafeId)}</td>
                                                <td className="px-4 py-3 font-bold text-slate-600">{getUserName(order.requestedBy)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${orderStatusStyle(order.status)}`}>{orderStatusLabel(order.status)}</span>
                                                </td>
                                                <td className="px-4 py-3 font-black text-[#007A00]">{formatNumber(requestedQuantity)}</td>
                                            </tr>
                                        );
                                    })}
                                    {filteredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center font-bold text-slate-500">درخواستی در این بازه وجود ندارد.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="penza-card mt-5 overflow-hidden rounded-[1.5rem]">
                        <div className="border-b border-green-900/10 p-5">
                            <h2 className="text-xl font-black text-[#0B2F0B]">گردش موجودی</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-right text-sm">
                                <thead className="bg-[#f2fff2] text-xs font-black text-[#0B2F0B]">
                                    <tr>
                                        <th className="px-4 py-3">تاریخ</th>
                                        <th className="px-4 py-3">نوع</th>
                                        <th className="px-4 py-3">کالا</th>
                                        <th className="px-4 py-3">تعداد</th>
                                        <th className="px-4 py-3">توضیح</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {filteredMovements.map((movement) => {
                                        const product = getProduct(movement.productId, products);

                                        return (
                                            <tr key={movement.id} className="hover:bg-[#f8fff8]">
                                                <td className="px-4 py-3 font-bold text-slate-600">{formatDateTime(movement.createdAt)}</td>
                                                <td className="px-4 py-3 font-black text-[#0B2F0B]">{movementLabel(movement.type)}</td>
                                                <td className="px-4 py-3 font-bold text-slate-600">{product?.name ?? "کالای حذف‌شده"}</td>
                                                <td className="px-4 py-3 font-black text-[#007A00]">{movement.quantity > 0 ? "+" : ""}{formatStockQuantity(product, movement.quantity)}</td>
                                                <td className="px-4 py-3 font-bold text-slate-500">{movement.description}</td>
                                            </tr>
                                        );
                                    })}
                                    {filteredMovements.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center font-bold text-slate-500">گردش موجودی در این بازه وجود ندارد.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </RoleGuard>
    );
}
