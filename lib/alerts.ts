import type { CafeOrder, InventoryItem, OrderItem } from "./types";

export type AlertLevel = "none" | "warning" | "critical";

const urgentWords = [
    "فوری",
    "ضروری",
    "اورژانسی",
    "اضطراری",
    "کمبود",
    "تمام",
    "تمام شده",
    "نیاز فوری",
    "urgent",
    "asap",
    "problem",
];

export function isUrgentText(value?: string) {
    if (!value) return false;
    const normalized = value.toLowerCase();
    return urgentWords.some((word) => normalized.includes(word.toLowerCase()));
}

export function inventoryAlertLevel(item?: InventoryItem): AlertLevel {
    if (!item) return "none";
    if (item.currentQuantity <= item.criticalQuantity) return "critical";
    if (item.currentQuantity <= item.minimumQuantity) return "warning";
    return "none";
}

export function orderItemAlertLevel(item: OrderItem, inventoryItem?: InventoryItem): AlertLevel {
    if (!inventoryItem) return "none";

    const remaining = Math.max(0, item.requestedQuantity - item.packedQuantity);

    if (remaining <= 0) return "none";

    if (remaining > inventoryItem.currentQuantity || inventoryItem.currentQuantity <= inventoryItem.criticalQuantity) {
        return "critical";
    }

    if (inventoryItem.currentQuantity <= inventoryItem.minimumQuantity) {
        return "warning";
    }

    return "none";
}

export function orderAlertLevel(
    order: CafeOrder,
    orderItems: OrderItem[],
    inventoryItems: InventoryItem[]
): AlertLevel {
    if (["sent", "received", "cancelled"].includes(order.status)) return "none";
    if (isUrgentText(order.note)) return "critical";

    let hasWarning = false;

    for (const item of orderItems.filter((entry) => entry.orderId === order.id)) {
        const inventoryItem = inventoryItems.find((entry) => entry.productId === item.productId);
        const level = orderItemAlertLevel(item, inventoryItem);
        if (level === "critical") return "critical";
        if (level === "warning") hasWarning = true;
    }

    if (order.status === "pending") hasWarning = true;
    return hasWarning ? "warning" : "none";
}

export function orderAlertLabel(level: AlertLevel) {
    if (level === "critical") return "نیاز به اقدام فوری";
    if (level === "warning") return "نیازمند پیگیری";
    return "عادی";
}

export function inventoryAlertLabel(level: AlertLevel) {
    if (level === "critical") return "موجودی بحرانی";
    if (level === "warning") return "کمبود موجودی";
    return "موجودی کافی";
}
