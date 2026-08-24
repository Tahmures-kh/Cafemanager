"use client";

import { useMemo, useState } from "react";
import { formatDateTime, useCafeStorageStore } from "../../../lib/local-store";
import { formatOrderQuantity, formatStockQuantity, orderToStockQuantity } from "../../../lib/product-units";
import type { CafeOrder, OrderItem, OrderStatus, Product } from "../../../lib/types";
import { RoleGuard } from "../../../components/RoleGuard";
import { PanelNav } from "../../../components/panels/PanelNav";
import { MANAGER_NAV_LINKS } from "../../../lib/nav-links";

type ManagerFilter = "requested" | "delivered";

const tabs: Array<{ id: ManagerFilter; label: string; description: string }> = [
    { id: "requested", label: "درخواست کالا", description: "سفارش‌هایی که هنوز تحویل نشده‌اند" },
    { id: "delivered", label: "تحویل درخواست", description: "سفارش‌هایی که از انبار ارسال شده‌اند" },
];

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

function getProduct(productId: string, productList: Product[]) {
    return productList.find((product) => product.id === productId);
}

function isDeliveredStatus(status: OrderStatus) {
    return status === "sent" || status === "received";
}

function simpleStatusLabel(status: OrderStatus) {
    if (status === "received") return "تحویل تایید شد";
    if (status === "sent") return "تحویل درخواست";
    if (status === "cancelled") return "لغو شده";
    return "درخواست کالا";
}

function simpleStatusStyle(status: OrderStatus) {
    if (isDeliveredStatus(status)) return "bg-[#e0ffe0] text-[#007A00] ring-[#9ee89e]";
    if (status === "cancelled") return "bg-zinc-200 text-zinc-700 ring-zinc-300";
    return "bg-green-50 text-[#007A00] ring-green-100";
}

function getItems(orderId: string, items: OrderItem[]) {
    return items.filter((item) => item.orderId === orderId);
}

function getTotals(orderId: string, items: OrderItem[]) {
    const orderItems = getItems(orderId, items);
    const requested = orderItems.reduce((sum, item) => sum + item.requestedQuantity, 0);
    const packed = orderItems.reduce((sum, item) => sum + item.packedQuantity, 0);
    return { requested, packed, count: orderItems.length };
}

function progressPercent(requested: number, packed: number) {
    if (requested <= 0) return 0;
    return Math.min(100, Math.round((packed / requested) * 100));
}

function filterOrders(orders: CafeOrder[], filter: ManagerFilter) {
    return orders.filter((order) => {
        if (order.status === "cancelled") return false;
        if (filter === "delivered") return isDeliveredStatus(order.status);
        return !isDeliveredStatus(order.status);
    });
}

function ManagerOrderCard({
    order,
    items,
    selected,
    onSelect,
}: {
    order: CafeOrder;
    items: OrderItem[];
    selected: boolean;
    onSelect: () => void;
}) {
    const totals = getTotals(order.id, items);
    const percent = progressPercent(totals.requested, totals.packed);

    return (
        <button
            type="button"
            onClick={onSelect}
            className={
                selected
                    ? "w-full rounded-2xl border border-[#00A300] bg-[#00A300] px-4 py-3 text-right text-white shadow-md"
                    : "w-full rounded-2xl border border-green-900/10 bg-white px-4 py-3 text-right text-[#0B2F0B] shadow-sm hover:border-[#00A300]/40 hover:bg-[#f8fff8]"
            }
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-black">{order.requestedBy}</h3>
                    <p className={selected ? "mt-1 text-xs text-white/70" : "mt-1 text-xs text-slate-500"}>
                        درخواست #{order.id.slice(-6)} · {formatDateTime(order.updatedAt)}
                    </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${simpleStatusStyle(order.status)}`}>
                    {simpleStatusLabel(order.status)}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className={selected ? "rounded-xl bg-white/10 px-2 py-1.5" : "rounded-xl bg-[#f8fff8] px-2 py-1.5"}>
                    <p className={selected ? "text-white/60" : "text-slate-500"}>قلم</p>
                    <p className="font-black">{formatNumber(totals.count)}</p>
                </div>
                <div className={selected ? "rounded-xl bg-white/10 px-2 py-1.5" : "rounded-xl bg-[#f8fff8] px-2 py-1.5"}>
                    <p className={selected ? "text-white/60" : "text-slate-500"}>درخواستی</p>
                    <p className="font-black">{formatNumber(totals.requested)}</p>
                </div>
                <div className={selected ? "rounded-xl bg-white/10 px-2 py-1.5" : "rounded-xl bg-[#f8fff8] px-2 py-1.5"}>
                    <p className={selected ? "text-white/60" : "text-slate-500"}>آماده</p>
                    <p className="font-black">{formatNumber(totals.packed)}</p>
                </div>
            </div>

            <div className={selected ? "mt-3 h-1.5 rounded-full bg-white/15" : "mt-3 h-1.5 rounded-full bg-green-50"}>
                <div className={selected ? "h-1.5 rounded-full bg-white" : "h-1.5 rounded-full bg-[#00A300]"} style={{ width: `${percent}%` }} />
            </div>
        </button>
    );
}

export default function ManagerOrdersPage() {
    const { orders, orderItems, products } = useCafeStorageStore();
    const [activeFilter, setActiveFilter] = useState<ManagerFilter>("requested");

    const visibleOrders = useMemo(() => filterOrders(orders, activeFilter), [orders, activeFilter]);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const selectedOrder = visibleOrders.find((order) => order.id === selectedOrderId) ?? visibleOrders[0] ?? null;
    const selectedItems = selectedOrder ? getItems(selectedOrder.id, orderItems) : [];
    const selectedTotals = selectedOrder ? getTotals(selectedOrder.id, orderItems) : { requested: 0, packed: 0, count: 0 };

    return (
        <RoleGuard role="manager">
            <main className="penza-page">
            <div className="mx-auto max-w-7xl p-5 lg:p-6">
                <section className="penza-hero p-5 lg:p-7">
                    <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                <span className="penza-live-dot" />
                                Penza · مدیریت درخواست‌ها
                            </p>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">
                                درخواست‌ها
                            </h1>
                        </div>

                        <PanelNav links={MANAGER_NAV_LINKS} />
                    </div>
                </section>

                <div className="mt-5 grid gap-2 md:grid-cols-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveFilter(tab.id)}
                            className={
                                activeFilter === tab.id
                                    ? "rounded-2xl bg-[#00A300] px-5 py-4 text-right text-white shadow-sm"
                                    : "rounded-2xl border border-green-900/10 bg-white px-5 py-4 text-right text-[#0B2F0B] hover:bg-[#f2fff2]"
                            }
                        >
                            <span className="block text-base font-black">{tab.label}</span>
                            <span className={activeFilter === tab.id ? "mt-1 block text-xs font-bold text-white/70" : "mt-1 block text-xs font-bold text-slate-500"}>{tab.description}</span>
                        </button>
                    ))}
                </div>

                <section className="mt-5 grid gap-5 xl:grid-cols-[23rem_1fr]">
                    <aside className="space-y-3">
                        {visibleOrders.map((order) => (
                            <ManagerOrderCard
                                key={order.id}
                                order={order}
                                items={orderItems}
                                selected={selectedOrder?.id === order.id}
                                onSelect={() => setSelectedOrderId(order.id)}
                            />
                        ))}

                        {visibleOrders.length === 0 && (
                            <div className="rounded-[1.25rem] border border-dashed border-green-900/20 bg-white p-5 text-center text-sm font-bold text-slate-500">
                                سفارشی در این بخش وجود ندارد.
                            </div>
                        )}
                    </aside>

                    <section className="penza-card rounded-[1.5rem] p-5">
                        {!selectedOrder && (
                            <div className="rounded-2xl border border-dashed border-green-900/20 bg-[#f8fff8] p-8 text-center text-sm font-bold text-slate-500">
                                سفارشی برای نمایش انتخاب نشده است.
                            </div>
                        )}

                        {selectedOrder && (
                            <>
                                <div className="flex flex-col justify-between gap-4 border-b border-green-900/10 pb-4 lg:flex-row lg:items-start">
                                    <div>
                                        <p className="text-sm font-black text-[#007A00]">
                                            {selectedOrder.requestedBy}
                                        </p>
                                        <h2 className="mt-2 text-2xl font-black text-[#0B2F0B]">درخواست #{selectedOrder.id.slice(-6)}</h2>
                                        <p className="mt-2 text-sm leading-7 text-slate-500">
                                            ثبت: {formatDateTime(selectedOrder.createdAt)} · آخرین تغییر: {formatDateTime(selectedOrder.updatedAt)}
                                        </p>
                                    </div>

                                    <span className={`self-start rounded-full px-4 py-2 text-sm font-black ring-1 ${simpleStatusStyle(selectedOrder.status)}`}>
                                        {simpleStatusLabel(selectedOrder.status)}
                                    </span>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-2xl bg-[#f2fff2] p-4">
                                        <p className="text-xs font-bold text-slate-500">تعداد قلم</p>
                                        <p className="mt-2 text-2xl font-black text-[#0B2F0B]">{formatNumber(selectedTotals.count)}</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#f2fff2] p-4">
                                        <p className="text-xs font-bold text-slate-500">درخواستی</p>
                                        <p className="mt-2 text-2xl font-black text-[#0B2F0B]">{formatNumber(selectedTotals.requested)}</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#f2fff2] p-4">
                                        <p className="text-xs font-bold text-slate-500">آماده‌شده</p>
                                        <p className="mt-2 text-2xl font-black text-[#0B2F0B]">{formatNumber(selectedTotals.packed)}</p>
                                    </div>
                                </div>

                                <div className="mt-5 overflow-x-auto rounded-2xl border border-green-900/10">
                                    <table className="w-full min-w-[620px] text-right text-sm">
                                        <thead className="penza-table-head text-xs font-black">
                                            <tr>
                                                <th className="px-4 py-3">کالا</th>
                                                <th className="px-4 py-3">درخواستی</th>
                                                <th className="px-4 py-3">آماده‌شده</th>
                                                <th className="px-4 py-3">مانده</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-green-900/10">
                                            {selectedItems.map((item) => {
                                                const product = getProduct(item.productId, products);
                                                const remaining = Math.max(0, item.requestedQuantity - item.packedQuantity);
                                                return (
                                                    <tr key={item.id} className="hover:bg-[#f8fff8]">
                                                        <td className="px-4 py-3 font-black text-[#0B2F0B]">{product?.name ?? "کالا"}</td>
                                                        <td className="px-4 py-3 text-slate-600">
                                                            <div>{formatOrderQuantity(product, item.requestedQuantity)}</div>
                                                            <div className="mt-1 text-xs font-bold text-slate-400">= {formatStockQuantity(product, orderToStockQuantity(product, item.requestedQuantity))}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{formatOrderQuantity(product, item.packedQuantity)}</td>
                                                        <td className="px-4 py-3 font-black text-[#007A00]">{formatOrderQuantity(product, remaining)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {selectedOrder.note && (
                                    <div className="mt-4 rounded-2xl bg-[#f8fff8] p-4 text-sm font-bold leading-7 text-slate-600">
                                        توضیح کافه: {selectedOrder.note}
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </section>
            </div>
            </main>
        </RoleGuard>
    );
}
