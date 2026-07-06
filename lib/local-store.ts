"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    cafeOrders as initialCafeOrders,
    inventoryItems as initialInventoryItems,
    orderItems as initialOrderItems,
    products as initialProducts,
    stockMovements as initialStockMovements,
} from "./mock-data";
import type {
    CafeOrder,
    InventoryItem,
    OrderItem,
    OrderStatus,
    Product,
    ProductCategory,
    StockMovement,
} from "./types";
import { normalizeOrderQuantity, orderToStockQuantity, stockToOrderQuantity, getOrderUnit, formatNumber as formatUnitNumber } from "./product-units";

const STORE_KEY = "cafe-storage-mvp-store-v7-partial-package-display";
const STORE_EVENT = "cafe-storage-mvp-store-updated";

export type CreateOrderInput = {
    cafeId: string;
    requestedBy: string;
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
    createOrder: (input: CreateOrderInput) => CafeOrder | null;
    updateOrderStatus: (orderId: string, status: OrderStatus, createdBy?: string) => void;
    updatePackedQuantity: (orderItemId: string, packedQuantity: number) => void;
    fillRequestedQuantities: (orderId: string) => void;
    cancelOrder: (orderId: string) => void;
    confirmReceived: (orderId: string) => void;
    addInventoryProduct: (input: InventoryProductInput) => void;
    updateInventoryProduct: (productId: string, input: InventoryProductInput) => void;
    adjustInventoryQuantity: (productId: string, deltaQuantity: number, reason?: string) => void;
    removeInventoryProduct: (productId: string) => void;
    resetStore: () => void;
};

function cloneInitialState(): CafeStorageStoreState {
    return {
        products: initialProducts.map((product) => ({ ...product })),
        orders: initialCafeOrders.map((order) => ({ ...order })),
        orderItems: initialOrderItems.map((item) => ({ ...item })),
        inventoryItems: initialInventoryItems.map((item) => ({ ...item })),
        stockMovements: initialStockMovements.map((movement) => ({ ...movement })),
    };
}

function nowIso() {
    return new Date().toISOString();
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

function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeNumber(value: number) {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function readStateFromStorage(): CafeStorageStoreState {
    if (typeof window === "undefined") return cloneInitialState();

    const storedValue = window.localStorage.getItem(STORE_KEY);

    if (!storedValue) {
        const initialState = cloneInitialState();
        writeStateToStorage(initialState);
        return initialState;
    }

    try {
        const parsed = JSON.parse(storedValue) as Partial<CafeStorageStoreState>;
        const initialState = cloneInitialState();

        return {
            products: parsed.products ?? initialState.products,
            orders: parsed.orders ?? initialState.orders,
            orderItems: parsed.orderItems ?? initialState.orderItems,
            inventoryItems: parsed.inventoryItems ?? initialState.inventoryItems,
            stockMovements: parsed.stockMovements ?? initialState.stockMovements,
        };
    } catch {
        const initialState = cloneInitialState();
        writeStateToStorage(initialState);
        return initialState;
    }
}

function writeStateToStorage(state: CafeStorageStoreState) {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(STORE_EVENT));
}

function createMovement(input: {
    productId: string;
    type: StockMovement["type"];
    quantity: number;
    description: string;
    createdBy: string;
}): StockMovement {
    return {
        id: createId("sm"),
        productId: input.productId,
        type: input.type,
        quantity: input.quantity,
        description: input.description,
        createdBy: input.createdBy,
        createdAt: nowIso(),
    };
}

function movementForSentOrder(
    order: CafeOrder,
    item: OrderItem,
    product: Product | undefined,
    createdBy: string
): StockMovement | null {
    if (item.packedQuantity <= 0) return null;

    const stockQuantity = orderToStockQuantity(product, item.packedQuantity);

    return createMovement({
        productId: item.productId,
        type: "sent_to_cafe",
        quantity: -stockQuantity,
        description: `تحویل درخواست ${order.id} — ${formatUnitNumber(item.packedQuantity)} ${getOrderUnit(product)}`,
        createdBy,
    });
}

function applySentInventoryUpdate(
    state: CafeStorageStoreState,
    order: CafeOrder,
    createdBy: string
): CafeStorageStoreState {
    const sentItems = state.orderItems
        .filter((item) => item.orderId === order.id)
        .map((item) => {
            const product = state.products.find((productItem) => productItem.id === item.productId);
            const availableStockQuantity = safeNumber(
                state.inventoryItems.find((inventoryItem) => inventoryItem.productId === item.productId)
                    ?.currentQuantity ?? 0
            );
            const availableOrderQuantity = stockToOrderQuantity(product, availableStockQuantity);
            const finalPackedQuantity = Math.min(
                normalizeOrderQuantity(product, item.packedQuantity),
                normalizeOrderQuantity(product, item.requestedQuantity),
                availableOrderQuantity
            );

            return { ...item, packedQuantity: finalPackedQuantity };
        });

    const sentItemsById = new Map(sentItems.map((item) => [item.id, item]));

    const updatedInventoryItems = state.inventoryItems.map((inventoryItem) => {
        const matchingSentItem = sentItems.find(
            (item) => item.productId === inventoryItem.productId
        );

        if (!matchingSentItem) return inventoryItem;

        const product = state.products.find((productItem) => productItem.id === inventoryItem.productId);

        return {
            ...inventoryItem,
            currentQuantity: Math.max(
                0,
                inventoryItem.currentQuantity - orderToStockQuantity(product, matchingSentItem.packedQuantity)
            ),
        };
    });

    const newMovements = sentItems
        .map((item) => movementForSentOrder(
            order,
            item,
            state.products.find((product) => product.id === item.productId),
            createdBy
        ))
        .filter((movement): movement is StockMovement => Boolean(movement));

    return {
        ...state,
        orderItems: state.orderItems.map((item) => sentItemsById.get(item.id) ?? item),
        inventoryItems: updatedInventoryItems,
        stockMovements: [...newMovements, ...state.stockMovements],
    };
}


function getAvailableQuantity(state: CafeStorageStoreState, productId: string) {
    return safeNumber(
        state.inventoryItems.find((item) => item.productId === productId)?.currentQuantity ?? 0
    );
}

function clampPackedQuantity(
    state: CafeStorageStoreState,
    orderItem: OrderItem,
    requestedPackedQuantity: number
) {
    const product = state.products.find((productItem) => productItem.id === orderItem.productId);
    const availableStockQuantity = getAvailableQuantity(state, orderItem.productId);
    const availableOrderQuantity = stockToOrderQuantity(product, availableStockQuantity);
    const requestedQuantity = normalizeOrderQuantity(product, orderItem.requestedQuantity);
    const nextPackedQuantity = normalizeOrderQuantity(product, requestedPackedQuantity);

    return Math.min(requestedQuantity, availableOrderQuantity, nextPackedQuantity);
}

function updateState(updater: (state: CafeStorageStoreState) => CafeStorageStoreState) {
    const currentState = readStateFromStorage();
    const nextState = updater(currentState);
    writeStateToStorage(nextState);
    return nextState;
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
 * independently from store resets and does not bloat the main store payload.
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

    initialProducts.forEach((product) => {
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
 * localStorage key, independent of the main store.
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

export function useCafeStorageStore(): CafeStorageStore {
    const [state, setState] = useState<CafeStorageStoreState>(() => cloneInitialState());

    const refreshState = useCallback(() => {
        setState(readStateFromStorage());
    }, []);

    useEffect(() => {
        refreshState();

        function handleExternalUpdate() {
            refreshState();
        }

        window.addEventListener("storage", handleExternalUpdate);
        window.addEventListener(STORE_EVENT, handleExternalUpdate);

        return () => {
            window.removeEventListener("storage", handleExternalUpdate);
            window.removeEventListener(STORE_EVENT, handleExternalUpdate);
        };
    }, [refreshState]);

    const createOrder = useCallback((input: CreateOrderInput) => {
        const finalItems = input.items.filter((item) => item.requestedQuantity > 0);

        if (finalItems.length === 0) return null;

        const now = nowIso();
        const orderId = createId("order");
        const currentProducts = readStateFromStorage().products;

        const newOrder: CafeOrder = {
            id: orderId,
            cafeId: input.cafeId,
            requestedBy: input.requestedBy,
            status: "pending",
            note: input.note?.trim() || undefined,
            createdAt: now,
            updatedAt: now,
        };

        const newItems: OrderItem[] = finalItems.map((item) => {
            const product = currentProducts.find((productItem) => productItem.id === item.productId);

            return {
                id: createId("item"),
                orderId,
                productId: item.productId,
                requestedQuantity: normalizeOrderQuantity(product, item.requestedQuantity),
                packedQuantity: 0,
            };
        });

        updateState((currentState) => ({
            ...currentState,
            orders: [newOrder, ...currentState.orders],
            orderItems: [...newItems, ...currentState.orderItems],
        }));

        return newOrder;
    }, []);

    const updateOrderStatus = useCallback(
        (orderId: string, status: OrderStatus, createdBy = "u4") => {
            updateState((currentState) => {
                const existingOrder = currentState.orders.find((order) => order.id === orderId);

                if (!existingOrder) return currentState;

                const updatedOrder: CafeOrder = {
                    ...existingOrder,
                    status,
                    updatedAt: nowIso(),
                };

                let nextState: CafeStorageStoreState = {
                    ...currentState,
                    orders: currentState.orders.map((order) =>
                        order.id === orderId ? updatedOrder : order
                    ),
                };

                if (existingOrder.status !== "sent" && status === "sent") {
                    nextState = applySentInventoryUpdate(nextState, updatedOrder, createdBy);
                }

                return nextState;
            });
        },
        []
    );

    const updatePackedQuantity = useCallback(
        (orderItemId: string, packedQuantity: number) => {
            updateState((currentState) => ({
                ...currentState,
                orderItems: currentState.orderItems.map((item) =>
                    item.id === orderItemId
                        ? {
                            ...item,
                            packedQuantity: clampPackedQuantity(currentState, item, packedQuantity),
                        }
                        : item
                ),
            }));
        },
        []
    );

    const fillRequestedQuantities = useCallback((orderId: string) => {
        updateState((currentState) => ({
            ...currentState,
            orderItems: currentState.orderItems.map((item) =>
                item.orderId === orderId
                    ? {
                        ...item,
                        packedQuantity: clampPackedQuantity(currentState, item, item.requestedQuantity),
                    }
                    : item
            ),
        }));
    }, []);

    const cancelOrder = useCallback(
        (orderId: string) => {
            updateOrderStatus(orderId, "cancelled", "u4");
        },
        [updateOrderStatus]
    );

    const confirmReceived = useCallback(
        (orderId: string) => {
            updateOrderStatus(orderId, "received", "u3");
        },
        [updateOrderStatus]
    );

    const addInventoryProduct = useCallback((input: InventoryProductInput) => {
        const name = input.name.trim();
        const unit = input.unit.trim();

        if (!name || !unit) return;

        updateState((currentState) => {
            const productId = createId("p");
            const inventoryId = createId("inv");
            const quantity = safeNumber(input.currentQuantity);

            const stockUnit = (input.stockUnit ?? unit).trim() || unit;
            const orderUnit = (input.orderUnit ?? stockUnit).trim() || stockUnit;
            const orderUnitQuantity = safeNumber(input.orderUnitQuantity ?? 1) || 1;
            const orderQuantityStep = safeNumber(input.orderQuantityStep ?? (orderUnit === stockUnit && orderUnitQuantity === 1 ? 0.001 : 1)) || 1;

            const newProduct: Product = {
                id: productId,
                name,
                category: input.category,
                unit: stockUnit,
                stockUnit,
                orderUnit,
                orderUnitQuantity,
                orderQuantityStep,
            };

            const newInventoryItem: InventoryItem = {
                id: inventoryId,
                productId,
                currentQuantity: quantity,
                minimumQuantity: safeNumber(input.minimumQuantity ?? 0),
                criticalQuantity: safeNumber(input.criticalQuantity ?? 0),
            };

            const movement = createMovement({
                productId,
                type: "stock_in",
                quantity,
                description: "افزودن کالا به انبار",
                createdBy: "u4",
            });

            return {
                ...currentState,
                products: [newProduct, ...currentState.products],
                inventoryItems: [newInventoryItem, ...currentState.inventoryItems],
                stockMovements: [movement, ...currentState.stockMovements],
            };
        });
    }, []);

    const updateInventoryProduct = useCallback((productId: string, input: InventoryProductInput) => {
        const name = input.name.trim();
        const unit = input.unit.trim();

        if (!name || !unit) return;

        updateState((currentState) => {
            const previousInventory = currentState.inventoryItems.find((item) => item.productId === productId);
            const previousQuantity = previousInventory?.currentQuantity ?? 0;
            const nextQuantity = safeNumber(input.currentQuantity);
            const quantityChanged = previousQuantity !== nextQuantity;

            const stockUnit = (input.stockUnit ?? unit).trim() || unit;
            const orderUnit = (input.orderUnit ?? stockUnit).trim() || stockUnit;
            const orderUnitQuantity = safeNumber(input.orderUnitQuantity ?? 1) || 1;
            const orderQuantityStep = safeNumber(input.orderQuantityStep ?? (orderUnit === stockUnit && orderUnitQuantity === 1 ? 0.001 : 1)) || 1;

            const updatedProducts = currentState.products.map((product) =>
                product.id === productId
                    ? {
                        ...product,
                        name,
                        category: input.category,
                        unit: stockUnit,
                        stockUnit,
                        orderUnit,
                        orderUnitQuantity,
                        orderQuantityStep,
                    }
                    : product
            );

            const updatedInventoryItems = currentState.inventoryItems.map((item) =>
                item.productId === productId
                    ? {
                        ...item,
                        currentQuantity: nextQuantity,
                        minimumQuantity: safeNumber(input.minimumQuantity ?? item.minimumQuantity),
                        criticalQuantity: safeNumber(input.criticalQuantity ?? item.criticalQuantity),
                    }
                    : item
            );

            const reason = input.correctionReason?.trim();
            const movement = quantityChanged
                ? createMovement({
                    productId,
                    type: "manual_correction",
                    quantity: nextQuantity - previousQuantity,
                    description: reason
                        ? `اصلاح موجودی: ${previousQuantity} → ${nextQuantity} — ${reason}`
                        : `اصلاح موجودی: ${previousQuantity} → ${nextQuantity}`,
                    createdBy: "u4",
                })
                : null;

            return {
                ...currentState,
                products: updatedProducts,
                inventoryItems: updatedInventoryItems,
                stockMovements: movement ? [movement, ...currentState.stockMovements] : currentState.stockMovements,
            };
        });
    }, []);

    const adjustInventoryQuantity = useCallback((productId: string, deltaQuantity: number, reason?: string) => {
        const safeDelta = Number.isFinite(deltaQuantity) ? deltaQuantity : 0;

        if (safeDelta === 0) return;

        updateState((currentState) => {
            const inventoryItem = currentState.inventoryItems.find((item) => item.productId === productId);

            if (!inventoryItem) return currentState;

            const previousQuantity = inventoryItem.currentQuantity;
            const nextQuantity = Math.max(0, previousQuantity + safeDelta);
            const appliedDelta = nextQuantity - previousQuantity;

            if (appliedDelta === 0) return currentState;

            const finalReason = reason?.trim();
            const movement = createMovement({
                productId,
                type: "manual_correction",
                quantity: appliedDelta,
                description: finalReason
                    ? `اصلاح سریع موجودی: ${previousQuantity} → ${nextQuantity} — ${finalReason}`
                    : `اصلاح سریع موجودی: ${previousQuantity} → ${nextQuantity}`,
                createdBy: "u4",
            });

            return {
                ...currentState,
                inventoryItems: currentState.inventoryItems.map((item) =>
                    item.productId === productId
                        ? { ...item, currentQuantity: nextQuantity }
                        : item
                ),
                stockMovements: [movement, ...currentState.stockMovements],
            };
        });
    }, []);

    const removeInventoryProduct = useCallback((productId: string) => {
        updateState((currentState) => {
            const previousInventory = currentState.inventoryItems.find((item) => item.productId === productId);
            const movement = createMovement({
                productId,
                type: "manual_correction",
                quantity: -(previousInventory?.currentQuantity ?? 0),
                description: "حذف کالا از لیست انبار",
                createdBy: "u4",
            });

            return {
                ...currentState,
                products: currentState.products.filter((product) => product.id !== productId),
                inventoryItems: currentState.inventoryItems.filter((item) => item.productId !== productId),
                stockMovements: [movement, ...currentState.stockMovements],
            };
        });
    }, []);

    const resetStore = useCallback(() => {
        writeStateToStorage(cloneInitialState());
    }, []);

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
        resetStore,
    };
}
