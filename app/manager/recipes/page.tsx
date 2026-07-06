"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { BackButton } from "../../../components/BackButton";
import { RoleGuard } from "../../../components/RoleGuard";
import { fetchAuditLog, logAuditEvent } from "../../../lib/audit-log";
import { getActorName, setActorName } from "../../../lib/actor-name";
import { formatDateTime, useCafeStorageStore } from "../../../lib/local-store";
import { formatStockQuantity, getStockUnit } from "../../../lib/product-units";
import { parseRecipeExcelRows, type ParsedRecipePreview } from "../../../lib/recipe-excel";
import { useRecipes, type RecipeInput } from "../../../lib/recipe-store";
import { getActivePenzaRole, getRoleLabel } from "../../../lib/role-session";
import type { AuditLogEntry, Product, Recipe } from "../../../lib/types";

const AUDIT_SCOPE = "recipes";

function getProduct(productId: string, products: Product[]) {
    return products.find((product) => product.id === productId);
}

function emptyEditForm(): { name: string; category: string; ingredients: Array<{ productId: string; quantity: string }> } {
    return { name: "", category: "", ingredients: [{ productId: "", quantity: "" }] };
}

function recipeToEditForm(recipe: Recipe) {
    return {
        name: recipe.name,
        category: recipe.category ?? "",
        ingredients: recipe.ingredients.length > 0
            ? recipe.ingredients.map((ingredient) => ({ productId: ingredient.productId, quantity: String(ingredient.quantity) }))
            : [{ productId: "", quantity: "" }],
    };
}

export default function ManagerRecipesPage() {
    const { products } = useCafeStorageStore();
    const { recipes, addRecipe, updateRecipe, deleteRecipe, importRecipes } = useRecipes();

    const [actorName, setActorNameState] = useState<string | null>(() => getActorName());
    const [actorNameInput, setActorNameInput] = useState("");

    const [parsePreview, setParsePreview] = useState<ParsedRecipePreview[] | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [pendingFileName, setPendingFileName] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
    const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState(emptyEditForm());

    const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);

    const actorRole = getActivePenzaRole();
    const actorRoleLabel = actorRole ? getRoleLabel(actorRole) : "نامشخص";

    async function refreshAuditLog() {
        const entries = await fetchAuditLog(AUDIT_SCOPE);
        setAuditEntries(entries);
    }

    useEffect(() => {
        refreshAuditLog();
    }, []);

    async function recordAuditEvent(action: string, description: string) {
        await logAuditEvent({
            scope: AUDIT_SCOPE,
            action,
            description,
            actorRole: actorRoleLabel,
            actorName: actorName ?? "نامشخص",
        });
        refreshAuditLog();
    }

    function handleSaveActorName() {
        const trimmed = actorNameInput.trim();
        if (!trimmed) return;

        setActorName(trimmed);
        setActorNameState(trimmed);
        setActorNameInput("");
    }

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setParseError(null);
        setParsePreview(null);
        setPendingFileName(file.name);

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            try {
                const data = loadEvent.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const firstSheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

                const result = parseRecipeExcelRows(rows, products);
                setParsePreview(result.recipes);
            } catch (error) {
                setParseError(error instanceof Error ? error.message : "خواندن فایل اکسل ناموفق بود.");
            }
        };
        reader.onerror = () => setParseError("خواندن فایل اکسل ناموفق بود.");
        reader.readAsBinaryString(file);
    }

    async function handleConfirmImport() {
        if (!parsePreview || parsePreview.length === 0) return;

        setImporting(true);

        const inputs: RecipeInput[] = parsePreview.map((preview) => ({
            name: preview.name,
            ingredients: preview.rows
                .filter((row) => row.productId)
                .map((row) => ({ productId: row.productId as string, quantity: row.quantity })),
        }));

        const imported = importRecipes(inputs);
        await recordAuditEvent(
            "import_excel",
            `ایمپورت ${imported.length} رسپی از فایل «${pendingFileName ?? "نامشخص"}»`
        );

        setImporting(false);
        setParsePreview(null);
        setPendingFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleCancelImportPreview() {
        setParsePreview(null);
        setParseError(null);
        setPendingFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function openEditForm(recipe: Recipe) {
        setEditingRecipeId(recipe.id);
        setEditForm(recipeToEditForm(recipe));
    }

    function openNewRecipeForm() {
        setEditingRecipeId("new");
        setEditForm(emptyEditForm());
    }

    function closeEditForm() {
        setEditingRecipeId(null);
        setEditForm(emptyEditForm());
    }

    function updateEditIngredient(index: number, field: "productId" | "quantity", value: string) {
        setEditForm((current) => ({
            ...current,
            ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
                ingredientIndex === index ? { ...ingredient, [field]: value } : ingredient
            ),
        }));
    }

    function addEditIngredientRow() {
        setEditForm((current) => ({
            ...current,
            ingredients: [...current.ingredients, { productId: "", quantity: "" }],
        }));
    }

    function removeEditIngredientRow(index: number) {
        setEditForm((current) => ({
            ...current,
            ingredients: current.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
        }));
    }

    async function handleSaveEditForm() {
        const name = editForm.name.trim();
        if (!name) return;

        const input: RecipeInput = {
            name,
            category: editForm.category.trim() || undefined,
            ingredients: editForm.ingredients
                .filter((ingredient) => ingredient.productId)
                .map((ingredient) => ({
                    productId: ingredient.productId,
                    quantity: Number.parseFloat(ingredient.quantity) || 0,
                })),
        };

        if (editingRecipeId === "new") {
            addRecipe(input);
            await recordAuditEvent("create_recipe", `ایجاد رسپی «${name}»`);
        } else if (editingRecipeId) {
            updateRecipe(editingRecipeId, input);
            await recordAuditEvent("update_recipe", `ویرایش رسپی «${name}»`);
        }

        closeEditForm();
    }

    async function handleDeleteRecipe(recipe: Recipe) {
        const confirmed = window.confirm(`حذف رسپی «${recipe.name}»؟\n\nاین کار قابل بازگشت نیست.`);
        if (!confirmed) return;

        deleteRecipe(recipe.id);
        await recordAuditEvent("delete_recipe", `حذف رسپی «${recipe.name}»`);
    }

    return (
        <RoleGuard role="manager">
            <main className="penza-page">
                <div className="mx-auto max-w-7xl p-5 lg:p-6">
                    <section className="penza-hero p-5 lg:p-7">
                        <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                    <span className="penza-live-dot" />
                                    Penza · رسپی‌ها
                                </p>
                                <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">
                                    مدیریت رسپی‌ها
                                </h1>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <BackButton />
                                <Link href="/manager/dashboard" className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                    داشبورد
                                </Link>
                                <Link href="/manager/orders" className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                    درخواست‌ها
                                </Link>
                                <Link href="/manager/inventory" className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                    موجودی انبار
                                </Link>
                                <Link href="/manager/reports" className="penza-button rounded-2xl px-5 py-3 text-sm font-black">
                                    گزارش دوره‌ای
                                </Link>
                            </div>
                        </div>
                    </section>

                    {!actorName ? (
                        <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                            <p className="text-sm font-black text-[#0B2F0B]">
                                برای اینکه در تاریخچه‌ی فعالیت مشخص باشد چه کسی چه کاری کرده، لطفاً نام خود را وارد کنید.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <input
                                    value={actorNameInput}
                                    onChange={(event) => setActorNameInput(event.target.value)}
                                    className="h-12 min-w-[16rem] rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                    placeholder="نام شما..."
                                />
                                <button type="button" onClick={handleSaveActorName} className="penza-button rounded-2xl px-5 py-3 text-sm font-black">
                                    ذخیره نام
                                </button>
                            </div>
                        </section>
                    ) : (
                        <section className="mt-5 flex items-center justify-between rounded-2xl bg-[#f2fff2] px-4 py-2 text-xs font-bold text-[#007A00]">
                            <span>ثبت‌کننده‌ی فعالیت‌ها: {actorName} ({actorRoleLabel})</span>
                            <button
                                type="button"
                                onClick={() => setActorNameState(null)}
                                className="font-black text-[#007A00] underline"
                            >
                                تغییر نام
                            </button>
                        </section>
                    )}

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-black text-[#0B2F0B]">ایمپورت رسپی از اکسل</h2>
                                <p className="mt-1 text-xs font-bold leading-6 text-slate-500">
                                    فایل باید ستون‌های «نام رسپی»، «نام ماده اولیه» و «مقدار» را داشته باشد؛ برای هر ماده‌ی
                                    یک رسپی یک ردیف جدا با همان نام رسپی وارد کنید.
                                </p>
                            </div>
                            <label className="penza-button cursor-pointer rounded-2xl px-5 py-3 text-sm font-black">
                                انتخاب فایل اکسل
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {parseError && (
                            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{parseError}</p>
                        )}

                        {parsePreview && (
                            <div className="mt-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-black text-[#0B2F0B]">
                                        پیش‌نمایش: {parsePreview.length} رسپی از «{pendingFileName}»
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCancelImportPreview}
                                            className="rounded-2xl border border-green-900/15 bg-white px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-50"
                                        >
                                            انصراف
                                        </button>
                                        <button
                                            type="button"
                                            disabled={importing}
                                            onClick={handleConfirmImport}
                                            className="penza-button rounded-2xl px-4 py-2 text-xs font-black disabled:opacity-50"
                                        >
                                            {importing ? "در حال ذخیره..." : "تایید و ذخیره"}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-3">
                                    {parsePreview.map((preview) => (
                                        <div key={preview.name} className="overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                                            <div className="bg-[#f8fff8] px-4 py-2 text-sm font-black text-[#0B2F0B]">
                                                {preview.name} — {preview.rows.length} ماده
                                            </div>
                                            <table className="w-full min-w-[520px] text-right text-xs">
                                                <thead className="penza-table-head font-black">
                                                    <tr>
                                                        <th className="px-4 py-2">ردیف</th>
                                                        <th className="px-4 py-2">نام ماده اولیه</th>
                                                        <th className="px-4 py-2">مقدار</th>
                                                        <th className="px-4 py-2">وضعیت</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-green-900/10">
                                                    {preview.rows.map((row) => (
                                                        <tr key={row.rowNumber} className={row.productId ? "" : "bg-red-50"}>
                                                            <td className="px-4 py-2">{row.rowNumber}</td>
                                                            <td className="px-4 py-2 font-bold">{row.ingredientName}</td>
                                                            <td className="px-4 py-2">
                                                                {row.quantity} {row.stockUnit ?? ""}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                {row.productId ? (
                                                                    <span className="font-bold text-[#007A00]">مچ شد</span>
                                                                ) : (
                                                                    <span className="font-bold text-red-600">کالا پیدا نشد</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-xl font-black text-[#0B2F0B]">رسپی‌ها ({recipes.length})</h2>
                            <button
                                type="button"
                                onClick={openNewRecipeForm}
                                className="penza-ghost-button rounded-2xl px-4 py-2 text-xs font-black hover:bg-green-50"
                            >
                                + رسپی جدید
                            </button>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[720px] text-right text-sm">
                                <thead className="penza-table-head text-xs font-black">
                                    <tr>
                                        <th className="px-4 py-3">نام رسپی</th>
                                        <th className="px-4 py-3">دسته‌بندی</th>
                                        <th className="px-4 py-3">تعداد مواد</th>
                                        <th className="px-4 py-3">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {recipes.map((recipe) => (
                                        <Fragment key={recipe.id}>
                                            <tr className="hover:bg-[#f8fff8]">
                                                <td className="px-4 py-3 font-black text-[#0B2F0B]">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedRecipeId(expandedRecipeId === recipe.id ? null : recipe.id)}
                                                        className="text-right hover:underline"
                                                    >
                                                        {recipe.name}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{recipe.category ?? "-"}</td>
                                                <td className="px-4 py-3 text-slate-600">{recipe.ingredients.length}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditForm(recipe)}
                                                            className="rounded-full bg-[#e0ffe0] px-3 py-1 text-[11px] font-black text-[#007A00]"
                                                        >
                                                            ویرایش
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRecipe(recipe)}
                                                            className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-black text-red-600"
                                                        >
                                                            حذف
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRecipeId === recipe.id && (
                                                <tr>
                                                    <td colSpan={4} className="bg-[#f8fff8] px-4 py-3">
                                                        <ul className="space-y-1 text-xs font-bold text-slate-600">
                                                            {recipe.ingredients.map((ingredient) => {
                                                                const product = getProduct(ingredient.productId, products);
                                                                return (
                                                                    <li key={ingredient.id}>
                                                                        {product?.name ?? "کالای حذف‌شده"} — {formatStockQuantity(product, ingredient.quantity)}
                                                                    </li>
                                                                );
                                                            })}
                                                            {recipe.ingredients.length === 0 && <li>ماده‌ای ثبت نشده است.</li>}
                                                        </ul>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                    {recipes.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-sm font-bold text-slate-500" colSpan={4}>
                                                هنوز رسپی‌ای ثبت نشده است.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {editingRecipeId && (
                        <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                            <h2 className="text-xl font-black text-[#0B2F0B]">
                                {editingRecipeId === "new" ? "رسپی جدید" : "ویرایش رسپی"}
                            </h2>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <input
                                    value={editForm.name}
                                    onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                                    placeholder="نام رسپی"
                                    className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                />
                                <input
                                    value={editForm.category}
                                    onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))}
                                    placeholder="دسته‌بندی (اختیاری)"
                                    className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                />
                            </div>

                            <div className="mt-4 space-y-2">
                                {editForm.ingredients.map((ingredient, index) => (
                                    <div key={index} className="flex flex-wrap items-center gap-2">
                                        <select
                                            value={ingredient.productId}
                                            onChange={(event) => updateEditIngredient(index, "productId", event.target.value)}
                                            className="h-12 min-w-[14rem] rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                        >
                                            <option value="">انتخاب کالا...</option>
                                            {products.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            value={ingredient.quantity}
                                            onChange={(event) => updateEditIngredient(index, "quantity", event.target.value)}
                                            placeholder={`مقدار (${getStockUnit(getProduct(ingredient.productId, products))})`}
                                            className="h-12 w-40 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeEditIngredientRow(index)}
                                            className="rounded-full bg-red-50 px-3 py-2 text-[11px] font-black text-red-600"
                                        >
                                            حذف ردیف
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addEditIngredientRow}
                                    className="penza-ghost-button rounded-2xl px-4 py-2 text-xs font-black hover:bg-green-50"
                                >
                                    + افزودن ماده
                                </button>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button type="button" onClick={handleSaveEditForm} className="penza-button rounded-2xl px-5 py-3 text-sm font-black">
                                    ذخیره
                                </button>
                                <button
                                    type="button"
                                    onClick={closeEditForm}
                                    className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-slate-500 hover:bg-slate-50"
                                >
                                    انصراف
                                </button>
                            </div>
                        </section>
                    )}

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">تاریخچه‌ی فعالیت این پنل</h2>
                        <div className="mt-4 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[720px] text-right text-xs">
                                <thead className="penza-table-head font-black">
                                    <tr>
                                        <th className="px-4 py-3">تاریخ و ساعت</th>
                                        <th className="px-4 py-3">کاربر</th>
                                        <th className="px-4 py-3">عملیات</th>
                                        <th className="px-4 py-3">توضیحات</th>
                                        <th className="px-4 py-3">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {auditEntries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="px-4 py-3 text-slate-600">{formatDateTime(entry.createdAt)}</td>
                                            <td className="px-4 py-3 font-bold text-[#0B2F0B]">
                                                {entry.actorName} ({entry.actorRole})
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{entry.action}</td>
                                            <td className="px-4 py-3 text-slate-600">{entry.description}</td>
                                            <td className="px-4 py-3 text-slate-600">{entry.ip}</td>
                                        </tr>
                                    ))}
                                    {auditEntries.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center font-bold text-slate-500" colSpan={5}>
                                                هنوز فعالیتی ثبت نشده است.
                                            </td>
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
