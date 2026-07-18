import { NextRequest, NextResponse } from "next/server";
import { insertRecipe } from "../route";
import { requireAuth } from "../../../../lib/session";
import type { Recipe } from "../../../../lib/types";

export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.recipes)) {
        return NextResponse.json({ error: "لیست رسپی‌ها الزامی است." }, { status: 400 });
    }

    const recipes: Recipe[] = [];

    for (const input of body.recipes) {
        if (!input || typeof input.name !== "string" || !input.name.trim() || !Array.isArray(input.ingredients)) {
            continue;
        }

        recipes.push(
            insertRecipe({
                name: input.name,
                category: typeof input.category === "string" ? input.category : undefined,
                ingredients: input.ingredients,
            })
        );
    }

    return NextResponse.json({ recipes });
}
