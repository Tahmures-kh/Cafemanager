import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../../lib/db";
import {
    formatNumber,
    getOrderUnit,
    normalizeOrderQuantity,
    orderToStockQuantity,
    stockToOrderQuantity,
} from "../../../../lib/product-units";
import { requireAuth } from "../../../../lib/session";
import type { CafeOrder, OrderItem, OrderStatus, Product } from "../../../../lib/types";

type OrderRow = {
    id: string;
    requested_by: string;
    status: string;
    note: string | null;
    created_at: string;
    updated_at: string;
};

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

// Single-tenant deployment: there is exactly one cafe ("c1" in lib/mock-data.ts).
// `cafeId` stays on the shared CafeOrder type for the pre-existing mock/localStorage
// pages (staff/manager/storage dashboards) but isn't a real column in cafe_orders.
const SINGLE_CAFE_ID = "c1";

function mapOrder(row: OrderRow): CafeOrder {
    return {
        id: row.id,
        cafeId: SINGLE_CAFE_ID,
        requestedBy: row.requested_by,
        status: row.status as CafeOrder["status"],
        note: row.note ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
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

/** Ported from local-store.ts's applySentInventoryUpdate: clamps each item's final packed
 * quantity against requested/available stock, deducts inventory, logs a sent_to_cafe movement. */
function applySentInventoryUpdate(db: ReturnType<typeof getDb>, order: OrderRow, createdBy: string | null) {
    const itemRows = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as OrderItemRow[];
    const getProduct = db.prepare("SELECT * FROM products WHERE id = ?");
    const getInventory = db.prepare("SELECT * FROM inventory_items WHERE product_id = ?");
    const updateItemPacked = db.prepare("UPDATE order_items SET packed_quantity = ? WHERE id = ?");
    const updateInventoryQuantity = db.prepare("UPDATE inventory_items SET current_quantity = ? WHERE product_id = ?");
    const insertMovement = db.prepare(
        `INSERT INTO stock_movements (id, product_id, type, quantity, description, created_by, created_at)
         VALUES (?, ?, 'sent_to_cafe', ?, ?, ?, ?)`
    );

    for (const item of itemRows) {
        const productRow = getProduct.get(item.product_id) as ProductRow | undefined;
        const product = productRow ? toProduct(productRow) : undefined;
        const inventoryRow = getInventory.get(item.product_id) as InventoryRow | undefined;
        const availableStockQuantity = safeNumber(inventoryRow?.current_quantity ?? 0);
        const availableOrderQuantity = stockToOrderQuantity(product, availableStockQuantity);

        const finalPackedQuantity = Math.min(
            normalizeOrderQuantity(product, item.packed_quantity),
            normalizeOrderQuantity(product, item.requested_quantity),
            availableOrderQuantity
        );

        updateItemPacked.run(finalPackedQuantity, item.id);

        if (finalPackedQuantity > 0 && inventoryRow) {
            const stockQuantity = orderToStockQuantity(product, finalPackedQuantity);
            const nextQuantity = Math.max(0, inventoryRow.current_quantity - stockQuantity);
            updateInventoryQuantity.run(nextQuantity, item.product_id);

            insertMovement.run(
                createRecordId("sm"),
                item.product_id,
                -stockQuantity,
                `تحویل درخواست ${order.id} — ${formatNumber(finalPackedQuantity)} ${getOrderUnit(product)}`,
                createdBy,
                nowIso()
            );
        }
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const db = getDb();
    const existing = db.prepare("SELECT * FROM cafe_orders WHERE id = ?").get(id) as OrderRow | undefined;

    if (!existing) {
        return NextResponse.json({ error: "درخواست پیدا نشد." }, { status: 404 });
    }

    if (body?.fillRequested) {
        const itemRows = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as OrderItemRow[];
        const getProduct = db.prepare("SELECT * FROM products WHERE id = ?");
        const getInventory = db.prepare("SELECT * FROM inventory_items WHERE product_id = ?");
        const updateItemPacked = db.prepare("UPDATE order_items SET packed_quantity = ? WHERE id = ?");

        const run = db.transaction(() => {
            for (const item of itemRows) {
                const productRow = getProduct.get(item.product_id) as ProductRow | undefined;
                const product = productRow ? toProduct(productRow) : undefined;
                const inventoryRow = getInventory.get(item.product_id) as InventoryRow | undefined;
                const availableOrderQuantity = stockToOrderQuantity(product, safeNumber(inventoryRow?.current_quantity ?? 0));
                const requestedQuantity = normalizeOrderQuantity(product, item.requested_quantity);
                const packedQuantity = Math.min(requestedQuantity, availableOrderQuantity);

                updateItemPacked.run(packedQuantity, item.id);
            }
        });

        run();
    } else if (typeof body?.status === "string") {
        const nextStatus = body.status as OrderStatus;
        const createdBy = typeof body.createdBy === "string" ? body.createdBy : null;

        const run = db.transaction(() => {
            db.prepare("UPDATE cafe_orders SET status = ?, updated_at = ? WHERE id = ?").run(nextStatus, nowIso(), id);

            if (existing.status !== "sent" && nextStatus === "sent") {
                applySentInventoryUpdate(db, existing, createdBy);
            }
        });

        run();
    } else {
        return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
    }

    const orderRow = db.prepare("SELECT * FROM cafe_orders WHERE id = ?").get(id) as OrderRow;
    const itemRows = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as OrderItemRow[];

    return NextResponse.json({ order: mapOrder(orderRow), items: itemRows.map(mapOrderItem) });
}
