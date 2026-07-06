"use client";

import type { SalesBatch } from "./types";

export type SalesItemInput = {
    itemName: string;
    quantitySold: number;
    unitPrice?: number | null;
    revenue?: number | null;
    recipeId?: string | null;
};

export type SalesBatchInput = {
    shiftDate: string;
    shiftLabel?: string;
    sourceType: "excel" | "csv" | "image";
    sourceFileName?: string;
    importedBy?: string;
    items: SalesItemInput[];
};

export type ExtractedSalesItem = {
    itemName: string;
    quantitySold: number;
    unitPrice: number | null;
    revenue: number | null;
};

export async function fetchSalesBatches(range?: { from: string; to: string }): Promise<SalesBatch[]> {
    try {
        const query = range ? `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}` : "";
        const response = await fetch(`/api/sales${query}`, { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.batches) ? (data.batches as SalesBatch[]) : [];
    } catch {
        return [];
    }
}

export async function importSalesBatch(input: SalesBatchInput): Promise<SalesBatch | null> {
    try {
        const response = await fetch("/api/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!response.ok) return null;

        const data = await response.json();
        return (data.batch as SalesBatch) ?? null;
    } catch {
        return null;
    }
}

export type ExtractSalesFromImageResult =
    | { ok: true; items: ExtractedSalesItem[] }
    | { ok: false; error: string };

export async function extractSalesFromImage(file: File): Promise<ExtractSalesFromImageResult> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/sales/extract-image", { method: "POST", body: formData });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data) {
            return { ok: false, error: data?.error ?? "خواندن عکس ناموفق بود." };
        }

        return { ok: true, items: Array.isArray(data.items) ? (data.items as ExtractedSalesItem[]) : [] };
    } catch {
        return { ok: false, error: "ارتباط با سرویس تشخیص تصویر برقرار نشد." };
    }
}
