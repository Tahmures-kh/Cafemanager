"use client";

import { useCallback, useEffect, useState } from "react";
import type { Recipe, RecipeIngredient } from "./types";

const RECIPES_KEY = "cafe-storage-mvp-recipes-v1";
const RECIPES_EVENT = "cafe-storage-mvp-recipes-updated";

export type RecipeIngredientInput = {
    productId: string;
    quantity: number;
};

export type RecipeInput = {
    name: string;
    category?: string;
    ingredients: RecipeIngredientInput[];
};

function nowIso() {
    return new Date().toISOString();
}

function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeQuantity(value: number) {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeIngredients(ingredients: RecipeIngredientInput[]): RecipeIngredient[] {
    return ingredients
        .filter((ingredient) => ingredient.productId && safeQuantity(ingredient.quantity) > 0)
        .map((ingredient) => ({
            id: createId("ing"),
            productId: ingredient.productId,
            quantity: safeQuantity(ingredient.quantity),
        }));
}

function readRecipesFromStorage(): Recipe[] {
    if (typeof window === "undefined") return [];

    try {
        const raw = window.localStorage.getItem(RECIPES_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as Recipe[]) : [];
    } catch {
        return [];
    }
}

function writeRecipesToStorage(recipes: Recipe[]) {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
    window.dispatchEvent(new Event(RECIPES_EVENT));
}

export type RecipeStore = {
    recipes: Recipe[];
    addRecipe: (input: RecipeInput) => Recipe | null;
    updateRecipe: (recipeId: string, input: RecipeInput) => void;
    deleteRecipe: (recipeId: string) => void;
    importRecipes: (inputs: RecipeInput[]) => Recipe[];
};

/**
 * Recipes (رسپی‌ها) kept in their own localStorage key, independent from the
 * main inventory/order store — mirrors useFavoriteProducts/useUnitTypes in
 * local-store.ts.
 */
export function useRecipes(): RecipeStore {
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    const refresh = useCallback(() => {
        setRecipes(readRecipesFromStorage());
    }, []);

    useEffect(() => {
        refresh();

        function handleExternalUpdate() {
            refresh();
        }

        window.addEventListener("storage", handleExternalUpdate);
        window.addEventListener(RECIPES_EVENT, handleExternalUpdate);

        return () => {
            window.removeEventListener("storage", handleExternalUpdate);
            window.removeEventListener(RECIPES_EVENT, handleExternalUpdate);
        };
    }, [refresh]);

    const addRecipe = useCallback((input: RecipeInput) => {
        const name = input.name.trim();
        if (!name) return null;

        const now = nowIso();
        const recipe: Recipe = {
            id: createId("recipe"),
            name,
            category: input.category?.trim() || undefined,
            ingredients: normalizeIngredients(input.ingredients),
            createdAt: now,
            updatedAt: now,
        };

        const current = readRecipesFromStorage();
        const next = [recipe, ...current];
        writeRecipesToStorage(next);
        setRecipes(next);

        return recipe;
    }, []);

    const updateRecipe = useCallback((recipeId: string, input: RecipeInput) => {
        const name = input.name.trim();
        if (!name) return;

        const current = readRecipesFromStorage();
        const next = current.map((recipe) =>
            recipe.id === recipeId
                ? {
                    ...recipe,
                    name,
                    category: input.category?.trim() || undefined,
                    ingredients: normalizeIngredients(input.ingredients),
                    updatedAt: nowIso(),
                }
                : recipe
        );

        writeRecipesToStorage(next);
        setRecipes(next);
    }, []);

    const deleteRecipe = useCallback((recipeId: string) => {
        const current = readRecipesFromStorage();
        const next = current.filter((recipe) => recipe.id !== recipeId);

        writeRecipesToStorage(next);
        setRecipes(next);
    }, []);

    const importRecipes = useCallback((inputs: RecipeInput[]) => {
        const now = nowIso();
        const newRecipes: Recipe[] = inputs
            .filter((input) => input.name.trim())
            .map((input) => ({
                id: createId("recipe"),
                name: input.name.trim(),
                category: input.category?.trim() || undefined,
                ingredients: normalizeIngredients(input.ingredients),
                createdAt: now,
                updatedAt: now,
            }));

        if (newRecipes.length === 0) return [];

        const current = readRecipesFromStorage();
        const next = [...newRecipes, ...current];
        writeRecipesToStorage(next);
        setRecipes(next);

        return newRecipes;
    }, []);

    return { recipes, addRecipe, updateRecipe, deleteRecipe, importRecipes };
}
