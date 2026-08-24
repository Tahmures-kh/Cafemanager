"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getCurrentAccount, type CurrentAccount } from "../../../lib/auth-api";
import { useCafeStorageStore, useFavoriteProducts } from "../../../lib/local-store";
import {
    formatOrderQuantity,
    formatUnitConversion,
    getOrderUnit,
    getStockStatus,
    getStockStatusLabel,
    getStockStatusStyle,
    hasUnitConversion,
    normalizeOrderQuantity,
} from "../../../lib/product-units";
import type { InventoryItem, Product, ProductCategory } from "../../../lib/types";
import { RoleGuard } from "../../../components/RoleGuard";
import { PanelNav } from "../../../components/panels/PanelNav";
import { SuccessNotice } from "../../../components/SuccessNotice";
import { STAFF_NAV_LINKS } from "../../../lib/nav-links";

type CategoryFilter = "all" | ProductCategory;

type SubmittedItem = {
    productId: string;
    quantity: number;
};

type SubmittedOrder = {
    id: string;
    items: SubmittedItem[];
    note: string;
};

const categoryFilters: Array<{ id: CategoryFilter; label: string }> = [
    { id: "all", label: "همه" },
    { id: "coffee", label: "قهوه" },
    { id: "dairy", label: "لبنیات" },
    { id: "packaging", label: "بسته‌بندی" },
    { id: "bakery", label: "نان و شیرینی" },
    { id: "syrup", label: "سیروپ" },
    { id: "cleaning", label: "نظافت" },
    { id: "other", label: "متفرقه" },
];

const quickAmounts = [1, 5, 10];

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
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

function normalizeText(value: string) {
    return value.trim().toLowerCase();
}

function productMatches(product: Product, searchTerm: string, activeCategory: CategoryFilter) {
    const normalizedSearch = normalizeText(searchTerm);
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizeText(product.name).includes(normalizedSearch) ||
        normalizeText(categoryLabel(product.category)).includes(normalizedSearch);

    return matchesCategory && matchesSearch;
}

function stockVisibilityLabel(product: Product, inventoryItem?: InventoryItem) {
    const tier = getStockStatus(product, inventoryItem);
    return tier === "ok" ? "قابل درخواست" : getStockStatusLabel(tier);
}

function stockVisibilityStyle(product: Product, inventoryItem?: InventoryItem) {
    return getStockStatusStyle(getStockStatus(product, inventoryItem));
}

export default function CafeRequestPage() {
    const [account, setAccount] = useState<CurrentAccount | null>(null);
    const { createOrder, products, inventoryItems } = useCafeStorageStore();
    const { favoriteIds, isFavorite, toggleFavorite } = useFavoriteProducts();

    useEffect(() => {
        getCurrentAccount().then(setAccount);
    }, []);

    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [note, setNote] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrder | null>(null);

    const favoriteProducts = useMemo(
        () => favoriteIds
            .map((id) => products.find((product) => product.id === id))
            .filter((product): product is Product => Boolean(product)),
        [favoriteIds, products]
    );

    const filteredProducts = useMemo(
        () =>
            products.filter(
                (product) =>
                    productMatches(product, searchTerm, activeCategory) &&
                    (!favoritesOnly || isFavorite(product.id))
            ),
        [products, searchTerm, activeCategory, favoritesOnly, isFavorite]
    );

    const selectedItems = useMemo(() => {
        return products
            .map((product) => ({
                product,
                quantity: quantities[product.id] ?? 0,
            }))
            .filter((item) => item.quantity > 0);
    }, [products, quantities]);

    const totalSelectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

    function updateQuantity(productId: string, nextValue: number) {
        setSubmittedOrder(null);
        const product = products.find((item) => item.id === productId);
        const safeValue = normalizeOrderQuantity(product, nextValue);

        setQuantities((current) => {
            const next = { ...current };

            if (safeValue <= 0) {
                delete next[productId];
            } else {
                next[productId] = safeValue;
            }

            return next;
        });
    }

    function addQuantity(productId: string, amount: number) {
        updateQuantity(productId, (quantities[productId] ?? 0) + amount);
    }

    function removeItem(productId: string) {
        updateQuantity(productId, 0);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const finalItems: SubmittedItem[] = selectedItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
        }));

        const finalNote = note.trim();

        const createdOrder = await createOrder({
            note: finalNote,
            items: finalItems.map((item) => ({
                productId: item.productId,
                requestedQuantity: item.quantity,
            })),
        });

        if (!createdOrder) return;

        setSubmittedOrder({
            id: createdOrder.id,
            items: finalItems,
            note: finalNote,
        });

        setQuantities({});
        setNote("");
    }

    function clearForm() {
        setQuantities({});
        setNote("");
        setSubmittedOrder(null);
    }

    return (
        <RoleGuard role="staff">
            <main className="penza-page">
            <div className="mx-auto max-w-7xl p-5 lg:p-6">
                <section className="penza-hero p-5 lg:p-7">
                    <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                <span className="penza-live-dot" />
                                Penza · درخواست کالا
                            </p>

                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">
                                ثبت درخواست
                            </h1>

                            <div className="mt-4">
                                <PanelNav links={STAFF_NAV_LINKS} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 rounded-[1.25rem] border border-green-900/10 bg-white p-3 text-center shadow-sm">
                            <div className="rounded-2xl bg-[#f2fff2] px-5 py-3">
                                <p className="text-xs font-bold text-slate-500">قلم کالا</p>
                                <p className="mt-1 text-2xl font-black text-[#0B2F0B]">{formatNumber(selectedItems.length)}</p>
                            </div>
                            <div className="rounded-2xl bg-[#f2fff2] px-5 py-3">
                                <p className="text-xs font-bold text-slate-500">مجموع تعداد</p>
                                <p className="mt-1 text-2xl font-black text-[#0B2F0B]">{formatNumber(totalSelectedQuantity)}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {favoriteProducts.length > 0 && (
                    <section className="penza-card mt-5 rounded-[1.5rem] p-4">
                        <h2 className="text-lg font-black text-[#0B2F0B]">★ کالاهای پرتکرار</h2>

                        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                            {favoriteProducts.map((product) => {
                                const quantity = quantities[product.id] ?? 0;

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => addQuantity(product.id, 1)}
                                        className="flex shrink-0 items-center gap-3 rounded-2xl border border-green-900/10 bg-[#f8fff8] px-4 py-3 text-right hover:bg-[#f2fff2]"
                                    >
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00A300] text-sm font-black text-white">
                                            +1
                                        </span>
                                        <span>
                                            <span className="block text-sm font-black text-[#0B2F0B]">{product.name}</span>
                                            <span className="mt-0.5 block text-xs font-bold text-slate-500">
                                                {quantity > 0 ? `در سبد: ${formatOrderQuantity(product, quantity)}` : getOrderUnit(product)}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                <form onSubmit={handleSubmit} className="mt-5 grid gap-5 lg:grid-cols-[1fr_22rem]">
                    <section className="space-y-4">
                        <div className="penza-card rounded-[1.5rem] p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <h2 className="text-xl font-black text-[#0B2F0B]">انتخاب کالا</h2>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <input
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        className="h-12 min-w-[17rem] rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                        placeholder="جست‌وجوی کالا..."
                                    />

                                    <Link
                                        href="/staff/dashboard"
                                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-green-900/15 bg-white px-4 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]"
                                    >
                                        پیگیری تحویل
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                                <button
                                    type="button"
                                    onClick={() => setFavoritesOnly((current) => !current)}
                                    className={
                                        favoritesOnly
                                            ? "shrink-0 rounded-full bg-[#00A300] px-4 py-2 text-sm font-black text-white shadow-sm"
                                            : "shrink-0 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-[#f2fff2]"
                                    }
                                >
                                    ★ علاقه‌مندی‌ها{favoriteIds.length > 0 ? ` (${formatNumber(favoriteIds.length)})` : ""}
                                </button>
                                {categoryFilters.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => setActiveCategory(category.id)}
                                        className={
                                            activeCategory === category.id
                                                ? "shrink-0 rounded-full bg-[#00A300] px-4 py-2 text-sm font-black text-white shadow-sm"
                                                : "shrink-0 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-[#f2fff2]"
                                        }
                                    >
                                        {category.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {filteredProducts.map((product) => {
                                const quantity = quantities[product.id] ?? 0;
                                const inventoryItem = inventoryItems.find((item) => item.productId === product.id);

                                return (
                                    <div key={product.id} className="penza-card rounded-[1.35rem] p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-black text-[#007A00]">{categoryLabel(product.category)}</p>
                                                <h3 className="mt-1 text-lg font-black text-[#0B2F0B]">{product.name}</h3>
                                                <p className="mt-1 text-sm font-bold text-slate-500">واحد درخواست: {getOrderUnit(product)}</p>
                                                {hasUnitConversion(product) && (
                                                    <p className="mt-1 text-xs font-bold text-slate-400">{formatUnitConversion(product)}</p>
                                                )}
                                                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black ring-1 ${stockVisibilityStyle(product, inventoryItem)}`}>
                                                    {stockVisibilityLabel(product, inventoryItem)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFavorite(product.id)}
                                                    aria-label="افزودن به علاقه‌مندی‌ها"
                                                    className={
                                                        isFavorite(product.id)
                                                            ? "flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff6d8] text-lg text-[#c99a00]"
                                                            : "flex h-9 w-9 items-center justify-center rounded-xl border border-green-900/10 bg-white text-lg text-slate-300 hover:text-[#c99a00]"
                                                    }
                                                >
                                                    {isFavorite(product.id) ? "★" : "☆"}
                                                </button>
                                                <div className={quantity > 0 ? "rounded-2xl bg-[#00A300] px-3 py-2 text-center text-white" : "rounded-2xl bg-[#f2fff2] px-3 py-2 text-center text-[#007A00]"}>
                                                    <p className="text-[10px] font-bold">تعداد</p>
                                                    <p className="text-lg font-black">{formatNumber(quantity)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            {quickAmounts.map((amount) => (
                                                <button
                                                    key={amount}
                                                    type="button"
                                                    onClick={() => addQuantity(product.id, amount)}
                                                    className="rounded-xl bg-[#f2fff2] px-3 py-2 text-sm font-black text-[#007A00] hover:bg-[#e0ffe0]"
                                                >
                                                    +{formatNumber(amount)}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                                className="h-10 w-10 rounded-xl border border-green-900/10 bg-white text-lg font-black text-[#007A00] hover:bg-[#f2fff2]"
                                            >
                                                −
                                            </button>
                                            <input
                                                value={quantity === 0 ? "" : quantity}
                                                onChange={(event) => updateQuantity(product.id, Number(event.target.value))}
                                                className="h-10 min-w-0 flex-1 rounded-xl border border-green-900/15 bg-white px-3 text-center text-sm font-black text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                                placeholder="0"
                                                inputMode="decimal"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(product.id, quantity + 1)}
                                                className="h-10 w-10 rounded-xl border border-green-900/10 bg-white text-lg font-black text-[#007A00] hover:bg-[#f2fff2]"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredProducts.length === 0 && (
                                <div className="col-span-full rounded-2xl border border-dashed border-green-900/20 bg-white p-8 text-center text-sm font-bold text-slate-500">
                                    {favoritesOnly
                                        ? "هنوز کالایی به علاقه‌مندی‌ها اضافه نشده است."
                                        : "کالایی با این جست‌وجو یا دسته پیدا نشد."}
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="lg:sticky lg:top-5 lg:self-start">
                        <div className="penza-card rounded-[1.5rem] p-4">
                            <h2 className="text-xl font-black text-[#0B2F0B]">سبد درخواست</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {account?.displayName ?? account?.username ?? "کاربر"}
                            </p>

                            <div className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto pl-1">
                                {selectedItems.map(({ product, quantity }) => (
                                    <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8fff8] p-3">
                                        <div>
                                            <p className="text-sm font-black text-[#0B2F0B]">{product.name}</p>
                                            <p className="mt-1 text-xs font-bold text-slate-500">{formatOrderQuantity(product, quantity)}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(product.id)}
                                            className="rounded-xl border border-green-900/10 bg-white px-3 py-2 text-xs font-black text-slate-500 hover:bg-[#f2fff2]"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                ))}

                                {selectedItems.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-green-900/20 bg-white p-5 text-center text-sm font-bold text-slate-500">
                                        هنوز کالایی انتخاب نشده است.
                                    </div>
                                )}
                            </div>

                            <label className="mt-4 block text-sm font-black text-[#0B2F0B]" htmlFor="order-note">
                                توضیح اختیاری
                            </label>
                            <textarea
                                id="order-note"
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                className="mt-2 min-h-24 w-full rounded-2xl border border-green-900/15 bg-white p-3 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                placeholder="مثلا برای شیفت عصر، یا توضیح کوتاه برای انبار..."
                            />

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={clearForm}
                                    className="rounded-2xl border border-green-900/15 bg-white px-4 py-3 text-sm font-black text-slate-600 hover:bg-[#f2fff2]"
                                >
                                    پاک کردن
                                </button>
                                <button
                                    type="submit"
                                    disabled={selectedItems.length === 0}
                                    className="penza-button rounded-2xl px-4 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    ثبت درخواست
                                </button>
                            </div>

                            {submittedOrder && (
                                <div className="mt-4">
                                    <SuccessNotice
                                        message={`درخواست #${submittedOrder.id.slice(-6)} ثبت شد و برای انبار ارسال شد.`}
                                        onDismiss={() => setSubmittedOrder(null)}
                                    />
                                </div>
                            )}
                        </div>
                    </aside>
                </form>
            </div>
            </main>
        </RoleGuard>
    );
}
