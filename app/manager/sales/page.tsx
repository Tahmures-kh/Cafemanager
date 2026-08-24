"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { RoleGuard } from "../../../components/RoleGuard";
import { PanelNav } from "../../../components/panels/PanelNav";
import { MANAGER_NAV_LINKS } from "../../../lib/nav-links";
import { fetchAuditLog, logAuditEvent } from "../../../lib/audit-log";
import { getCurrentAccount, type CurrentAccount } from "../../../lib/auth-api";
import { formatDateTime, useCafeStorageStore } from "../../../lib/local-store";
import { formatStockQuantity } from "../../../lib/product-units";
import { useRecipes } from "../../../lib/recipe-store";
import {
    matchSalesItemsToRecipes,
    parseSalesExcelRows,
    type ParsedSalesRow,
} from "../../../lib/sales-excel";
import {
    extractSalesFromImage,
    fetchSalesBatches,
    importSalesBatch,
} from "../../../lib/sales-api";
import { getRoleLabel } from "../../../lib/role-session";
import type { AuditLogEntry, Product, Recipe, SalesBatch } from "../../../lib/types";

const AUDIT_SCOPE = "sales";

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
}

function getProduct(productId: string, products: Product[]) {
    return products.find((product) => product.id === productId);
}

export default function ManagerSalesPage() {
    const { products, stockMovements } = useCafeStorageStore();
    const { recipes } = useRecipes();

    const [account, setAccount] = useState<CurrentAccount | null>(null);

    const [shiftDate, setShiftDate] = useState(todayIso());
    const [shiftLabel, setShiftLabel] = useState("");

    const [previewRows, setPreviewRows] = useState<ParsedSalesRow[] | null>(null);
    const [previewSourceType, setPreviewSourceType] = useState<"excel" | "csv" | "image" | null>(null);
    const [pendingFileName, setPendingFileName] = useState<string | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [extractingImage, setExtractingImage] = useState(false);
    const excelInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [batches, setBatches] = useState<SalesBatch[]>([]);
    const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

    const [analysisFrom, setAnalysisFrom] = useState(daysAgoIso(30));
    const [analysisTo, setAnalysisTo] = useState(todayIso());

    const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);

    async function refreshBatches() {
        setBatches(await fetchSalesBatches());
    }

    async function refreshAuditLog() {
        setAuditEntries(await fetchAuditLog(AUDIT_SCOPE));
    }

    useEffect(() => {
        refreshBatches();
        refreshAuditLog();
        getCurrentAccount().then(setAccount);
    }, []);

    async function recordAuditEvent(action: string, description: string) {
        await logAuditEvent({ scope: AUDIT_SCOPE, action, description });
        refreshAuditLog();
    }

    function handleExcelFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setParseError(null);
        setPreviewRows(null);
        setPendingFileName(file.name);
        setPreviewSourceType(file.name.toLowerCase().endsWith(".csv") ? "csv" : "excel");

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            try {
                const data = loadEvent.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

                const result = parseSalesExcelRows(rows, recipes);
                setPreviewRows(result.rows);
            } catch (error) {
                setParseError(error instanceof Error ? error.message : "خواندن فایل ناموفق بود.");
            }
        };
        reader.onerror = () => setParseError("خواندن فایل ناموفق بود.");
        reader.readAsBinaryString(file);
    }

    async function handleImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setParseError(null);
        setPreviewRows(null);
        setPendingFileName(file.name);
        setPreviewSourceType("image");
        setExtractingImage(true);

        const result = await extractSalesFromImage(file);

        if (!result.ok) {
            setParseError(result.error);
            setExtractingImage(false);
            return;
        }

        const matched = matchSalesItemsToRecipes(result.items, recipes);
        setPreviewRows(matched.rows);
        setExtractingImage(false);
    }

    function handleCancelPreview() {
        setPreviewRows(null);
        setParseError(null);
        setPendingFileName(null);
        setPreviewSourceType(null);
        if (excelInputRef.current) excelInputRef.current.value = "";
        if (imageInputRef.current) imageInputRef.current.value = "";
    }

    async function handleConfirmImport() {
        if (!previewRows || previewRows.length === 0 || !previewSourceType) return;

        setImporting(true);

        const batch = await importSalesBatch({
            shiftDate,
            shiftLabel: shiftLabel.trim() || undefined,
            sourceType: previewSourceType,
            sourceFileName: pendingFileName ?? undefined,
            importedBy: account?.displayName ?? account?.username ?? undefined,
            items: previewRows.map((row) => ({
                itemName: row.itemName,
                quantitySold: row.quantitySold,
                unitPrice: row.unitPrice,
                revenue: row.revenue,
                recipeId: row.recipeId,
            })),
        });

        if (batch) {
            await recordAuditEvent(
                previewSourceType === "image" ? "import_image" : previewSourceType === "csv" ? "import_csv" : "import_excel",
                `ثبت فروش شیفت ${shiftDate}${shiftLabel ? ` (${shiftLabel})` : ""} — ${previewRows.length} آیتم از «${pendingFileName ?? "نامشخص"}»`
            );
            await refreshBatches();
        }

        setImporting(false);
        handleCancelPreview();
    }

    const analysisRows = useMemo(() => {
        const recipesById = new Map<string, Recipe>(recipes.map((recipe) => [recipe.id, recipe]));
        const batchesInRange = batches.filter((batch) => batch.shiftDate >= analysisFrom && batch.shiftDate <= analysisTo);

        const consumptionByProduct = new Map<string, number>();
        for (const batch of batchesInRange) {
            for (const item of batch.items) {
                if (!item.recipeId) continue;
                const recipe = recipesById.get(item.recipeId);
                if (!recipe) continue;

                for (const ingredient of recipe.ingredients) {
                    const current = consumptionByProduct.get(ingredient.productId) ?? 0;
                    consumptionByProduct.set(ingredient.productId, current + ingredient.quantity * item.quantitySold);
                }
            }
        }

        const purchasedByProduct = new Map<string, number>();
        for (const movement of stockMovements) {
            if (movement.type !== "stock_in") continue;
            const movementDate = movement.createdAt.slice(0, 10);
            if (movementDate < analysisFrom || movementDate > analysisTo) continue;

            const current = purchasedByProduct.get(movement.productId) ?? 0;
            purchasedByProduct.set(movement.productId, current + movement.quantity);
        }

        const productIds = new Set([...consumptionByProduct.keys(), ...purchasedByProduct.keys()]);

        return Array.from(productIds)
            .map((productId) => ({
                product: getProduct(productId, products),
                productId,
                consumption: consumptionByProduct.get(productId) ?? 0,
                purchased: purchasedByProduct.get(productId) ?? 0,
            }))
            .sort((a, b) => b.consumption - a.consumption);
    }, [batches, recipes, stockMovements, products, analysisFrom, analysisTo]);

    return (
        <RoleGuard role="manager">
            <main className="penza-page">
                <div className="mx-auto max-w-7xl p-5 lg:p-6">
                    <section className="penza-hero p-5 lg:p-7">
                        <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                    <span className="penza-live-dot" />
                                    Penza · فروش و تحلیل
                                </p>
                                <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">
                                    فروش پایان شیفت و تحلیل مصرف
                                </h1>
                            </div>

                            <PanelNav links={MANAGER_NAV_LINKS} />
                        </div>
                    </section>

                    {account && (
                        <section className="mt-5 rounded-2xl bg-[#f2fff2] px-4 py-2 text-xs font-bold text-[#007A00]">
                            ثبت‌کننده‌ی فعالیت‌ها: {account.displayName ?? account.username} ({getRoleLabel(account.role)})
                        </section>
                    )}

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">ثبت فروش پایان شیفت</h2>
                        <p className="mt-1 text-xs font-bold leading-6 text-slate-500">
                            نام آیتم فروخته‌شده باید با نام یک رسپی ثبت‌شده مطابقت داشته باشد. فایل اکسل/CSV باید ستون‌های
                            «نام آیتم» و «تعداد فروخته‌شده» (و اختیاری «قیمت واحد»/«مبلغ») داشته باشد.
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <label className="text-xs font-bold text-slate-500">
                                تاریخ شیفت
                                <input
                                    type="date"
                                    value={shiftDate}
                                    onChange={(event) => setShiftDate(event.target.value)}
                                    className="mt-1 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                />
                            </label>
                            <label className="text-xs font-bold text-slate-500">
                                برچسب شیفت (اختیاری)
                                <input
                                    value={shiftLabel}
                                    onChange={(event) => setShiftLabel(event.target.value)}
                                    placeholder="مثلاً شیفت عصر"
                                    className="mt-1 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                />
                            </label>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <label className="penza-button cursor-pointer rounded-2xl px-5 py-3 text-sm font-black">
                                انتخاب فایل اکسل/CSV
                                <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelFileChange} className="hidden" />
                            </label>
                            <label className="penza-ghost-button cursor-pointer rounded-2xl px-5 py-3 text-sm font-black hover:bg-green-50">
                                آپلود عکس گزارش شیفت
                                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                            </label>
                        </div>

                        {extractingImage && (
                            <p className="mt-4 rounded-2xl bg-[#f8fff8] px-4 py-3 text-sm font-bold text-[#007A00]">در حال خواندن عکس...</p>
                        )}

                        {parseError && (
                            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{parseError}</p>
                        )}

                        {previewRows && (
                            <div className="mt-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-black text-[#0B2F0B]">
                                        پیش‌نمایش: {previewRows.length} آیتم از «{pendingFileName}»
                                    </p>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={handleCancelPreview} className="rounded-2xl border border-green-900/15 bg-white px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-50">
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

                                <div className="mt-3 overflow-x-auto rounded-2xl border border-green-900/10 bg-white">
                                    <table className="w-full min-w-[640px] text-right text-xs">
                                        <thead className="penza-table-head font-black">
                                            <tr>
                                                <th className="px-4 py-2">نام آیتم</th>
                                                <th className="px-4 py-2">تعداد</th>
                                                <th className="px-4 py-2">قیمت واحد</th>
                                                <th className="px-4 py-2">مبلغ</th>
                                                <th className="px-4 py-2">وضعیت</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-green-900/10">
                                            {previewRows.map((row, index) => (
                                                <tr key={`${row.itemName}-${index}`} className={row.recipeId ? "" : "bg-red-50"}>
                                                    <td className="px-4 py-2 font-bold">{row.itemName}</td>
                                                    <td className="px-4 py-2">{row.quantitySold}</td>
                                                    <td className="px-4 py-2">{row.unitPrice ?? "-"}</td>
                                                    <td className="px-4 py-2">{row.revenue ?? "-"}</td>
                                                    <td className="px-4 py-2">
                                                        {row.recipeId ? (
                                                            <span className="font-bold text-[#007A00]">مچ شد</span>
                                                        ) : (
                                                            <span className="font-bold text-red-600">رسپی پیدا نشد</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">شیفت‌های ثبت‌شده ({batches.length})</h2>
                        <div className="mt-4 overflow-x-auto rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[640px] text-right text-sm">
                                <thead className="penza-table-head text-xs font-black">
                                    <tr>
                                        <th className="px-4 py-3">تاریخ</th>
                                        <th className="px-4 py-3">برچسب</th>
                                        <th className="px-4 py-3">منبع</th>
                                        <th className="px-4 py-3">تعداد آیتم</th>
                                        <th className="px-4 py-3">جمع فروش</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {batches.map((batch) => {
                                        const total = batch.items.reduce((sum, item) => sum + (item.revenue ?? 0), 0);
                                        return (
                                            <Fragment key={batch.id}>
                                                <tr className="hover:bg-[#f8fff8]">
                                                    <td className="px-4 py-3 font-black text-[#0B2F0B]">
                                                        <button type="button" onClick={() => setExpandedBatchId(expandedBatchId === batch.id ? null : batch.id)} className="text-right hover:underline">
                                                            {batch.shiftDate}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{batch.shiftLabel ?? "-"}</td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {batch.sourceType === "image" ? "عکس" : batch.sourceType === "csv" ? "CSV" : "اکسل"}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{batch.items.length}</td>
                                                    <td className="px-4 py-3 font-black text-[#007A00]">{total > 0 ? total.toLocaleString("en-US") : "-"}</td>
                                                </tr>
                                                {expandedBatchId === batch.id && (
                                                    <tr>
                                                        <td colSpan={5} className="bg-[#f8fff8] px-4 py-3">
                                                            <ul className="space-y-1 text-xs font-bold text-slate-600">
                                                                {batch.items.map((item) => (
                                                                    <li key={item.id}>
                                                                        {item.itemName} — {item.quantitySold} عدد{item.revenue ? ` — ${item.revenue.toLocaleString("en-US")}` : ""}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                    {batches.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-sm font-bold text-slate-500" colSpan={5}>
                                                هنوز شیفتی ثبت نشده است.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-black text-[#0B2F0B]">تحلیل مصرف در مقابل خرید</h2>
                            <div className="flex flex-wrap gap-2">
                                <input type="date" value={analysisFrom} onChange={(event) => setAnalysisFrom(event.target.value)} className="h-10 rounded-2xl border border-green-900/15 bg-white px-3 text-xs font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]" />
                                <input type="date" value={analysisTo} onChange={(event) => setAnalysisTo(event.target.value)} className="h-10 rounded-2xl border border-green-900/15 bg-white px-3 text-xs font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]" />
                            </div>
                        </div>
                        <p className="mt-1 text-xs font-bold leading-6 text-slate-500">
                            «مصرف تخمینی» از ضرب تعداد فروش هر رسپی در مقدار مواد آن رسپی محاسبه می‌شود؛ «خرید واقعی» از حرکت‌های ورود به انبار در همین بازه است.
                        </p>

                        <div className="mt-4 overflow-x-auto rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[640px] text-right text-sm">
                                <thead className="penza-table-head text-xs font-black">
                                    <tr>
                                        <th className="px-4 py-3">کالا</th>
                                        <th className="px-4 py-3">مصرف تخمینی</th>
                                        <th className="px-4 py-3">خرید واقعی</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {analysisRows.map((row) => (
                                        <tr key={row.productId} className="hover:bg-[#f8fff8]">
                                            <td className="px-4 py-3 font-black text-[#0B2F0B]">{row.product?.name ?? "کالای حذف‌شده"}</td>
                                            <td className="px-4 py-3 text-slate-600">{formatStockQuantity(row.product, row.consumption)}</td>
                                            <td className="px-4 py-3 text-slate-600">{formatStockQuantity(row.product, row.purchased)}</td>
                                        </tr>
                                    ))}
                                    {analysisRows.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-sm font-bold text-slate-500" colSpan={3}>
                                                برای این بازه داده‌ای برای تحلیل وجود ندارد.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">تاریخچه‌ی فعالیت این پنل</h2>
                        <div className="mt-4 overflow-x-auto rounded-2xl border border-green-900/10 bg-white">
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
                                            <td className="px-4 py-3 font-bold text-[#0B2F0B]">{entry.actorName} ({entry.actorRole})</td>
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
