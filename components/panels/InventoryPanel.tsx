"use client";

import { useMemo, useState } from "react";
import { formatDateTime, useCafeStorageStore } from "../../lib/local-store";
import {
    formatAvailableQuantity,
    formatStockQuantity,
    formatUnitConversion,
    getOrderUnit,
    getStockStatus,
    getStockStatusLabel,
    getStockStatusStyle,
    getStockUnit,
} from "../../lib/product-units";
import type { Product, ProductCategory, StockMovementType } from "../../lib/types";
import { PanelNav, type PanelNavLink } from "./PanelNav";

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

function getProduct(productId: string, productList: Product[]) {
    return productList.find((product) => product.id === productId);
}

function categoryLabel(category: ProductCategory) {
    const labels: Record<ProductCategory, string> = {
        coffee: "قهوه",
        dairy: "لبنیات",
        packaging: "بسته‌بندی",
        bakery: "نان و شیرینی",
        syrup: "سیروپ",
        cleaning: "نظافت",
        other: "متفرقه",
    };

    return labels[category];
}

function movementTypeLabel(type: StockMovementType) {
    const labels: Record<StockMovementType, string> = {
        stock_in: "ورود به انبار",
        packed_for_cafe: "آماده‌سازی برای کافه",
        sent_to_cafe: "تحویل درخواست",
        manual_correction: "اصلاح دستی",
        damaged: "کسر از موجودی",
    };

    return labels[type];
}

function movementTypeStyle(type: StockMovementType) {
    if (type === "stock_in") return "bg-[#e0ffe0] text-[#007A00]";
    if (type === "sent_to_cafe") return "bg-[#e0ffe0] text-[#007A00]";
    return "bg-slate-100 text-slate-700";
}

function normalizeText(value: string) {
    return value.trim().toLowerCase();
}

export function InventoryPanel({ navLinks }: { navLinks: PanelNavLink[] }) {
    const { inventoryItems, stockMovements, products } = useCafeStorageStore();
    const [searchTerm, setSearchTerm] = useState("");

    const totalCurrentQuantity = inventoryItems.reduce((sum, item) => sum + item.currentQuantity, 0);
    const stockInCount = stockMovements.filter((movement) => movement.type === "stock_in").length;
    const deliveredCount = stockMovements.filter((movement) => movement.type === "sent_to_cafe").length;
    const zeroStockCount = inventoryItems.filter((item) => item.currentQuantity <= 0).length;
    const lowStockCount = inventoryItems.filter((item) => {
        const tier = getStockStatus(getProduct(item.productId, products), item);
        return tier === "low" || tier === "critical";
    }).length;

    const filteredInventoryItems = useMemo(() => {
        const search = normalizeText(searchTerm);

        if (!search) return inventoryItems;

        return inventoryItems.filter((item) => {
            const product = getProduct(item.productId, products);

            if (!product) return false;

            return (
                normalizeText(product.name).includes(search) ||
                normalizeText(getStockUnit(product)).includes(search) ||
                normalizeText(getOrderUnit(product)).includes(search) ||
                normalizeText(categoryLabel(product.category)).includes(search)
            );
        });
    }, [inventoryItems, products, searchTerm]);

    const cards = [
        { title: "کالاهای انبار", value: inventoryItems.length, description: "تعداد کالاهای ثبت‌شده" },
        { title: "مجموع موجودی", value: totalCurrentQuantity, description: "جمع عددی موجودی فعلی" },
        { title: "ناموجود", value: zeroStockCount, description: "کالاهای با موجودی صفر" },
        { title: "کم‌موجود", value: lowStockCount, description: "زیر حد مجاز تعریف‌شده در انبار" },
        { title: "ورود کالا", value: stockInCount, description: "حرکت‌های ورود ثبت‌شده" },
        { title: "رویدادهای ارسال به کافه", value: deliveredCount, description: "ثبت حرکت‌های تحویل به کافه" },
    ];

    return (
        <main className="penza-page">
            <div className="mx-auto max-w-7xl p-5 lg:p-6">
                <section className="penza-hero p-5 lg:p-7">
                    <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                <span className="penza-live-dot" />
                                Penza · موجودی مدیریت
                            </p>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">
                                موجودی انبار
                            </h1>
                        </div>

                        <PanelNav links={navLinks} />
                    </div>
                </section>

                <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {cards.map((card) => (
                        <div key={card.title} className="penza-card rounded-[1.25rem] p-5">
                            <p className="text-sm font-black text-slate-500">{card.title}</p>
                            <p className="mt-3 text-3xl font-black text-[#0B2F0B]">{formatNumber(card.value)}</p>
                            <p className="mt-1 text-xs font-bold leading-6 text-slate-500">{card.description}</p>
                        </div>
                    ))}
                </section>

                <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_24rem]">
                    <div className="penza-card rounded-[1.5rem] p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <h2 className="text-xl font-black text-[#0B2F0B]">موجودی</h2>
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="h-12 min-w-[16rem] rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                placeholder="جست‌وجوی کالا، واحد یا دسته..."
                            />
                        </div>

                        <div className="mt-4 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[860px] text-right text-sm">
                                <thead className="penza-table-head text-xs font-black">
                                    <tr>
                                        <th className="px-4 py-3">کالا</th>
                                        <th className="px-4 py-3">دسته‌بندی</th>
                                        <th className="px-4 py-3">واحد موجودی</th>
                                        <th className="px-4 py-3">واحد درخواست</th>
                                        <th className="px-4 py-3">موجودی واقعی</th>
                                        <th className="px-4 py-3">قابل درخواست</th>
                                        <th className="px-4 py-3">وضعیت</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {filteredInventoryItems.map((item) => {
                                        const product = getProduct(item.productId, products);
                                        const tier = getStockStatus(product, item);
                                        return (
                                            <tr key={item.id} className="hover:bg-[#f8fff8]">
                                                <td className="px-4 py-3 font-black text-[#0B2F0B]">{product?.name ?? "کالا"}</td>
                                                <td className="px-4 py-3 text-slate-600">{product ? categoryLabel(product.category) : "-"}</td>
                                                <td className="px-4 py-3 text-slate-600">{getStockUnit(product)}</td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    <div>{getOrderUnit(product)}</div>
                                                    <div className="mt-1 text-xs font-bold text-slate-400">{formatUnitConversion(product)}</div>
                                                </td>
                                                <td className="px-4 py-3 font-black text-[#007A00]">{formatStockQuantity(product, item.currentQuantity)}</td>
                                                <td className="px-4 py-3 font-black text-[#0B2F0B]">{formatAvailableQuantity(product, item.currentQuantity)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${getStockStatusStyle(tier)}`}>
                                                        {getStockStatusLabel(tier)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredInventoryItems.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-sm font-bold text-slate-500" colSpan={7}>
                                                کالایی با این جست‌وجو پیدا نشد.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <aside className="penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">گردش کالا</h2>
                        <div className="mt-4 space-y-3">
                            {stockMovements.slice(0, 10).map((movement) => {
                                const product = getProduct(movement.productId, products);

                                return (
                                    <div key={movement.id} className="rounded-2xl bg-[#f8fff8] p-4 text-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-black text-[#0B2F0B]">{product?.name ?? "کالا"}</p>
                                                <p className="mt-1 text-xs font-bold text-slate-500">{formatDateTime(movement.createdAt)} · {movement.createdBy || "کاربر"}</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${movementTypeStyle(movement.type)}`}>
                                                {movementTypeLabel(movement.type)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs font-bold text-slate-500">تعداد: {movement.quantity > 0 ? "+" : ""}{formatStockQuantity(product, movement.quantity)}</p>
                                        <p className="mt-1 text-xs leading-6 text-slate-500">{movement.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    );
}
