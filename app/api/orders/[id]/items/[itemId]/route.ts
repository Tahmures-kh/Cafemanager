import { NextRequest, NextResponse } from "next/server";
import { getDataDb } from "../../../../../../lib/db";
import { normalizeOrderQuantity, stockToOrderQuantity } from "../../../../../../lib/product-units";
import { requireAuth } from "../../../../../../lib/session";
import type { OrderItem, Product } from "../../../../../../lib/types";

type OrderItemRow = {
    id: string;
    order_id: string;
    product_id: string;
    requested_quantity: number;
    packed_quantity: number;
};

type ProductRow = {
    id: string;
    order_unit_quantity: number | null;
    order_quantity_step: number | null;
    order_unit: string | null;
    stock_unit: string | null;
    unit: string;
};

type InventoryRow = {
    id: string;
    product_id: string;
    current_quantity: number;
    minimum_quantity: number;
    critical_quantity: number;
};

function toProduct(row: ProductRow): Product {
    return {
        id: row.id,
        name: row.id,
        category: "other",
        unit: row.unit,
        stockUnit: row.stock_unit ?? undefined,
        orderUnit: row.order_unit ?? undefined,
        orderUnitQuantity: row.order_unit_quantity ?? undefined,
        orderQuantityStep: row.order_quantity_step ?? undefined,
    };
}

function mapOrderItem(row: OrderItemRow): OrderItem {
    return {
        id: row.id,
        orderId: row.order_id,
        productId: row.product_id,
        requestedQuantity: row.requested_quantity,
        packedQuantity: row.packed_quantity,
    };
}

function safeNumber(value: number) {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;

    const { id, itemId } = await params;
    const body = await request.json().catch(() => null);

    const requestedPackedQuantity = Number(body?.packedQuantity);
    if (!body || !Number.isFinite(requestedPackedQuantity)) {
        return NextResponse.json({ error: "مقدار آماده‌شده باید عددی باشد." }, { status: 400 });
    }

    const db = getDataDb(auth.account.role === "demo");
    const existingItem = db.prepare("SELECT * FROM order_items WHERE id = ? AND order_id = ?").get(itemId, id) as
        | OrderItemRow
        | undefined;

    if (!existingItem) {
        return NextResponse.json({ error: "قلم درخواست پیدا نشد." }, { status: 404 });
    }

    const productRow = db.prepare("SELECT * FROM products WHERE id = ?").get(existingItem.product_id) as
        | ProductRow
        | undefined;
    const product = productRow ? toProduct(productRow) : undefined;
    const inventoryRow = db.prepare("SELECT * FROM inventory_items WHERE product_id = ?").get(existingItem.product_id) as
        | InventoryRow
        | undefined;

    const availableOrderQuantity = stockToOrderQuantity(product, safeNumber(inventoryRow?.current_quantity ?? 0));
    const requestedQuantity = normalizeOrderQuantity(product, existingItem.requested_quantity);
    const nextPackedQuantity = normalizeOrderQuantity(product, requestedPackedQuantity);
    const finalValue = Math.min(requestedQuantity, availableOrderQuantity, nextPackedQuantity);

    db.prepare("UPDATE order_items SET packed_quantity = ? WHERE id = ?").run(finalValue, itemId);

    const itemRow = db.prepare("SELECT * FROM order_items WHERE id = ?").get(itemId) as OrderItemRow;

    return NextResponse.json({ item: mapOrderItem(itemRow) });
}
