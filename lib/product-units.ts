import type { InventoryItem, Product } from "./types";

export function getStockUnit(product?: Product) {
    return product?.stockUnit?.trim() || product?.unit?.trim() || "واحد";
}

export function getOrderUnit(product?: Product) {
    return product?.orderUnit?.trim() || getStockUnit(product);
}

export function getOrderUnitQuantity(product?: Product) {
    const value = product?.orderUnitQuantity ?? 1;
    return Number.isFinite(value) && value > 0 ? value : 1;
}

export function getOrderQuantityStep(product?: Product) {
    const value = product?.orderQuantityStep ?? 0.001;
    return Number.isFinite(value) && value > 0 ? value : 0.001;
}

export function orderToStockQuantity(product: Product | undefined, orderQuantity: number) {
    const safeQuantity = Number.isFinite(orderQuantity) ? Math.max(0, orderQuantity) : 0;
    return Math.round(safeQuantity * getOrderUnitQuantity(product) * 1000) / 1000;
}

export function stockToOrderQuantity(product: Product | undefined, stockQuantity: number) {
    const safeQuantity = Number.isFinite(stockQuantity) ? Math.max(0, stockQuantity) : 0;
    const rawOrderQuantity = safeQuantity / getOrderUnitQuantity(product);
    const step = getOrderQuantityStep(product);

    if (step >= 1) {
        return Math.floor(rawOrderQuantity / step) * step;
    }

    return Math.floor(rawOrderQuantity / step) * step;
}

export function normalizeOrderQuantity(product: Product | undefined, quantity: number) {
    const safeQuantity = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
    const step = getOrderQuantityStep(product);
    const normalized = step >= 1
        ? Math.floor(safeQuantity / step) * step
        : Math.round(safeQuantity / step) * step;

    return Math.round(normalized * 1000) / 1000;
}

export function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

export function formatStockQuantity(product: Product | undefined, quantity: number) {
    return `${formatNumber(quantity)} ${getStockUnit(product)}`;
}

export function formatOrderQuantity(product: Product | undefined, quantity: number) {
    return `${formatNumber(quantity)} ${getOrderUnit(product)}`;
}

export function formatUnitConversion(product: Product | undefined) {
    const orderQuantity = getOrderUnitQuantity(product);
    const orderUnit = getOrderUnit(product);
    const stockUnit = getStockUnit(product);

    if (orderUnit === stockUnit && orderQuantity === 1) return `${stockUnit}`;

    return `1 ${orderUnit} = ${formatNumber(orderQuantity)} ${stockUnit}`;
}

export function hasUnitConversion(product?: Product) {
    return getOrderUnit(product) !== getStockUnit(product) || getOrderUnitQuantity(product) !== 1;
}

export function getOrderRemainder(product: Product | undefined, stockQuantity: number) {
    const safeQuantity = Number.isFinite(stockQuantity) ? Math.max(0, stockQuantity) : 0;
    const wholeOrderUnits = stockToOrderQuantity(product, safeQuantity);
    const consumedStock = orderToStockQuantity(product, wholeOrderUnits);

    return Math.max(0, Math.round((safeQuantity - consumedStock) * 1000) / 1000);
}

/**
 * "قابل درخواست" as whole order-units alone hides any leftover stock that
 * doesn't add up to one more package (e.g. 2.35kg of a 3.5kg-per-بسته item
 * reads as "0 بسته" with no sign the 2.35kg exists). Append the remainder in
 * stock units whenever it's non-zero so partial stock stays visible.
 */
export function formatAvailableQuantity(product: Product | undefined, stockQuantity: number) {
    const orderQuantity = stockToOrderQuantity(product, stockQuantity);
    const base = formatOrderQuantity(product, orderQuantity);

    if (!hasUnitConversion(product)) return base;

    const remainder = getOrderRemainder(product, stockQuantity);
    if (remainder <= 0) return base;

    return `${base} (${formatStockQuantity(product, remainder)} باقیمانده)`;
}

export type StockStatusTier = "out" | "critical" | "low" | "ok";

export function getStockStatus(product: Product | undefined, inventoryItem?: InventoryItem): StockStatusTier {
    const quantity = inventoryItem?.currentQuantity ?? 0;
    const availableOrderQuantity = stockToOrderQuantity(product, quantity);

    if (availableOrderQuantity <= 0) return "out";
    if (quantity <= (inventoryItem?.criticalQuantity ?? 0)) return "critical";
    if (quantity <= (inventoryItem?.minimumQuantity ?? 0)) return "low";

    return "ok";
}

export function getStockStatusLabel(tier: StockStatusTier) {
    if (tier === "out") return "ناموجود";
    if (tier === "critical") return "موجودی بحرانی";
    if (tier === "low") return "موجودی کم";

    return "موجود";
}

export function getStockStatusStyle(tier: StockStatusTier) {
    if (tier === "out") return "bg-red-50 text-red-700 ring-red-100";
    if (tier === "critical") return "bg-orange-50 text-orange-700 ring-orange-100";
    if (tier === "low") return "bg-yellow-50 text-yellow-700 ring-yellow-100";

    return "bg-[#e0ffe0] text-[#007A00] ring-[#9ee89e]";
}
