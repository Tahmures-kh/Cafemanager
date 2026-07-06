"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cafes, users } from "../../../lib/mock-data";
import { formatDateTime, useCafeStorageStore } from "../../../lib/local-store";
import { formatOrderQuantity, formatStockQuantity, formatUnitConversion, orderToStockQuantity, stockToOrderQuantity } from "../../../lib/product-units";
import type { CafeOrder, InventoryItem, OrderItem, OrderStatus, Product } from "../../../lib/types";
import { BackButton } from "../../../components/BackButton";
import { RoleGuard } from "../../../components/RoleGuard";
import { SuccessNotice } from "../../../components/SuccessNotice";

type StorageFilter = "requested" | "delivered";

const tabs: Array<{ id: StorageFilter; label: string; description: string }> = [
    { id: "requested", label: "درخواست کالا", description: "درخواست‌هایی که باید آماده و تحویل شوند" },
    { id: "delivered", label: "تحویل درخواست", description: "درخواست‌هایی که از انبار ارسال شده‌اند" },
];

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

function getCafe(cafeId: string) {
    return cafes.find((cafe) => cafe.id === cafeId);
}

function getUser(userId: string) {
    return users.find((user) => user.id === userId);
}

function getProduct(productId: string, productList: Product[]) {
    return productList.find((product) => product.id === productId);
}

function getInventoryItem(productId: string, inventoryItems: InventoryItem[]) {
    return inventoryItems.find((item) => item.productId === productId);
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

function stockStatusLabel(currentStockQuantity: number, requestedStockQuantity: number) {
    if (currentStockQuantity <= 0) return "ناموجود";
    if (currentStockQuantity < requestedStockQuantity) return "کمبود موجودی";
    return "موجود";
}

function stockStatusStyle(currentStockQuantity: number, requestedStockQuantity: number) {
    if (currentStockQuantity <= 0) return "bg-red-50 text-red-700 ring-red-100";
    if (currentStockQuantity < requestedStockQuantity) return "bg-orange-50 text-orange-700 ring-orange-100";
    return "bg-[#e0ffe0] text-[#007A00] ring-[#9ee89e]";
}

function maxPackableQuantity(product: Product | undefined, requestedQuantity: number, currentStockQuantity: number) {
    return Math.min(requestedQuantity, stockToOrderQuantity(product, currentStockQuantity));
}

function getOrderItems(orderId: string, items: OrderItem[]) {
    return items.filter((item) => item.orderId === orderId);
}

function getOrderTotals(orderId: string, items: OrderItem[]) {
    const orderItems = getOrderItems(orderId, items);
    const requested = orderItems.reduce((sum, item) => sum + item.requestedQuantity, 0);
    const packed = orderItems.reduce((sum, item) => sum + item.packedQuantity, 0);
    return { requested, packed, lineCount: orderItems.length };
}

function progressPercent(requested: number, packed: number) {
    if (requested <= 0) return 0;
    return Math.min(100, Math.round((packed / requested) * 100));
}

function filterOrders(orders: CafeOrder[], filter: StorageFilter) {
    return orders.filter((order) => {
        if (order.status === "cancelled") return false;
        if (filter === "delivered") return isDeliveredStatus(order.status);
        return !isDeliveredStatus(order.status);
    });
}

type AggregatedItem = {
    productId: string;
    requested: number;
    packed: number;
    orderCount: number;
};

function getAggregatedItems(orders: CafeOrder[], orderItems: OrderItem[]) {
    const visibleOrderIds = new Set(orders.map((order) => order.id));
    const byProduct = new Map<string, AggregatedItem>();
    const orderIdsByProduct = new Map<string, Set<string>>();

    orderItems
        .filter((item) => visibleOrderIds.has(item.orderId))
        .forEach((item) => {
            const existing = byProduct.get(item.productId) ?? {
                productId: item.productId,
                requested: 0,
                packed: 0,
                orderCount: 0,
            };

            const orderSet = orderIdsByProduct.get(item.productId) ?? new Set<string>();
            orderSet.add(item.orderId);
            orderIdsByProduct.set(item.productId, orderSet);

            byProduct.set(item.productId, {
                ...existing,
                requested: existing.requested + item.requestedQuantity,
                packed: existing.packed + item.packedQuantity,
                orderCount: orderSet.size,
            });
        });

    return [...byProduct.values()].sort((first, second) => {
        const firstRemaining = first.requested - first.packed;
        const secondRemaining = second.requested - second.packed;
        return secondRemaining - firstRemaining;
    });
}

function StorageOrderListItem({
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
    const cafe = getCafe(order.cafeId);
    const requestedBy = getUser(order.requestedBy);
    const totals = getOrderTotals(order.id, items);
    const percent = progressPercent(totals.requested, totals.packed);

    return (
        <button
            type="button"
            onClick={onSelect}
            className={
                selected
                    ? "w-full rounded-2xl border border-[#00A300] bg-[#00A300] px-4 py-3 text-right text-white shadow-md"
                    : "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-right text-stone-950 hover:border-[#007A00]/40 hover:bg-[#f8fff8]"
            }
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-black">{cafe?.name ?? "کافه نامشخص"}</h3>
                        <span className={selected ? "text-xs text-white/60" : "text-xs text-stone-400"}>#{order.id.slice(-6)}</span>
                    </div>
                    <p className={selected ? "mt-1 text-xs text-white/65" : "mt-1 text-xs text-stone-500"}>
                        {requestedBy?.name ?? "نامشخص"} · {formatDateTime(order.updatedAt)}
                    </p>
                </div>

                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${simpleStatusStyle(order.status)}`}>
                    {simpleStatusLabel(order.status)}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className={selected ? "rounded-xl bg-white/10 px-2 py-1.5" : "rounded-xl bg-stone-50 px-2 py-1.5"}>
                    <p className={selected ? "text-white/60" : "text-stone-500"}>قلم</p>
                    <p className="font-black">{formatNumber(totals.lineCount)}</p>
                </div>
                <div className={selected ? "rounded-xl bg-white/10 px-2 py-1.5" : "rounded-xl bg-stone-50 px-2 py-1.5"}>
                    <p className={selected ? "text-white/60" : "text-stone-500"}>درخواستی</p>
                    <p className="font-black">{formatNumber(totals.requested)}</p>
                </div>
                <div className={selected ? "rounded-xl bg-white/10 px-2 py-1.5" : "rounded-xl bg-stone-50 px-2 py-1.5"}>
                    <p className={selected ? "text-white/60" : "text-stone-500"}>آماده</p>
                    <p className="font-black">{formatNumber(totals.packed)}</p>
                </div>
            </div>

            <div className={selected ? "mt-3 h-1.5 rounded-full bg-white/15" : "mt-3 h-1.5 rounded-full bg-stone-100"}>
                <div className={selected ? "h-1.5 rounded-full bg-white" : "h-1.5 rounded-full bg-[#00A300]"} style={{ width: `${percent}%` }} />
            </div>
        </button>
    );
}

function AggregatedRequestList({
    orders,
    orderItems,
    inventoryItems,
    products,
}: {
    orders: CafeOrder[];
    orderItems: OrderItem[];
    inventoryItems: InventoryItem[];
    products: Product[];
}) {
    const aggregatedItems = getAggregatedItems(orders, orderItems);

    return (
        <section className="penza-card rounded-[1.5rem] p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <h2 className="text-xl font-black text-[#0B2F0B]">کالاهای درخواستی</h2>
                <span className="rounded-full bg-[#f2fff2] px-4 py-2 text-sm font-black text-[#007A00]">
                    {formatNumber(aggregatedItems.length)} کالا
                </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                <table className="w-full min-w-[860px] text-right text-sm">
                    <thead className="penza-table-head text-xs font-black">
                        <tr>
                            <th className="px-4 py-3">کالا</th>
                            <th className="px-4 py-3">سفارش</th>
                            <th className="px-4 py-3">درخواستی</th>
                            <th className="px-4 py-3">آماده‌شده</th>
                            <th className="px-4 py-3">مانده</th>
                            <th className="px-4 py-3">موجودی</th>
                            <th className="px-4 py-3">وضعیت</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-green-900/10">
                        {aggregatedItems.map((item) => {
                            const product = getProduct(item.productId, products);
                            const inventoryItem = getInventoryItem(item.productId, inventoryItems);
                            const currentQuantity = inventoryItem?.currentQuantity ?? 0;
                            const requestedStockQuantity = orderToStockQuantity(product, item.requested);
                            const remaining = Math.max(0, item.requested - item.packed);

                            return (
                                <tr key={item.productId} className="hover:bg-[#f8fff8]">
                                    <td className="px-4 py-3 font-black text-[#0B2F0B]">
                                        <div>{product?.name ?? "کالا"}</div>
                                        <div className="mt-1 text-xs font-bold text-slate-400">{product ? formatUnitConversion(product) : ""}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{formatNumber(item.orderCount)}</td>
                                    <td className="px-4 py-3 font-black text-[#0B2F0B]">{formatOrderQuantity(product, item.requested)}</td>
                                    <td className="px-4 py-3 text-slate-600">{formatOrderQuantity(product, item.packed)}</td>
                                    <td className="px-4 py-3 font-black text-[#007A00]">{formatOrderQuantity(product, remaining)}</td>
                                    <td className="px-4 py-3 text-slate-600">{formatStockQuantity(product, currentQuantity)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${stockStatusStyle(currentQuantity, requestedStockQuantity)}`}>
                                            {stockStatusLabel(currentQuantity, requestedStockQuantity)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}

                        {aggregatedItems.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-sm font-bold text-slate-500" colSpan={7}>
                                    کالایی برای نمایش وجود ندارد.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function OrderDetailPanel({
    order,
    items,
    inventoryItems,
    products,
    onPackedQuantityChange,
    onFillRequested,
    onDeliver,
}: {
    order: CafeOrder | null;
    items: OrderItem[];
    inventoryItems: InventoryItem[];
    products: Product[];
    onPackedQuantityChange: (orderItemId: string, packedQuantity: number) => void;
    onFillRequested: (orderId: string) => void;
    onDeliver: (orderId: string) => void;
}) {
    if (!order) {
        return (
            <section className="penza-card rounded-[1.5rem] p-5">
                <div className="rounded-2xl border border-dashed border-green-900/20 bg-[#f8fff8] p-8 text-center text-sm font-bold text-slate-500">
                    یک درخواست را از لیست انتخاب کن.
                </div>
            </section>
        );
    }

    const cafe = getCafe(order.cafeId);
    const requestedBy = getUser(order.requestedBy);
    const totals = getOrderTotals(order.id, items);
    const percent = progressPercent(totals.requested, totals.packed);
    const orderItems = getOrderItems(order.id, items);
    const shortageItems = orderItems
        .map((item) => {
            const product = getProduct(item.productId, products);
            const currentQuantity = getInventoryItem(item.productId, inventoryItems)?.currentQuantity ?? 0;
            const requestedStockQuantity = orderToStockQuantity(product, item.requestedQuantity);
            const shortageQuantity = Math.max(0, requestedStockQuantity - currentQuantity);
            return shortageQuantity > 0 ? { item, product, currentQuantity, shortageQuantity } : null;
        })
        .filter((item): item is { item: OrderItem; product: Product | undefined; currentQuantity: number; shortageQuantity: number } => Boolean(item));
    const isDelivered = isDeliveredStatus(order.status);

    return (
        <section className="penza-card rounded-[1.5rem] p-5">
            <div className="flex flex-col justify-between gap-4 border-b border-green-900/10 pb-4 lg:flex-row lg:items-start">
                <div>
                    <p className="text-sm font-black text-[#007A00]">{cafe?.name ?? "کافه"} · {requestedBy?.name ?? "کاربر"}</p>
                    <h2 className="mt-2 text-2xl font-black text-[#0B2F0B]">درخواست #{order.id.slice(-6)}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                        ثبت: {formatDateTime(order.createdAt)} · آخرین تغییر: {formatDateTime(order.updatedAt)}
                    </p>
                </div>

                <span className={`self-start rounded-full px-4 py-2 text-sm font-black ring-1 ${simpleStatusStyle(order.status)}`}>
                    {simpleStatusLabel(order.status)}
                </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[#f2fff2] p-4">
                    <p className="text-xs font-bold text-slate-500">قلم کالا</p>
                    <p className="mt-2 text-2xl font-black text-[#0B2F0B]">{formatNumber(totals.lineCount)}</p>
                </div>
                <div className="rounded-2xl bg-[#f2fff2] p-4">
                    <p className="text-xs font-bold text-slate-500">درخواستی</p>
                    <p className="mt-2 text-2xl font-black text-[#0B2F0B]">{formatNumber(totals.requested)}</p>
                </div>
                <div className="rounded-2xl bg-[#f2fff2] p-4">
                    <p className="text-xs font-bold text-slate-500">آماده‌شده</p>
                    <p className="mt-2 text-2xl font-black text-[#0B2F0B]">{formatNumber(totals.packed)}</p>
                </div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-green-50">
                <div className="h-2 rounded-full bg-[#00A300]" style={{ width: `${percent}%` }} />
            </div>

            {!isDelivered && (
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => onFillRequested(order.id)}
                        className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]"
                    >
                        آماده‌سازی طبق موجودی
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeliver(order.id)}
                        className="penza-button rounded-2xl px-5 py-3 text-sm font-black"
                    >
                        تحویل درخواست
                    </button>
                </div>
            )}

            {!isDelivered && shortageItems.length > 0 && (
                <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold leading-7 text-orange-800">
                    کمبود موجودی برای {formatNumber(shortageItems.length)} قلم وجود دارد. آماده‌سازی خودکار فقط تا سقف موجودی فعلی انجام می‌شود.
                </div>
            )}

            <div className="mt-5 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                <table className="w-full min-w-[920px] text-right text-sm">
                    <thead className="penza-table-head text-xs font-black">
                        <tr>
                            <th className="px-4 py-3">کالا</th>
                            <th className="px-4 py-3">درخواستی</th>
                            <th className="px-4 py-3">آماده‌شده</th>
                            <th className="px-4 py-3">موجودی</th>
                            <th className="px-4 py-3">مانده</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-green-900/10">
                        {orderItems.map((item) => {
                            const product = getProduct(item.productId, products);
                            const inventoryItem = getInventoryItem(item.productId, inventoryItems);
                            const currentQuantity = inventoryItem?.currentQuantity ?? 0;
                            const requestedStockQuantity = orderToStockQuantity(product, item.requestedQuantity);
                            const packableQuantity = maxPackableQuantity(product, item.requestedQuantity, currentQuantity);
                            const remaining = Math.max(0, item.requestedQuantity - item.packedQuantity);

                            return (
                                <tr key={item.id} className="hover:bg-[#f8fff8]">
                                    <td className="px-4 py-3 font-black text-[#0B2F0B]">
                                        {product?.name ?? "کالا"}
                                        <div className="mt-1 text-xs font-bold text-slate-400">{product ? formatUnitConversion(product) : ""}</div>
                                    </td>
                                    <td className="px-4 py-3 font-black text-[#0B2F0B]">
                                        <div>{formatOrderQuantity(product, item.requestedQuantity)}</div>
                                        <div className="mt-1 text-xs font-bold text-slate-400">= {formatStockQuantity(product, requestedStockQuantity)}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {isDelivered ? (
                                            <span className="font-black text-[#007A00]">{formatOrderQuantity(product, item.packedQuantity)}</span>
                                        ) : (
                                            <>
                                                <input
                                                    value={item.packedQuantity}
                                                    onChange={(event) => onPackedQuantityChange(item.id, Number(event.target.value))}
                                                    className="h-10 w-24 rounded-xl border border-green-900/15 bg-white px-3 text-center text-sm font-black text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                                    inputMode="numeric"
                                                    min={0}
                                                    max={packableQuantity}
                                                />
                                                <p className="mt-1 text-xs font-bold text-slate-400">حداکثر: {formatOrderQuantity(product, packableQuantity)}</p>
                                            </>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ring-1 ${stockStatusStyle(currentQuantity, requestedStockQuantity)}`}>
                                            {formatStockQuantity(product, currentQuantity)} · {stockStatusLabel(currentQuantity, requestedStockQuantity)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-black text-[#007A00]">{formatOrderQuantity(product, remaining)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {order.note && (
                <div className="mt-4 rounded-2xl bg-[#f8fff8] p-4 text-sm font-bold leading-7 text-slate-600">
                    توضیح کافه: {order.note}
                </div>
            )}
        </section>
    );
}

export default function StorageOrdersPage() {
    const {
        orders,
        orderItems,
        inventoryItems,
        products,
        updatePackedQuantity,
        fillRequestedQuantities,
        updateOrderStatus,
        resetStore,
    } = useCafeStorageStore();

    const [activeFilter, setActiveFilter] = useState<StorageFilter>("requested");
    const [deliveredMessage, setDeliveredMessage] = useState<string | null>(null);

    const visibleOrders = useMemo(
        () => filterOrders(orders, activeFilter),
        [orders, activeFilter]
    );

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const selectedOrder =
        visibleOrders.find((order) => order.id === selectedOrderId) ?? visibleOrders[0] ?? null;

    const requestedOrders = orders.filter((order) => !isDeliveredStatus(order.status) && order.status !== "cancelled");
    const notStartedOrders = requestedOrders.filter((order) => getOrderTotals(order.id, orderItems).packed <= 0);

    function handleDeliver(orderId: string) {
        const totals = getOrderTotals(orderId, orderItems);
        const selectedItems = getOrderItems(orderId, orderItems);
        const hasPackableQuantity = selectedItems.some((item) => {
            const product = getProduct(item.productId, products);
            const currentQuantity = getInventoryItem(item.productId, inventoryItems)?.currentQuantity ?? 0;
            return maxPackableQuantity(product, item.requestedQuantity, currentQuantity) > 0;
        });

        if (totals.packed <= 0 && !hasPackableQuantity) {
            window.alert("برای این درخواست هیچ موجودی قابل تحویل وجود ندارد. اول موجودی انبار را اصلاح کن.");
            return;
        }

        if (totals.packed <= 0) {
            fillRequestedQuantities(orderId);
        }

        updateOrderStatus(orderId, "sent", "u4");
        setDeliveredMessage(`تحویل درخواست #${orderId.slice(-6)} با موفقیت ثبت شد.`);
    }

    return (
        <RoleGuard role="storage">
            <main className="penza-page">
            <div className="mx-auto max-w-7xl p-5 lg:p-6">
                <section className="penza-hero p-5 lg:p-7">
                    <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                <span className="penza-live-dot" />
                                Penza · انبار
                            </p>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">
                                درخواست‌ها
                            </h1>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <BackButton />
                            <Link href="/storage/dashboard" className="rounded-2xl border border-green-900/15 bg-white px-4 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                داشبورد انبار
                            </Link>
                            <Link href="/storage/reports" className="rounded-2xl border border-green-900/15 bg-white px-4 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                گزارش دوره‌ای
                            </Link>
                            <button
                                type="button"
                                onClick={resetStore}
                                className="rounded-2xl border border-green-900/15 bg-white px-4 py-3 text-sm font-black text-slate-500 hover:bg-[#f2fff2]"
                            >
                                ریست تست
                            </button>
                        </div>
                    </div>
                </section>

                <section className="mt-5">
                    <div className="penza-card rounded-[1.25rem] p-4">
                        <p className="text-sm font-black text-slate-500">منتظر آماده‌سازی</p>
                        <p className="mt-2 text-3xl font-black text-[#0B2F0B]">{formatNumber(notStartedOrders.length)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">درخواست‌هایی که هنوز هیچ آماده‌سازی برایشان ثبت نشده</p>
                    </div>
                </section>

                {deliveredMessage && (
                    <div className="mt-5">
                        <SuccessNotice message={deliveredMessage} onDismiss={() => setDeliveredMessage(null)} />
                    </div>
                )}

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

                <div className="mt-5">
                    <AggregatedRequestList orders={visibleOrders} orderItems={orderItems} inventoryItems={inventoryItems} products={products} />
                </div>

                <section className="mt-5 grid gap-5 xl:grid-cols-[24rem_1fr]">
                    <aside className="space-y-3">
                        {visibleOrders.map((order) => (
                            <StorageOrderListItem
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

                    <OrderDetailPanel
                        order={selectedOrder}
                        items={orderItems}
                        inventoryItems={inventoryItems}
                        products={products}
                        onPackedQuantityChange={updatePackedQuantity}
                        onFillRequested={fillRequestedQuantities}
                        onDeliver={handleDeliver}
                    />
                </section>
            </div>
            </main>
        </RoleGuard>
    );
}
