"use client";

import { useCallback, useEffect, useState } from "react";
import type { Recipe } from "./types";

export type RecipeIngredientInput = {
    productId: string;
    quantity: number;
    productName?: string;
    stockUnit?: string;
};

export type RecipeInput = {
    name: string;
    category?: string;
    ingredients: RecipeIngredientInput[];
};

async function fetchRecipes(): Promise<Recipe[]> {
    try {
        const response = await fetch("/api/recipes", { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.recipes) ? (data.recipes as Recipe[]) : [];
    } catch {
        return [];
    }
}

export type RecipeStore = {
    recipes: Recipe[];
    addRecipe: (input: RecipeInput) => Promise<Recipe | null>;
    updateRecipe: (recipeId: string, input: RecipeInput) => Promise<Recipe | null>;
    deleteRecipe: (recipeId: string) => Promise<void>;
    importRecipes: (inputs: RecipeInput[]) => Promise<Recipe[]>;
};

/** Recipes now live in the SQLite database (see lib/db.ts) rather than localStorage. */
export function useRecipes(): RecipeStore {
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    const refresh = useCallback(async () => {
        setRecipes(await fetchRecipes());
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const addRecipe = useCallback(async (input: RecipeInput) => {
        const name = input.name.trim();
        if (!name) return null;

        try {
            const response = await fetch("/api/recipes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...input, name }),
            });
            if (!response.ok) return null;

            const data = await response.json();
            await refresh();
            return (data.recipe as Recipe) ?? null;
        } catch {
            return null;
        }
    }, [refresh]);

    const updateRecipe = useCallback(async (recipeId: string, input: RecipeInput) => {
        const name = input.name.trim();
        if (!name) return null;

        try {
            const response = await fetch(`/api/recipes/${recipeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...input, name }),
            });
            if (!response.ok) return null;

            const data = await response.json();
            await refresh();
            return (data.recipe as Recipe) ?? null;
        } catch {
            return null;
        }
    }, [refresh]);

    const deleteRecipe = useCallback(async (recipeId: string) => {
        try {
            await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
        } finally {
            await refresh();
        }
    }, [refresh]);

    const importRecipes = useCallback(async (inputs: RecipeInput[]) => {
        try {
            const response = await fetch("/api/recipes/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipes: inputs }),
            });
            if (!response.ok) return [];

            const data = await response.json();
            await refresh();
            return Array.isArray(data.recipes) ? (data.recipes as Recipe[]) : [];
        } catch {
            return [];
        }
    }, [refresh]);

    return { recipes, addRecipe, updateRecipe, deleteRecipe, importRecipes };
}
