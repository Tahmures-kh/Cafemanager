"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentAccount, type CurrentAccount } from "./auth-api";
import {
    adjustInventoryProductQuantity,
    createCafeOrder,
    createInventoryProduct,
    deleteInventoryProduct,
    fetchInventoryData,
    fetchOrdersData,
    fillCafeOrderRequestedQuantities,
    updateCafeOrderStatus,
    updateInventoryProductApi,
    updateOrderItemPackedQuantity,
} from "./storage-api";
import type {
    CafeOrder,
    InventoryItem,
    OrderItem,
    OrderStatus,
    Product,
    ProductCategory,
    StockMovement,
} from "./types";
import { products as seedProducts } from "./mock-data";

export type CreateOrderInput = {
    note?: string;
    items: Array<{
        productId: string;
        requestedQuantity: number;
    }>;
};

export type InventoryProductInput = {
    name: string;
    category: ProductCategory;
    unit: string;
    stockUnit?: string;
    orderUnit?: string;
    orderUnitQuantity?: number;
    orderQuantityStep?: number;
    currentQuantity: number;
    minimumQuantity?: number;
    criticalQuantity?: number;
    correctionReason?: string;
};

export type CafeStorageStoreState = {
    products: Product[];
    orders: CafeOrder[];
    orderItems: OrderItem[];
    inventoryItems: InventoryItem[];
    stockMovements: StockMovement[];
};

export type CafeStorageStore = CafeStorageStoreState & {
    createOrder: (input: CreateOrderInput) => Promise<CafeOrder | null>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
    updatePackedQuantity: (orderId: string, orderItemId: string, packedQuantity: number) => Promise<boolean>;
    fillRequestedQuantities: (orderId: string) => Promise<boolean>;
    cancelOrder: (orderId: string) => Promise<boolean>;
    confirmReceived: (orderId: string) => Promise<boolean>;
    addInventoryProduct: (input: InventoryProductInput) => Promise<boolean>;
    updateInventoryProduct: (productId: string, input: InventoryProductInput) => Promise<boolean>;
    adjustInventoryQuantity: (productId: string, deltaQuantity: number, reason?: string) => Promise<boolean>;
    removeInventoryProduct: (productId: string) => Promise<boolean>;
};

const emptyState: CafeStorageStoreState = {
    products: [],
    orders: [],
    orderItems: [],
    inventoryItems: [],
    stockMovements: [],
};

async function loadAllState(): Promise<CafeStorageStoreState> {
    const [inventory, orders] = await Promise.all([fetchInventoryData(), fetchOrdersData()]);

    return {
        products: inventory.products,
        inventoryItems: inventory.inventoryItems,
        stockMovements: inventory.movements,
        orders: orders.orders,
        orderItems: orders.items,
    };
}

export function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

const FAVORITES_KEY = "cafe-storage-mvp-favorites-v1";
const FAVORITES_EVENT = "cafe-storage-mvp-favorites-updated";

function readFavoritesFromStorage(): string[] {
    if (typeof window === "undefined") return [];

    try {
        const raw = window.localStorage.getItem(FAVORITES_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
        return [];
    }
}

function writeFavoritesToStorage(ids: string[]) {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export type FavoriteProducts = {
    favoriteIds: string[];
    isFavorite: (productId: string) => boolean;
    toggleFavorite: (productId: string) => void;
};

/**
 * Staff "favorite / frequently ordered" products, used for the quick-reorder
 * shelf on /staff/request. Kept as its own localStorage key so it survives
 * independently from the real order/inventory data and does not need a
 * database table for what's purely a per-device UI convenience.
 */
export function useFavoriteProducts(): FavoriteProducts {
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

    const refresh = useCallback(() => {
        setFavoriteIds(readFavoritesFromStorage());
    }, []);

    useEffect(() => {
        refresh();

        function handleExternalUpdate() {
            refresh();
        }

        window.addEventListener("storage", handleExternalUpdate);
        window.addEventListener(FAVORITES_EVENT, handleExternalUpdate);

        return () => {
            window.removeEventListener("storage", handleExternalUpdate);
            window.removeEventListener(FAVORITES_EVENT, handleExternalUpdate);
        };
    }, [refresh]);

    const isFavorite = useCallback(
        (productId: string) => favoriteIds.includes(productId),
        [favoriteIds]
    );

    const toggleFavorite = useCallback((productId: string) => {
        const current = readFavoritesFromStorage();
        const next = current.includes(productId)
            ? current.filter((id) => id !== productId)
            : [...current, productId];

        writeFavoritesToStorage(next);
        setFavoriteIds(next);
    }, []);

    return { favoriteIds, isFavorite, toggleFavorite };
}

const UNIT_TYPES_KEY = "cafe-storage-mvp-unit-types-v1";
const UNIT_TYPES_EVENT = "cafe-storage-mvp-unit-types-updated";

const seedUnitTypes: string[] = (() => {
    const values = new Set<string>(["کیلوگرم", "لیتر", "عدد", "بسته", "وزن"]);

    seedProducts.forEach((product) => {
        if (product.unit) values.add(product.unit);
        if (product.stockUnit) values.add(product.stockUnit);
        if (product.orderUnit) values.add(product.orderUnit);
    });

    return Array.from(values);
})();

function readUnitTypesFromStorage(): string[] {
    if (typeof window === "undefined") return [];

    try {
        const raw = window.localStorage.getItem(UNIT_TYPES_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
    } catch {
        return [];
    }
}

function writeUnitTypesToStorage(values: string[]) {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(UNIT_TYPES_KEY, JSON.stringify(values));
    window.dispatchEvent(new Event(UNIT_TYPES_EVENT));
}

export type UnitTypes = {
    unitTypes: string[];
    addUnitType: (name: string) => void;
};

/**
 * Storage-managed list of unit-of-measure types (کیلوگرم، لیتر، عدد...) offered
 * when adding a product, so storage staff pick from a consistent list instead
 * of free-typing a new string per item. Custom additions persist in their own
 * localStorage key — a per-device convenience list, not core business data.
 */
export function useUnitTypes(): UnitTypes {
    const [customUnitTypes, setCustomUnitTypes] = useState<string[]>([]);

    const refresh = useCallback(() => {
        setCustomUnitTypes(readUnitTypesFromStorage());
    }, []);

    useEffect(() => {
        refresh();

        function handleExternalUpdate() {
            refresh();
        }

        window.addEventListener("storage", handleExternalUpdate);
        window.addEventListener(UNIT_TYPES_EVENT, handleExternalUpdate);

        return () => {
            window.removeEventListener("storage", handleExternalUpdate);
            window.removeEventListener(UNIT_TYPES_EVENT, handleExternalUpdate);
        };
    }, [refresh]);

    const addUnitType = useCallback((name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const current = readUnitTypesFromStorage();

        if (seedUnitTypes.includes(trimmed) || current.includes(trimmed)) {
            setCustomUnitTypes(current);
            return;
        }

        const next = [...current, trimmed];
        writeUnitTypesToStorage(next);
        setCustomUnitTypes(next);
    }, []);

    const unitTypes = useMemo(
        () => Array.from(new Set([...seedUnitTypes, ...customUnitTypes])).sort((a, b) => a.localeCompare(b, "fa")),
        [customUnitTypes]
    );

    return { unitTypes, addUnitType };
}

/**
 * Products, inventory, orders and stock movements — backed by the real
 * database via /api/inventory and /api/orders (see lib/storage-api.ts).
 * Every mutation is attributed to whichever account is actually logged in
 * (fetched once via getCurrentAccount()), not a hardcoded placeholder user.
 */
export function useCafeStorageStore(): CafeStorageStore {
    const [state, setState] = useState<CafeStorageStoreState>(emptyState);
    const [account, setAccount] = useState<CurrentAccount | null>(null);

    const refresh = useCallback(async () => {
        setState(await loadAllState());
    }, []);

    useEffect(() => {
        refresh();
        getCurrentAccount().then(setAccount);
    }, [refresh]);

    const actorName = account?.displayName ?? account?.username ?? "کاربر";

    const createOrder = useCallback(
        async (input: CreateOrderInput) => {
            const finalItems = input.items.filter((item) => item.requestedQuantity > 0);
            if (finalItems.length === 0) return null;

            const result = await createCafeOrder({
                requestedBy: actorName,
                note: input.note?.trim() || undefined,
                items: finalItems,
            });

            if (!result) return null;

            await refresh();
            return result.order;
        },
        [actorName, refresh]
    );

    const updateOrderStatus = useCallback(
        async (orderId: string, status: OrderStatus) => {
            const result = await updateCafeOrderStatus(orderId, status, actorName);
            if (!result) return false;

            await refresh();
            return true;
        },
        [actorName, refresh]
    );

    const updatePackedQuantity = useCallback(
        async (orderId: string, orderItemId: string, packedQuantity: number) => {
            const result = await updateOrderItemPackedQuantity(orderId, orderItemId, packedQuantity);
            if (!result) return false;

            await refresh();
            return true;
        },
        [refresh]
    );

    const fillRequestedQuantities = useCallback(
        async (orderId: string) => {
            const result = await fillCafeOrderRequestedQuantities(orderId);
            if (!result) return false;

            await refresh();
            return true;
        },
        [refresh]
    );

    const cancelOrder = useCallback((orderId: string) => updateOrderStatus(orderId, "cancelled"), [updateOrderStatus]);

    const confirmReceived = useCallback((orderId: string) => updateOrderStatus(orderId, "received"), [updateOrderStatus]);

    const addInventoryProduct = useCallback(
        async (input: InventoryProductInput) => {
            const name = input.name.trim();
            const unit = input.unit.trim();
            if (!name || !unit) return false;

            const result = await createInventoryProduct({ ...input, name, unit, createdBy: actorName });
            if (!result) return false;

            await refresh();
            return true;
        },
        [actorName, refresh]
    );

    const updateInventoryProduct = useCallback(
        async (productId: string, input: InventoryProductInput) => {
            const name = input.name.trim();
            const unit = input.unit.trim();
            if (!name || !unit) return false;

            const result = await updateInventoryProductApi(productId, { ...input, name, unit, createdBy: actorName });
            if (!result) return false;

            await refresh();
            return true;
        },
        [actorName, refresh]
    );

    const adjustInventoryQuantity = useCallback(
        async (productId: string, deltaQuantity: number, reason?: string) => {
            if (!Number.isFinite(deltaQuantity) || deltaQuantity === 0) return false;

            const result = await adjustInventoryProductQuantity(productId, deltaQuantity, reason, actorName);
            if (!result) return false;

            await refresh();
            return true;
        },
        [actorName, refresh]
    );

    const removeInventoryProduct = useCallback(
        async (productId: string) => {
            const success = await deleteInventoryProduct(productId, actorName);
            if (!success) return false;

            await refresh();
            return true;
        },
        [actorName, refresh]
    );

    return {
        ...state,
        createOrder,
        updateOrderStatus,
        updatePackedQuantity,
        fillRequestedQuantities,
        cancelOrder,
        confirmReceived,
        addInventoryProduct,
        updateInventoryProduct,
        adjustInventoryQuantity,
        removeInventoryProduct,
    };
}
