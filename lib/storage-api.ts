"use client";

import type {
    CafeOrder,
    InventoryItem,
    OrderItem,
    OrderStatus,
    Product,
    StockMovement,
    WorkshopAllocation,
    WorkshopDepartment,
} from "./types";

export type InventoryData = {
    products: Product[];
    inventoryItems: InventoryItem[];
    movements: StockMovement[];
};

export async function fetchUnitTypes(): Promise<string[]> {
    try {
        const response = await fetch("/api/unit-types", { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.unitTypes) ? (data.unitTypes as string[]) : [];
    } catch {
        return [];
    }
}

export async function createUnitType(name: string): Promise<string[]> {
    try {
        const response = await fetch("/api/unit-types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.unitTypes) ? (data.unitTypes as string[]) : [];
    } catch {
        return [];
    }
}

export async function fetchLowStockThreshold(): Promise<number> {
    try {
        const response = await fetch("/api/settings/low-stock-threshold", { cache: "no-store" });
        if (!response.ok) return 20;

        const data = await response.json();
        return typeof data.percent === "number" ? data.percent : 20;
    } catch {
        return 20;
    }
}

export async function updateLowStockThreshold(percent: number): Promise<number | null> {
    try {
        const response = await fetch("/api/settings/low-stock-threshold", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ percent }),
        });
        if (!response.ok) return null;

        const data = await response.json();
        return typeof data.percent === "number" ? data.percent : null;
    } catch {
        return null;
    }
}

export async function fetchWorkshopAllocations(): Promise<WorkshopAllocation[]> {
    try {
        const response = await fetch("/api/workshop-allocations", { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.allocations) ? (data.allocations as WorkshopAllocation[]) : [];
    } catch {
        return [];
    }
}

export type CreateWorkshopAllocationInput = {
    department: WorkshopDepartment;
    productId: string;
    quantity: number;
    createdBy?: string;
};

export async function createWorkshopAllocation(
    input: CreateWorkshopAllocationInput
): Promise<{ ok: true; allocation: WorkshopAllocation } | { ok: false; error: string }> {
    try {
        const response = await fetch("/api/workshop-allocations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data) {
            return { ok: false, error: data?.error ?? "ثبت تخصیص ناموفق بود." };
        }

        return { ok: true, allocation: data.allocation as WorkshopAllocation };
    } catch {
        return { ok: false, error: "ارتباط با سرور برقرار نشد." };
    }
}

export async function fetchInventoryData(): Promise<InventoryData> {
    try {
        const response = await fetch("/api/inventory", { cache: "no-store" });
        if (!response.ok) return { products: [], inventoryItems: [], movements: [] };

        const data = await response.json();
        return {
            products: Array.isArray(data.products) ? (data.products as Product[]) : [],
            inventoryItems: Array.isArray(data.inventoryItems) ? (data.inventoryItems as InventoryItem[]) : [],
            movements: Array.isArray(data.movements) ? (data.movements as StockMovement[]) : [],
        };
    } catch {
        return { products: [], inventoryItems: [], movements: [] };
    }
}

export type InventoryProductPayload = {
    name: string;
    category: string;
    unit: string;
    stockUnit?: string;
    orderUnit?: string;
    orderUnitQuantity?: number;
    orderQuantityStep?: number;
    currentQuantity: number;
    minimumQuantity?: number;
    criticalQuantity?: number;
    correctionReason?: string;
    createdBy?: string;
};

export async function createInventoryProduct(
    input: InventoryProductPayload
): Promise<{ product: Product; inventoryItem: InventoryItem } | null> {
    try {
        const response = await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!response.ok) return null;

        return (await response.json()) as { product: Product; inventoryItem: InventoryItem };
    } catch {
        return null;
    }
}

export async function updateInventoryProductApi(
    productId: string,
    input: InventoryProductPayload
): Promise<{ product: Product; inventoryItem: InventoryItem } | null> {
    try {
        const response = await fetch(`/api/inventory/${productId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!response.ok) return null;

        return (await response.json()) as { product: Product; inventoryItem: InventoryItem };
    } catch {
        return null;
    }
}

export async function deleteInventoryProduct(productId: string, createdBy?: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/inventory/${productId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ createdBy }),
        });
        return response.ok;
    } catch {
        return false;
    }
}

export async function adjustInventoryProductQuantity(
    productId: string,
    deltaQuantity: number,
    reason?: string,
    createdBy?: string
): Promise<{ inventoryItem: InventoryItem; movement: StockMovement } | null> {
    try {
        const response = await fetch(`/api/inventory/${productId}/adjust`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deltaQuantity, reason, createdBy }),
        });
        if (!response.ok) return null;

        return (await response.json()) as { inventoryItem: InventoryItem; movement: StockMovement };
    } catch {
        return null;
    }
}

export type OrdersData = {
    orders: CafeOrder[];
    items: OrderItem[];
};

export async function fetchOrdersData(): Promise<OrdersData> {
    try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        if (!response.ok) return { orders: [], items: [] };

        const data = await response.json();
        return {
            orders: Array.isArray(data.orders) ? (data.orders as CafeOrder[]) : [],
            items: Array.isArray(data.items) ? (data.items as OrderItem[]) : [],
        };
    } catch {
        return { orders: [], items: [] };
    }
}

export type CreateOrderPayload = {
    requestedBy: string;
    note?: string;
    items: Array<{ productId: string; requestedQuantity: number }>;
};

export async function createCafeOrder(input: CreateOrderPayload): Promise<{ order: CafeOrder; items: OrderItem[] } | null> {
    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!response.ok) return null;

        return (await response.json()) as { order: CafeOrder; items: OrderItem[] };
    } catch {
        return null;
    }
}

export async function updateCafeOrderStatus(
    orderId: string,
    status: OrderStatus,
    createdBy?: string
): Promise<{ order: CafeOrder; items: OrderItem[] } | null> {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, createdBy }),
        });
        if (!response.ok) return null;

        return (await response.json()) as { order: CafeOrder; items: OrderItem[] };
    } catch {
        return null;
    }
}

export async function fillCafeOrderRequestedQuantities(
    orderId: string
): Promise<{ order: CafeOrder; items: OrderItem[] } | null> {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fillRequested: true }),
        });
        if (!response.ok) return null;

        return (await response.json()) as { order: CafeOrder; items: OrderItem[] };
    } catch {
        return null;
    }
}

export async function updateOrderItemPackedQuantity(
    orderId: string,
    itemId: string,
    packedQuantity: number
): Promise<OrderItem | null> {
    try {
        const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ packedQuantity }),
        });
        if (!response.ok) return null;

        const data = await response.json();
        return (data.item as OrderItem) ?? null;
    } catch {
        return null;
    }
}
