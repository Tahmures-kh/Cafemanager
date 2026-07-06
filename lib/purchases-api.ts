"use client";

import type { PurchaseOrder, Supplier } from "./types";

export type SupplierInput = {
    name: string;
    phone: string;
    website?: string;
    notes?: string;
};

export type PurchaseOrderItemInput = {
    productId?: string;
    productName: string;
    quantity: number;
    stockUnit?: string;
};

export type PurchaseOrderInput = {
    supplierId: string;
    createdBy?: string;
    items: PurchaseOrderItemInput[];
};

export async function fetchSuppliers(): Promise<Supplier[]> {
    try {
        const response = await fetch("/api/suppliers", { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.suppliers) ? (data.suppliers as Supplier[]) : [];
    } catch {
        return [];
    }
}

export async function createSupplier(input: SupplierInput): Promise<Supplier | null> {
    try {
        const response = await fetch("/api/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!response.ok) return null;

        const data = await response.json();
        return (data.supplier as Supplier) ?? null;
    } catch {
        return null;
    }
}

export async function updateSupplier(supplierId: string, input: SupplierInput): Promise<Supplier | null> {
    try {
        const response = await fetch(`/api/suppliers/${supplierId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!response.ok) return null;

        const data = await response.json();
        return (data.supplier as Supplier) ?? null;
    } catch {
        return null;
    }
}

export async function deleteSupplier(supplierId: string): Promise<void> {
    try {
        await fetch(`/api/suppliers/${supplierId}`, { method: "DELETE" });
    } catch {
        // best-effort
    }
}

export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
        const response = await fetch("/api/purchases", { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.orders) ? (data.orders as PurchaseOrder[]) : [];
    } catch {
        return [];
    }
}

export type CreatePurchaseOrderResult =
    | { ok: true; order: PurchaseOrder; smsError?: string }
    | { ok: false; error: string };

export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<CreatePurchaseOrderResult> {
    try {
        const response = await fetch("/api/purchases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data) {
            return { ok: false, error: data?.error ?? "ثبت سفارش ناموفق بود." };
        }

        return { ok: true, order: data.order as PurchaseOrder, smsError: data.smsError };
    } catch {
        return { ok: false, error: "ارتباط با سرور برقرار نشد." };
    }
}

export async function resendPurchaseOrderSms(orderId: string): Promise<PurchaseOrder | null> {
    try {
        const response = await fetch(`/api/purchases/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resendSms: true }),
        });
        if (!response.ok) return null;

        const data = await response.json();
        return (data.order as PurchaseOrder) ?? null;
    } catch {
        return null;
    }
}

export async function updatePurchaseOrderStatus(orderId: string, status: string): Promise<PurchaseOrder | null> {
    try {
        const response = await fetch(`/api/purchases/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) return null;

        const data = await response.json();
        return (data.order as PurchaseOrder) ?? null;
    } catch {
        return null;
    }
}
