import type { Recipe } from "./types";

const ITEM_NAME_HEADERS = ["نام آیتم", "نام محصول", "نام کالا", "نام رسپی", "آیتم"];
const QUANTITY_HEADERS = ["تعداد فروخته‌شده", "تعداد فروخته شده", "تعداد", "مقدار"];
const UNIT_PRICE_HEADERS = ["قیمت واحد", "قیمت"];
const REVENUE_HEADERS = ["مبلغ", "مبلغ کل", "جمع"];

export type ParsedSalesRow = {
    rowNumber: number;
    itemName: string;
    quantitySold: number;
    unitPrice: number | null;
    revenue: number | null;
    recipeId: string | null;
};

export type SalesExcelParseResult = {
    rows: ParsedSalesRow[];
    matchedCount: number;
    unmatchedCount: number;
};

function normalizeHeader(value: string) {
    return value.trim().toLowerCase();
}

function normalizeName(value: string) {
    return value.trim().toLowerCase();
}

function findColumnKey(sampleRow: Record<string, unknown>, candidates: string[]) {
    const keys = Object.keys(sampleRow);

    for (const candidate of candidates) {
        const match = keys.find((key) => normalizeHeader(key) === normalizeHeader(candidate));
        if (match) return match;
    }

    return null;
}

function toNumberOrNull(value: unknown) {
    if (value === "" || value === undefined || value === null) return null;

    const parsed = typeof value === "number" ? value : Number.parseFloat(String(value).trim());
    return Number.isFinite(parsed) ? parsed : null;
}

type RawSalesItem = {
    itemName: string;
    quantitySold: number;
    unitPrice: number | null;
    revenue: number | null;
};

/**
 * Shared by both the Excel/CSV import path and the Claude-Vision image
 * extraction path: sold items ("لاته وانیل") correspond to recipe names, not
 * storage product names, so matching happens against the recipe list.
 */
export function matchSalesItemsToRecipes(items: RawSalesItem[], recipes: Recipe[]): SalesExcelParseResult {
    const recipesByName = new Map(recipes.map((recipe) => [normalizeName(recipe.name), recipe]));
    let matchedCount = 0;
    let unmatchedCount = 0;

    const parsedRows: ParsedSalesRow[] = items
        .filter((item) => item.itemName && item.quantitySold > 0)
        .map((item, index) => {
            const recipe = recipesByName.get(normalizeName(item.itemName));
            if (recipe) {
                matchedCount += 1;
            } else {
                unmatchedCount += 1;
            }

            return {
                rowNumber: index + 1,
                itemName: item.itemName,
                quantitySold: item.quantitySold,
                unitPrice: item.unitPrice,
                revenue: item.revenue,
                recipeId: recipe?.id ?? null,
            };
        });

    return { rows: parsedRows, matchedCount, unmatchedCount };
}

/**
 * Sold items ("لاته وانیل") correspond to recipe names, not storage product
 * names, so matching happens against the recipe list.
 */
export function parseSalesExcelRows(
    rows: Record<string, unknown>[],
    recipes: Recipe[]
): SalesExcelParseResult {
    if (rows.length === 0) return { rows: [], matchedCount: 0, unmatchedCount: 0 };

    const itemNameKey = findColumnKey(rows[0], ITEM_NAME_HEADERS);
    const quantityKey = findColumnKey(rows[0], QUANTITY_HEADERS);
    const unitPriceKey = findColumnKey(rows[0], UNIT_PRICE_HEADERS);
    const revenueKey = findColumnKey(rows[0], REVENUE_HEADERS);

    if (!itemNameKey || !quantityKey) {
        throw new Error(
            "ستون‌های مورد نیاز پیدا نشد. فایل باید ستون‌های «نام آیتم» و «تعداد فروخته‌شده» را داشته باشد."
        );
    }

    const recipesByName = new Map(recipes.map((recipe) => [normalizeName(recipe.name), recipe]));
    let matchedCount = 0;
    let unmatchedCount = 0;

    const parsedRows: ParsedSalesRow[] = rows
        .map((row, index) => {
            const itemName = String(row[itemNameKey] ?? "").trim();
            const quantitySold = toNumberOrNull(row[quantityKey]) ?? 0;

            if (!itemName || quantitySold <= 0) return null;

            const recipe = recipesByName.get(normalizeName(itemName));
            if (recipe) {
                matchedCount += 1;
            } else {
                unmatchedCount += 1;
            }

            return {
                rowNumber: index + 2,
                itemName,
                quantitySold,
                unitPrice: unitPriceKey ? toNumberOrNull(row[unitPriceKey]) : null,
                revenue: revenueKey ? toNumberOrNull(row[revenueKey]) : null,
                recipeId: recipe?.id ?? null,
            };
        })
        .filter((row): row is ParsedSalesRow => row !== null);

    return { rows: parsedRows, matchedCount, unmatchedCount };
}
