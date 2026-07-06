import type { Product } from "./types";

const RECIPE_NAME_HEADERS = ["نام رسپی", "رسپی", "عنوان رسپی"];
const INGREDIENT_NAME_HEADERS = ["نام ماده اولیه", "ماده اولیه", "نام کالا", "کالا"];
const QUANTITY_HEADERS = ["مقدار", "مقدار مصرفی", "تعداد"];

export type ParsedIngredientRow = {
    rowNumber: number;
    ingredientName: string;
    quantity: number;
    productId: string | null;
    stockUnit: string | null;
};

export type ParsedRecipePreview = {
    name: string;
    category?: string;
    rows: ParsedIngredientRow[];
};

export type RecipeExcelParseResult = {
    recipes: ParsedRecipePreview[];
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

function toQuantity(value: unknown) {
    const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Groups raw spreadsheet rows (output of XLSX.utils.sheet_to_json) into
 * recipes by matching recipe-name across rows, and resolves each ingredient
 * row's product by exact (trimmed, case-insensitive) name match against the
 * current product list. Rows whose ingredient name has no matching product
 * are kept (productId: null) so the caller can show them as unmatched in a
 * preview instead of silently dropping them.
 */
export function parseRecipeExcelRows(
    rows: Record<string, unknown>[],
    products: Product[]
): RecipeExcelParseResult {
    if (rows.length === 0) return { recipes: [], matchedCount: 0, unmatchedCount: 0 };

    const recipeNameKey = findColumnKey(rows[0], RECIPE_NAME_HEADERS);
    const ingredientNameKey = findColumnKey(rows[0], INGREDIENT_NAME_HEADERS);
    const quantityKey = findColumnKey(rows[0], QUANTITY_HEADERS);

    if (!recipeNameKey || !ingredientNameKey || !quantityKey) {
        throw new Error(
            "ستون‌های مورد نیاز پیدا نشد. فایل باید ستون‌های «نام رسپی»، «نام ماده اولیه» و «مقدار» را داشته باشد."
        );
    }

    const productsByName = new Map(products.map((product) => [normalizeName(product.name), product]));
    const recipesByName = new Map<string, ParsedRecipePreview>();
    let matchedCount = 0;
    let unmatchedCount = 0;

    rows.forEach((row, index) => {
        const recipeName = String(row[recipeNameKey] ?? "").trim();
        const ingredientName = String(row[ingredientNameKey] ?? "").trim();
        const quantity = toQuantity(row[quantityKey]);

        if (!recipeName || !ingredientName) return;

        const product = productsByName.get(normalizeName(ingredientName));
        if (product) {
            matchedCount += 1;
        } else {
            unmatchedCount += 1;
        }

        const key = normalizeName(recipeName);
        const existing = recipesByName.get(key);
        const ingredientRow: ParsedIngredientRow = {
            rowNumber: index + 2,
            ingredientName,
            quantity,
            productId: product?.id ?? null,
            stockUnit: product?.stockUnit ?? product?.unit ?? null,
        };

        if (existing) {
            existing.rows.push(ingredientRow);
        } else {
            recipesByName.set(key, { name: recipeName, rows: [ingredientRow] });
        }
    });

    return {
        recipes: Array.from(recipesByName.values()),
        matchedCount,
        unmatchedCount,
    };
}
