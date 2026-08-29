import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDataDb, nowIso } from "../../../lib/db";
import { requireAuth } from "../../../lib/session";
import type { Recipe } from "../../../lib/types";

type RecipeRow = { id: string; name: string; category: string | null; created_at: string; updated_at: string };
type IngredientRow = { id: string; recipe_id: string; product_id: string; product_name: string; quantity: number; stock_unit: string | null };

type RecipeIngredientInput = {
    productId: string;
    quantity: number;
    productName?: string;
    stockUnit?: string;
};

type RecipeInput = {
    name: string;
    category?: string;
    ingredients: RecipeIngredientInput[];
};

function mapRecipe(row: RecipeRow, ingredientRows: IngredientRow[]): Recipe {
    return {
        id: row.id,
        name: row.name,
        category: row.category ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ingredients: ingredientRows
            .filter((ingredient) => ingredient.recipe_id === row.id)
            .map((ingredient) => ({
                id: ingredient.id,
                productId: ingredient.product_id,
                quantity: ingredient.quantity,
            })),
    };
}

export function insertRecipe(input: RecipeInput, isDemo: boolean): Recipe {
    const db = getDataDb(isDemo);
    const now = nowIso();
    const recipeId = createRecordId("recipe");

    const insertRecipeStmt = db.prepare(
        "INSERT INTO recipes (id, name, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    );
    const insertIngredientStmt = db.prepare(
        "INSERT INTO recipe_ingredients (id, recipe_id, product_id, product_name, quantity, stock_unit) VALUES (?, ?, ?, ?, ?, ?)"
    );

    const run = db.transaction(() => {
        insertRecipeStmt.run(recipeId, input.name, input.category ?? null, now, now);

        for (const ingredient of input.ingredients) {
            if (!ingredient.productId || !(ingredient.quantity > 0)) continue;

            insertIngredientStmt.run(
                createRecordId("ing"),
                recipeId,
                ingredient.productId,
                ingredient.productName ?? ingredient.productId,
                ingredient.quantity,
                ingredient.stockUnit ?? null
            );
        }
    });

    run();

    const recipeRow = db.prepare("SELECT * FROM recipes WHERE id = ?").get(recipeId) as RecipeRow;
    const ingredientRows = db
        .prepare("SELECT * FROM recipe_ingredients WHERE recipe_id = ?")
        .all(recipeId) as IngredientRow[];

    return mapRecipe(recipeRow, ingredientRows);
}

export async function GET(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const db = getDataDb(auth.account.role === "demo");
    const recipeRows = db.prepare("SELECT * FROM recipes ORDER BY created_at DESC").all() as RecipeRow[];
    const ingredientRows = db.prepare("SELECT * FROM recipe_ingredients").all() as IngredientRow[];

    const recipes = recipeRows.map((row) => mapRecipe(row, ingredientRows));

    return NextResponse.json({ recipes });
}

export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);

    if (!body || typeof body.name !== "string" || !body.name.trim() || !Array.isArray(body.ingredients)) {
        return NextResponse.json({ error: "نام رسپی و لیست مواد الزامی است." }, { status: 400 });
    }

    const recipe = insertRecipe(
        {
            name: body.name,
            category: typeof body.category === "string" ? body.category : undefined,
            ingredients: body.ingredients,
        },
        auth.account.role === "demo"
    );

    return NextResponse.json({ recipe });
}
