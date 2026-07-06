"use client";

export type IngredientPrice = {
    productId: string;
    productName: string;
    unitPrice: number;
    stockUnit?: string;
    updatedAt: string;
};

export type ExchangeRates = { usd: number; eur: number; try: number };

export type ExchangeRatesResult =
    | { configured: false }
    | { configured: true; rates: ExchangeRates; fetchedAt: string | null };

export async function fetchIngredientPrices(): Promise<IngredientPrice[]> {
    try {
        const response = await fetch("/api/ingredient-prices", { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.prices) ? (data.prices as IngredientPrice[]) : [];
    } catch {
        return [];
    }
}

export async function saveIngredientPrice(input: {
    productId: string;
    productName: string;
    unitPrice: number;
    stockUnit?: string;
}): Promise<boolean> {
    try {
        const response = await fetch("/api/ingredient-prices", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        return response.ok;
    } catch {
        return false;
    }
}

export async function fetchExchangeRates(): Promise<ExchangeRatesResult> {
    try {
        const response = await fetch("/api/exchange-rates", { cache: "no-store" });
        if (!response.ok) return { configured: false };

        return (await response.json()) as ExchangeRatesResult;
    } catch {
        return { configured: false };
    }
}
