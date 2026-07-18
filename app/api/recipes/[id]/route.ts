import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../../lib/db";
import { requireAuth } from "../../../../lib/session";
import type { Recipe } from "../../../../lib/types";

type RecipeRow = { id: string; name: string; category: string | null; created_at: string; updated_at: string };
type IngredientRow = { id: string; recipe_id: string; product_id: string; product_name: string; quantity: number; stock_unit: string | null };

function mapRecipe(row: RecipeRow, ingredientRows: IngredientRow[]): Recipe {
    return {
        id: row.id,
        name: row.name,
        category: row.category ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ingredients: ingredientRows.map((ingredient) => ({
            id: ingredient.id,
            productId: ingredient.product_id,
            quantity: ingredient.quantity,
        })),
    };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body.name !== "string" || !body.name.trim() || !Array.isArray(body.ingredients)) {
        return NextResponse.json({ error: "نام رسپی و لیست مواد الزامی است." }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id) as RecipeRow | undefined;

    if (!existing) {
        return NextResponse.json({ error: "رسپی پیدا نشد." }, { status: 404 });
    }

    const now = nowIso();
    const updateRecipeStmt = db.prepare(
        "UPDATE recipes SET name = ?, category = ?, updated_at = ? WHERE id = ?"
    );
    const deleteIngredientsStmt = db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?");
    const insertIngredientStmt = db.prepare(
        "INSERT INTO recipe_ingredients (id, recipe_id, product_id, product_name, quantity, stock_unit) VALUES (?, ?, ?, ?, ?, ?)"
    );

    const run = db.transaction(() => {
        updateRecipeStmt.run(body.name, body.category ?? null, now, id);
        deleteIngredientsStmt.run(id);

        for (const ingredient of body.ingredients) {
            if (!ingredient.productId || !(ingredient.quantity > 0)) continue;

            insertIngredientStmt.run(
                createRecordId("ing"),
                id,
                ingredient.productId,
                ingredient.productName ?? ingredient.productId,
                ingredient.quantity,
                ingredient.stockUnit ?? null
            );
        }
    });

    run();

    const recipeRow = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id) as RecipeRow;
    const ingredientRows = db.prepare("SELECT * FROM recipe_ingredients WHERE recipe_id = ?").all(id) as IngredientRow[];

    return NextResponse.json({ recipe: mapRecipe(recipeRow, ingredientRows) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const db = getDb();

    db.prepare("DELETE FROM recipes WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
}
