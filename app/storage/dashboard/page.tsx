"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { formatDateTime, useCafeStorageStore, useUnitTypes } from "../../../lib/local-store";
import { fetchLowStockThreshold, updateLowStockThreshold } from "../../../lib/storage-api";
import {
    formatAvailableQuantity,
    formatStockQuantity,
    formatUnitConversion,
    getOrderUnit,
    getStockStatus,
    getStockStatusLabel,
    getStockStatusStyle,
    getStockUnit,
} from "../../../lib/product-units";
import type { Product, ProductCategory, StockMovement, StockMovementType } from "../../../lib/types";
import { RoleGuard } from "../../../components/RoleGuard";
import { PanelNav } from "../../../components/panels/PanelNav";
import { SuccessNotice } from "../../../components/SuccessNotice";
import { STORAGE_NAV_LINKS } from "../../../lib/nav-links";

const categoryOptions: Array<{ id: ProductCategory; label: string }> = [
    { id: "coffee", label: "قهوه" },
    { id: "dairy", label: "لبنیات" },
    { id: "packaging", label: "بسته‌بندی" },
    { id: "bakery", label: "نان و شیرینی" },
    { id: "syrup", label: "سیروپ" },
    { id: "cleaning", label: "نظافت" },
    { id: "other", label: "متفرقه" },
];

type CategoryFilter = ProductCategory | "all";
type SortMode = "recent" | "name" | "quantity-high" | "quantity-low";

type StockFormState = {
    name: string;
    category: ProductCategory;
    unit: string;
    orderUnit: string;
    orderUnitQuantity: string;
    orderQuantityStep: string;
    currentQuantity: string;
};

type QuickAdjustState = {
    productId: string | null;
    mode: "add" | "subtract";
    amount: string;
    reason: string;
};

type EditFormState = {
    productId: string | null;
    name: string;
    category: ProductCategory;
    unit: string;
    orderUnit: string;
    orderUnitQuantity: string;
    orderQuantityStep: string;
};

const emptyEditForm: EditFormState = {
    productId: null,
    name: "",
    category: "other",
    unit: "",
    orderUnit: "",
    orderUnitQuantity: "1",
    orderQuantityStep: "1",
};

const emptyForm: StockFormState = {
    name: "",
    category: "other",
    unit: "عدد",
    orderUnit: "عدد",
    orderUnitQuantity: "1",
    orderQuantityStep: "0.001",
    currentQuantity: "0",
};

const emptyQuickAdjust: QuickAdjustState = {
    productId: null,
    mode: "add",
    amount: "1",
    reason: "",
};

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

function normalizeText(value: string) {
    return value.trim().toLowerCase();
}

function categoryLabel(category: ProductCategory) {
    return categoryOptions.find((item) => item.id === category)?.label ?? "متفرقه";
}

function movementTypeLabel(type: StockMovementType) {
    const labels: Record<StockMovementType, string> = {
        stock_in: "افزودن موجودی",
        packed_for_cafe: "آماده‌سازی",
        sent_to_cafe: "تحویل درخواست",
        manual_correction: "ویرایش موجودی",
        damaged: "کسر موجودی",
    };

    return labels[type];
}

function movementTimestamp(movement?: StockMovement) {
    if (!movement) return 0;

    const timestamp = new Date(movement.createdAt).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function movementQuantityLabel(quantity: number) {
    const sign = quantity > 0 ? "+" : "";
    return `${sign}${formatNumber(quantity)}`;
}

const NEW_UNIT_TYPE_VALUE = "__new__";

function UnitTypeField({
    label,
    value,
    unitTypes,
    onChange,
    onAddUnitType,
}: {
    label: string;
    value: string;
    unitTypes: string[];
    onChange: (value: string) => void;
    onAddUnitType: (value: string) => void;
}) {
    const [addingNew, setAddingNew] = useState(false);
    const [newValue, setNewValue] = useState("");

    function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
        if (event.target.value === NEW_UNIT_TYPE_VALUE) {
            setAddingNew(true);
            setNewValue("");
            return;
        }

        onChange(event.target.value);
    }

    function confirmNewValue() {
        const trimmed = newValue.trim();
        if (!trimmed) return;

        onAddUnitType(trimmed);
        onChange(trimmed);
        setAddingNew(false);
        setNewValue("");
    }

    return (
        <div>
            <label className="block text-sm font-black text-[#0B2F0B]">{label}</label>
            {addingNew ? (
                <div className="mt-2 flex gap-2">
                    <input
                        value={newValue}
                        onChange={(event) => setNewValue(event.target.value)}
                        autoFocus
                        className="h-12 w-full rounded-2xl border border-green-900/15 bg-white px-3 text-right text-sm font-bold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                        placeholder="نوع واحد جدید"
                    />
                    <button
                        type="button"
                        onClick={confirmNewValue}
                        className="h-12 shrink-0 rounded-2xl bg-[#00A300] px-4 text-sm font-black text-white"
                    >
                        افزودن
                    </button>
                </div>
            ) : (
                <select
                    value={value}
                    onChange={handleSelectChange}
                    className="mt-2 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-3 text-sm font-bold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                >
                    {!unitTypes.includes(value) && value && <option value={value}>{value}</option>}
                    {unitTypes.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                    ))}
                    <option value={NEW_UNIT_TYPE_VALUE}>+ نوع جدید</option>
                </select>
            )}
        </div>
    );
}

export default function StorageDashboardPage() {
    const {
        products,
        inventoryItems,
        stockMovements,
        addInventoryProduct,
        updateInventoryProduct,
        adjustInventoryQuantity,
        removeInventoryProduct,
    } = useCafeStorageStore();
    const { unitTypes, addUnitType } = useUnitTypes();

    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
    const [sortMode, setSortMode] = useState<SortMode>("recent");
    const [form, setForm] = useState<StockFormState>(emptyForm);
    const [quickAdjust, setQuickAdjust] = useState<QuickAdjustState>(emptyQuickAdjust);
    const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [lowStockPercent, setLowStockPercent] = useState(20);
    const [thresholdInput, setThresholdInput] = useState("20");
    const [savingThreshold, setSavingThreshold] = useState(false);

    useEffect(() => {
        fetchLowStockThreshold().then((percent) => {
            setLowStockPercent(percent);
            setThresholdInput(String(percent));
        });
    }, []);

    async function handleSaveThreshold() {
        const percent = Number(thresholdInput);
        if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return;

        setSavingThreshold(true);
        const saved = await updateLowStockThreshold(percent);
        setSavingThreshold(false);

        if (saved !== null) {
            setLowStockPercent(saved);
            setThresholdInput(String(saved));
        }
    }

    function needsResupply(inventoryItem?: { currentQuantity: number; parQuantity: number }) {
        if (!inventoryItem || inventoryItem.parQuantity <= 0) return false;
        return (inventoryItem.currentQuantity / inventoryItem.parQuantity) * 100 <= lowStockPercent;
    }

    const latestMovementByProductId = useMemo(() => {
        const result = new Map<string, StockMovement>();

        stockMovements.forEach((movement) => {
            if (!result.has(movement.productId)) {
                result.set(movement.productId, movement);
            }
        });

        return result;
    }, [stockMovements]);

    const inventoryRows = useMemo(() => {
        const search = normalizeText(searchTerm);

        return products
            .map((product) => ({
                product,
                inventoryItem: inventoryItems.find((item) => item.productId === product.id),
                latestMovement: latestMovementByProductId.get(product.id),
            }))
            .filter(({ product }) => {
                if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
                if (!search) return true;

                return normalizeText(product.name).includes(search);
            })
            .sort((first, second) => {
                const firstQuantity = first.inventoryItem?.currentQuantity ?? 0;
                const secondQuantity = second.inventoryItem?.currentQuantity ?? 0;

                if (sortMode === "name") {
                    return first.product.name.localeCompare(second.product.name, "fa");
                }

                if (sortMode === "quantity-high") {
                    return secondQuantity - firstQuantity;
                }

                if (sortMode === "quantity-low") {
                    return firstQuantity - secondQuantity;
                }

                return movementTimestamp(second.latestMovement) - movementTimestamp(first.latestMovement);
            });
    }, [categoryFilter, inventoryItems, latestMovementByProductId, products, searchTerm, sortMode]);

    const resupplyItems = useMemo(
        () =>
            products
                .map((product) => ({ product, inventoryItem: inventoryItems.find((item) => item.productId === product.id) }))
                .filter(({ inventoryItem }) => needsResupply(inventoryItem)),
        [products, inventoryItems, lowStockPercent]
    );

    function resetForm() {
        setForm(emptyForm);
    }

    function resetQuickAdjust() {
        setQuickAdjust(emptyQuickAdjust);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const stockUnit = form.unit.trim();
        const orderUnit = form.orderUnit.trim() || stockUnit;
        const orderUnitQuantity = Number(form.orderUnitQuantity) || 1;
        const orderQuantityStep = orderUnit === stockUnit && orderUnitQuantity === 1 ? 0.001 : 1;

        const success = await addInventoryProduct({
            name: form.name,
            category: form.category,
            unit: stockUnit,
            stockUnit,
            orderUnit,
            orderUnitQuantity,
            orderQuantityStep,
            currentQuantity: Number(form.currentQuantity),
        });

        if (success) {
            setActionMessage(`کالای «${form.name}» با موفقیت به انبار اضافه شد.`);
            resetForm();
            setShowAddForm(false);
        }
    }

    function openQuickAdjust(productId: string, mode: QuickAdjustState["mode"]) {
        setEditForm(emptyEditForm);
        setQuickAdjust({
            productId,
            mode,
            amount: "1",
            reason: "",
        });
    }

    async function handleQuickAdjustSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!quickAdjust.productId) return;

        const amount = Number(quickAdjust.amount);

        if (!Number.isFinite(amount) || amount <= 0) return;

        const delta = quickAdjust.mode === "add" ? amount : -amount;
        const success = await adjustInventoryQuantity(quickAdjust.productId, delta, quickAdjust.reason);

        if (success) {
            const adjustedProduct = products.find((product) => product.id === quickAdjust.productId);
            if (adjustedProduct) {
                setActionMessage(`موجودی «${adjustedProduct.name}» با موفقیت اصلاح شد.`);
            }
            resetQuickAdjust();
        }
    }

    function resetEditForm() {
        setEditForm(emptyEditForm);
    }

    function openEdit(product: Product) {
        resetQuickAdjust();
        setEditForm({
            productId: product.id,
            name: product.name,
            category: product.category,
            unit: getStockUnit(product),
            orderUnit: getOrderUnit(product),
            orderUnitQuantity: String(product.orderUnitQuantity ?? 1),
            orderQuantityStep: String(product.orderQuantityStep ?? 1),
        });
    }

    async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editForm.productId) return;

        const inventoryItem = inventoryItems.find((item) => item.productId === editForm.productId);
        const stockUnit = editForm.unit.trim();
        const orderUnit = editForm.orderUnit.trim() || stockUnit;
        const orderUnitQuantity = Number(editForm.orderUnitQuantity) || 1;
        const orderQuantityStep = Number(editForm.orderQuantityStep) || (orderUnit === stockUnit && orderUnitQuantity === 1 ? 0.001 : 1);

        const success = await updateInventoryProduct(editForm.productId, {
            name: editForm.name,
            category: editForm.category,
            unit: stockUnit,
            stockUnit,
            orderUnit,
            orderUnitQuantity,
            orderQuantityStep,
            currentQuantity: inventoryItem?.currentQuantity ?? 0,
        });

        if (success) {
            setActionMessage(`کالای «${editForm.name}» با موفقیت ویرایش شد.`);
            resetEditForm();
        }
    }

    async function handleRemove(product: Product) {
        const inventoryItem = inventoryItems.find((item) => item.productId === product.id);
        const currentQuantity = inventoryItem?.currentQuantity ?? 0;
        const ok = window.confirm(
            `حذف کالا از انبار؟\n\n${product.name}\nموجودی فعلی: ${formatStockQuantity(product, currentQuantity)}\n\nاین کار کالا را از لیست حذف می‌کند و یک رکورد اصلاح موجودی می‌سازد.`
        );

        if (!ok) return;

        const success = await removeInventoryProduct(product.id);
        if (success) {
            setActionMessage(`کالای «${product.name}» از انبار حذف شد.`);
            if (quickAdjust.productId === product.id) resetQuickAdjust();
            if (editForm.productId === product.id) resetEditForm();
        }
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
                                    Penza · داشبورد انبار
                                </p>
                                <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">
                                    موجودی انبار
                                </h1>
                            </div>

                            <PanelNav links={STORAGE_NAV_LINKS} />
                        </div>
                    </section>

                    {actionMessage && (
                        <div className="mt-5">
                            <SuccessNotice message={actionMessage} onDismiss={() => setActionMessage(null)} />
                        </div>
                    )}

                    <section className="mt-5">
                        <div
                            className={
                                resupplyItems.length > 0
                                    ? "rounded-[1.5rem] border border-orange-200 bg-orange-50 p-5"
                                    : "penza-card rounded-[1.5rem] p-5"
                            }
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className={resupplyItems.length > 0 ? "text-lg font-black text-orange-800" : "text-lg font-black text-[#0B2F0B]"}>
                                        {resupplyItems.length > 0
                                            ? `${formatNumber(resupplyItems.length)} کالا به آستانه هشدار (٪${lowStockPercent}) رسیده — نیاز به تامین`
                                            : `هشدار تامین کالا: ٪${lowStockPercent} از آخرین پرشدگی`}
                                    </h2>
                                    {resupplyItems.length > 0 && (
                                        <p className="mt-1 text-sm font-bold text-orange-700">
                                            {resupplyItems.map(({ product }) => product.name).join("، ")}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-500">آستانه هشدار:</span>
                                    <input
                                        value={thresholdInput}
                                        onChange={(event) => setThresholdInput(event.target.value)}
                                        className="h-11 w-20 rounded-2xl border border-green-900/15 bg-white px-3 text-center text-sm font-black text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                        inputMode="decimal"
                                    />
                                    <span className="text-sm font-bold text-slate-500">٪</span>
                                    <button
                                        type="button"
                                        onClick={handleSaveThreshold}
                                        disabled={savingThreshold || thresholdInput === String(lowStockPercent)}
                                        className="rounded-2xl border border-green-900/15 bg-white px-4 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2] disabled:opacity-50"
                                    >
                                        {savingThreshold ? "..." : "ذخیره"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mt-5">
                        <div className="penza-card rounded-[1.5rem] p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="text-xl font-black text-[#0B2F0B]">افزودن کالا</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm((current) => !current)}
                                    className={
                                        showAddForm
                                            ? "rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-slate-600 hover:bg-[#f2fff2]"
                                            : "penza-button rounded-2xl px-5 py-3 text-sm font-black"
                                    }
                                >
                                    {showAddForm ? "بستن" : "+ کالای جدید"}
                                </button>
                            </div>

                            {showAddForm && (
                                <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label className="block text-sm font-black text-[#0B2F0B]">نام کالا</label>
                                        <input
                                            value={form.name}
                                            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                            className="mt-2 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                            placeholder="مثلا شیر پرچرب"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black text-[#0B2F0B]">دسته</label>
                                        <select
                                            value={form.category}
                                            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ProductCategory }))}
                                            className="mt-2 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-3 text-sm font-bold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                        >
                                            {categoryOptions.map((category) => (
                                                <option key={category.id} value={category.id}>{category.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <UnitTypeField
                                        label="واحد موجودی"
                                        value={form.unit}
                                        unitTypes={unitTypes}
                                        onChange={(value) => setForm((current) => ({ ...current, unit: value }))}
                                        onAddUnitType={addUnitType}
                                    />

                                    <UnitTypeField
                                        label="واحد درخواست"
                                        value={form.orderUnit}
                                        unitTypes={unitTypes}
                                        onChange={(value) => setForm((current) => ({ ...current, orderUnit: value }))}
                                        onAddUnitType={addUnitType}
                                    />

                                    <div>
                                        <label className="block text-sm font-black text-[#0B2F0B]">هر واحد درخواست</label>
                                        <input
                                            value={form.orderUnitQuantity}
                                            onChange={(event) => setForm((current) => ({ ...current, orderUnitQuantity: event.target.value }))}
                                            className="mt-2 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-3 text-center text-sm font-black text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                            placeholder="مثلا 6"
                                            inputMode="decimal"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black text-[#0B2F0B]">موجودی فعلی</label>
                                        <input
                                            value={form.currentQuantity}
                                            onChange={(event) => setForm((current) => ({ ...current, currentQuantity: event.target.value }))}
                                            className="mt-2 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-4 text-center text-sm font-black text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                            inputMode="decimal"
                                        />
                                    </div>

                                    <div className="flex items-end gap-3 sm:col-span-2">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-slate-600 hover:bg-[#f2fff2]"
                                        >
                                            پاک کردن
                                        </button>
                                        <button type="submit" className="penza-button rounded-2xl px-5 py-3 text-sm font-black">
                                            افزودن
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </section>

                    <section className="mt-5">
                        <div className="penza-card rounded-[1.5rem] p-5">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                                <h2 className="text-xl font-black text-[#0B2F0B]">موجودی</h2>
                                <div className="grid gap-2 md:grid-cols-3 xl:min-w-[42rem]">
                                    <input
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                        placeholder="جست‌وجوی کالا، واحد یا دسته..."
                                    />
                                    <select
                                        value={categoryFilter}
                                        onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
                                        className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-sm font-bold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                    >
                                        <option value="all">همه دسته‌ها</option>
                                        {categoryOptions.map((category) => (
                                            <option key={category.id} value={category.id}>{category.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={sortMode}
                                        onChange={(event) => setSortMode(event.target.value as SortMode)}
                                        className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-sm font-bold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                    >
                                        <option value="recent">مرتب‌سازی: آخرین تغییر</option>
                                        <option value="name">مرتب‌سازی: نام کالا</option>
                                        <option value="quantity-high">مرتب‌سازی: موجودی زیاد</option>
                                        <option value="quantity-low">مرتب‌سازی: موجودی کم</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 overflow-x-auto rounded-2xl border border-green-900/10 bg-white">
                                <table className="w-full min-w-[1320px] text-right text-sm">
                                    <thead className="penza-table-head text-xs font-black">
                                        <tr>
                                            <th className="px-4 py-3">کالا</th>
                                            <th className="px-4 py-3">دسته</th>
                                            <th className="px-4 py-3">واحد موجودی</th>
                                            <th className="px-4 py-3">واحد درخواست</th>
                                            <th className="px-4 py-3">موجودی واقعی</th>
                                            <th className="px-4 py-3">قابل درخواست</th>
                                            <th className="px-4 py-3">وضعیت</th>
                                            <th className="px-4 py-3">آخرین تغییر</th>
                                            <th className="px-4 py-3">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-green-900/10">
                                        {inventoryRows.map(({ product, inventoryItem, latestMovement }) => {
                                            const quantity = inventoryItem?.currentQuantity ?? 0;
                                            const quickPanelOpen = quickAdjust.productId === product.id;
                                            const editPanelOpen = editForm.productId === product.id;
                                            const tier = getStockStatus(product, inventoryItem);

                                            return (
                                                <Fragment key={product.id}>
                                                    <tr className="hover:bg-[#f8fff8]">
                                                        <td className="px-4 py-3 font-black text-[#0B2F0B]">{product.name}</td>
                                                        <td className="px-4 py-3 text-slate-600">{categoryLabel(product.category)}</td>
                                                        <td className="px-4 py-3 text-slate-600">{getStockUnit(product)}</td>
                                                        <td className="px-4 py-3 text-slate-600">
                                                            <div>{getOrderUnit(product)}</div>
                                                            <div className="mt-1 text-xs font-bold text-slate-400">{formatUnitConversion(product)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 font-black text-[#007A00]">{formatStockQuantity(product, quantity)}</td>
                                                        <td className="px-4 py-3 font-black text-[#0B2F0B]">{formatAvailableQuantity(product, quantity)}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-1">
                                                                <span className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${getStockStatusStyle(tier)}`}>
                                                                    {getStockStatusLabel(tier)}
                                                                </span>
                                                                {needsResupply(inventoryItem) && (
                                                                    <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black text-orange-700 ring-1 ring-orange-100">
                                                                        نیاز به تامین
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs font-bold text-slate-500">
                                                            {latestMovement ? (
                                                                <div className="space-y-1">
                                                                    <p className="font-black text-[#0B2F0B]">{movementQuantityLabel(latestMovement.quantity)} {getStockUnit(product)}</p>
                                                                    <p>{formatDateTime(latestMovement.createdAt)}</p>
                                                                </div>
                                                            ) : (
                                                                "بدون تغییر"
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => (editPanelOpen ? resetEditForm() : openEdit(product))}
                                                                    className="rounded-xl border border-green-900/15 bg-white px-3 py-2 text-xs font-black text-[#0B2F0B] hover:bg-[#f2fff2]"
                                                                >
                                                                    ویرایش
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openQuickAdjust(product.id, "add")}
                                                                    className="rounded-xl border border-green-900/15 bg-white px-3 py-2 text-xs font-black text-[#007A00] hover:bg-[#f2fff2]"
                                                                >
                                                                    + موجودی
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openQuickAdjust(product.id, "subtract")}
                                                                    className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-black text-orange-700 hover:bg-orange-50"
                                                                >
                                                                    - موجودی
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemove(product)}
                                                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-50"
                                                                >
                                                                    حذف
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {quickPanelOpen && (
                                                        <tr className="bg-[#f8fff8]">
                                                            <td className="px-4 py-4" colSpan={9}>
                                                                <form onSubmit={handleQuickAdjustSubmit} className="grid gap-3 rounded-2xl border border-green-900/10 bg-white p-3 md:grid-cols-[8rem_1fr_auto_auto] md:items-end">
                                                                    <div>
                                                                        <label className="block text-xs font-black text-[#0B2F0B]">مقدار ({getStockUnit(product)})</label>
                                                                        <input
                                                                            value={quickAdjust.amount}
                                                                            onChange={(event) => setQuickAdjust((current) => ({ ...current, amount: event.target.value }))}
                                                                            className="mt-1 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-3 text-center text-sm font-black text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                                                            inputMode="decimal"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-black text-[#0B2F0B]">دلیل اصلاح</label>
                                                                        <input
                                                                            value={quickAdjust.reason}
                                                                            onChange={(event) => setQuickAdjust((current) => ({ ...current, reason: event.target.value }))}
                                                                            className="mt-1 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-3 text-right text-sm font-bold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                                                            placeholder="مثلا خرید جدید، شمارش دستی، خرابی..."
                                                                        />
                                                                    </div>
                                                                    <button type="submit" className="penza-button rounded-2xl px-5 py-3 text-sm font-black">
                                                                        {quickAdjust.mode === "add" ? "ثبت افزایش" : "ثبت کاهش"}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={resetQuickAdjust}
                                                                        className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-slate-600 hover:bg-[#f2fff2]"
                                                                    >
                                                                        لغو
                                                                    </button>
                                                                </form>
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {editPanelOpen && (
                                                        <tr className="bg-[#f8fff8]">
                                                            <td className="px-4 py-4" colSpan={9}>
                                                                <form onSubmit={handleEditSubmit} className="grid gap-3 rounded-2xl border border-green-900/10 bg-white p-3 md:grid-cols-4">
                                                                    <div>
                                                                        <label className="block text-xs font-black text-[#0B2F0B]">نام کالا</label>
                                                                        <input
                                                                            value={editForm.name}
                                                                            onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                                                                            className="mt-1 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-3 text-right text-sm font-bold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-black text-[#0B2F0B]">دسته</label>
                                                                        <select
                                                                            value={editForm.category}
                                                                            onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value as ProductCategory }))}
                                                                            className="mt-1 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-3 text-sm font-bold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                                                        >
                                                                            {categoryOptions.map((category) => (
                                                                                <option key={category.id} value={category.id}>{category.label}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <UnitTypeField
                                                                        label="واحد موجودی"
                                                                        value={editForm.unit}
                                                                        unitTypes={unitTypes}
                                                                        onChange={(value) => setEditForm((current) => ({ ...current, unit: value }))}
                                                                        onAddUnitType={addUnitType}
                                                                    />
                                                                    <UnitTypeField
                                                                        label="واحد درخواست"
                                                                        value={editForm.orderUnit}
                                                                        unitTypes={unitTypes}
                                                                        onChange={(value) => setEditForm((current) => ({ ...current, orderUnit: value }))}
                                                                        onAddUnitType={addUnitType}
                                                                    />
                                                                    <div>
                                                                        <label className="block text-xs font-black text-[#0B2F0B]">هر واحد درخواست</label>
                                                                        <input
                                                                            value={editForm.orderUnitQuantity}
                                                                            onChange={(event) => setEditForm((current) => ({ ...current, orderUnitQuantity: event.target.value }))}
                                                                            className="mt-1 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-3 text-center text-sm font-black text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                                                            inputMode="decimal"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-end gap-2 md:col-span-3">
                                                                        <button type="submit" className="penza-button rounded-2xl px-5 py-3 text-sm font-black">
                                                                            ذخیره
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={resetEditForm}
                                                                            className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-slate-600 hover:bg-[#f2fff2]"
                                                                        >
                                                                            لغو
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}

                                        {inventoryRows.length === 0 && (
                                            <tr>
                                                <td className="px-4 py-6 text-center text-sm font-bold text-slate-500" colSpan={9}>
                                                    کالایی با این فیلتر پیدا نشد.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    <section className="mt-5">
                        <div className="penza-card rounded-[1.5rem] p-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-black text-[#0B2F0B]">آخرین تغییرات</h2>
                                <Link href="/storage/reports" className="text-sm font-black text-[#007A00] hover:underline">
                                    گزارش
                                </Link>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {stockMovements.slice(0, 6).map((movement) => {
                                    const product = products.find((item) => item.id === movement.productId);
                                    return (
                                        <div key={movement.id} className="rounded-2xl bg-[#f8fff8] p-3 text-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="font-black text-[#0B2F0B]">{product?.name ?? "کالا حذف‌شده"}</p>
                                                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#007A00] ring-1 ring-green-900/10">
                                                    {movementTypeLabel(movement.type)}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs font-bold text-slate-500">
                                                {movementQuantityLabel(movement.quantity)} · {formatDateTime(movement.createdAt)}
                                            </p>
                                            <p className="mt-1 text-xs leading-6 text-slate-500">{movement.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </RoleGuard>
    );
}
