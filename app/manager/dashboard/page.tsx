"use client";

import Link from "next/link";
import { cafes, users } from "../../../lib/mock-data";
import { formatDateTime, useCafeStorageStore } from "../../../lib/local-store";
import { formatStockQuantity, getStockStatus, getStockStatusLabel, getStockStatusStyle } from "../../../lib/product-units";
import type { OrderStatus, Product } from "../../../lib/types";
import { RoleGuard } from "../../../components/RoleGuard";
import { PanelNav } from "../../../components/panels/PanelNav";
import { MANAGER_NAV_LINKS } from "../../../lib/nav-links";

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

function isDeliveredStatus(status: OrderStatus) {
    return status === "sent" || status === "received";
}

function simpleStatusLabel(status: OrderStatus) {
    if (status === "received") return "تحویل تایید شد";
    if (status === "sent") return "تحویل درخواست";
    if (status === "cancelled") return "لغو شده";
    return "درخواست کالا";
}

function isSameDay(isoValue: string, reference: Date) {
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return false;

    return (
        date.getFullYear() === reference.getFullYear() &&
        date.getMonth() === reference.getMonth() &&
        date.getDate() === reference.getDate()
    );
}

export default function ManagerDashboardPage() {
    const { orders, orderItems, inventoryItems, stockMovements, products } = useCafeStorageStore();

    const today = new Date();
    const todayNewOrders = orders.filter((order) => isSameDay(order.createdAt, today));
    const todayDeliveredOrders = orders.filter(
        (order) => isDeliveredStatus(order.status) && isSameDay(order.updatedAt, today)
    );
    const todayStockMovements = stockMovements.filter((movement) => isSameDay(movement.createdAt, today));

    const stockStatusRank: Record<string, number> = { out: 0, critical: 1, low: 2, ok: 3 };
    const allLowStockItems = inventoryItems
        .map((item) => ({ item, product: getProduct(item.productId, products), tier: getStockStatus(getProduct(item.productId, products), item) }))
        .filter(({ tier }) => tier !== "ok")
        .sort((first, second) => stockStatusRank[first.tier] - stockStatusRank[second.tier]);
    const lowStockCount = allLowStockItems.length;
    const lowStockItems = allLowStockItems.slice(0, 6);

    const dailyCards = [
        { label: "درخواست‌های امروز", value: todayNewOrders.length, hint: "درخواست کالای ثبت‌شده امروز" },
        { label: "تحویل‌های امروز", value: todayDeliveredOrders.length, hint: "ارسال یا تایید شده امروز" },
        { label: "گردش کالای امروز", value: todayStockMovements.length, hint: "ثبت ورود/خروج/اصلاح امروز" },
        { label: "کالای کم‌موجود", value: lowStockCount, hint: "زیر حد مجاز تعریف‌شده در انبار" },
    ];

    return (
        <RoleGuard role="manager">
            <main className="penza-page">
            <div className="mx-auto max-w-7xl p-5 lg:p-6">
                <section className="penza-hero p-5 lg:p-7">
                    <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                <span className="penza-live-dot" />
                                Penza · مدیریت
                            </p>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">
                                داشبورد
                            </h1>
                        </div>

                        <PanelNav links={MANAGER_NAV_LINKS} />
                    </div>
                </section>

                <section className="mt-5">
                    <div className="flex items-center gap-2">
                        <span className="penza-live-dot" />
                        <h2 className="text-sm font-black text-[#007A00]">امروز</h2>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {dailyCards.map((card) => (
                            <div key={card.label} className="penza-card rounded-[1.25rem] border-[#00A300]/20 bg-[#f8fff8] p-5">
                                <p className="text-sm font-black text-slate-500">{card.label}</p>
                                <p className="mt-3 text-3xl font-black text-[#0B2F0B]">{formatNumber(card.value)}</p>
                                <p className="mt-1 text-xs font-bold leading-6 text-slate-500">{card.hint}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_24rem]">
                    <div className="penza-card rounded-[1.5rem] p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-xl font-black text-[#0B2F0B]">آخرین درخواست‌ها</h2>
                            <Link href="/manager/orders" className="rounded-2xl border border-green-900/15 bg-white px-4 py-2 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                جزئیات
                            </Link>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[760px] text-right text-sm">
                                <thead className="penza-table-head text-xs font-black">
                                    <tr>
                                        <th className="px-4 py-3">درخواست</th>
                                        <th className="px-4 py-3">کافه</th>
                                        <th className="px-4 py-3">ثبت‌کننده</th>
                                        <th className="px-4 py-3">قلم کالا</th>
                                        <th className="px-4 py-3">وضعیت</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {orders.filter((order) => order.status !== "cancelled").slice(0, 8).map((order) => {
                                        const cafe = getCafe(order.cafeId);
                                        const requestedBy = getUser(order.requestedBy);
                                        const items = orderItems.filter((item) => item.orderId === order.id);

                                        return (
                                            <tr key={order.id} className="hover:bg-[#f8fff8]">
                                                <td className="px-4 py-3 font-black text-[#0B2F0B]">#{order.id.slice(-6)}</td>
                                                <td className="px-4 py-3 text-slate-600">{cafe?.name ?? "کافه"}</td>
                                                <td className="px-4 py-3 text-slate-600">{requestedBy?.name ?? "کاربر"}</td>
                                                <td className="px-4 py-3 text-slate-600">{formatNumber(items.length)}</td>
                                                <td className="px-4 py-3 font-black text-[#007A00]">{simpleStatusLabel(order.status)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <aside className="space-y-5">
                        <div className="penza-card rounded-[1.5rem] p-5">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-black text-[#0B2F0B]">کالاهای کم‌موجود</h2>
                                <Link href="/manager/inventory" className="rounded-2xl border border-green-900/15 bg-white px-3 py-2 text-xs font-black text-[#007A00] hover:bg-[#f2fff2]">
                                    موجودی انبار
                                </Link>
                            </div>
                            <div className="mt-4 space-y-3">
                                {lowStockItems.map(({ item, product, tier }) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-[#f8fff8] p-3 text-sm">
                                        <div>
                                            <p className="font-black text-[#0B2F0B]">{product?.name ?? "کالا"}</p>
                                            <p className="mt-1 text-xs font-bold text-slate-400">{formatStockQuantity(product, item.currentQuantity)}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${getStockStatusStyle(tier)}`}>
                                            {getStockStatusLabel(tier)}
                                        </span>
                                    </div>
                                ))}

                                {lowStockItems.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-green-900/20 bg-white p-5 text-center text-sm font-bold text-slate-500">
                                        همه کالاها در سطح موجودی مناسب هستند.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="penza-card rounded-[1.5rem] p-5">
                            <h2 className="text-xl font-black text-[#0B2F0B]">آخرین گردش کالا</h2>
                            <div className="mt-4 space-y-3">
                                {stockMovements.slice(0, 5).map((movement) => {
                                    const product = getProduct(movement.productId, products);
                                    return (
                                        <div key={movement.id} className="rounded-2xl bg-[#f8fff8] p-3 text-sm">
                                            <p className="font-black text-[#0B2F0B]">{product?.name ?? "کالا"}</p>
                                            <p className="mt-1 text-xs font-bold text-slate-500">{movement.quantity > 0 ? "+" : ""}{formatStockQuantity(product, movement.quantity)} · {formatDateTime(movement.createdAt)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>
                </section>
            </div>
            </main>
        </RoleGuard>
    );
}
