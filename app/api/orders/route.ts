import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../lib/db";
import { normalizeOrderQuantity } from "../../../lib/product-units";
import { requireAuth } from "../../../lib/session";
import type { CafeOrder, OrderItem, Product } from "../../../lib/types";

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

export async function GET(request: NextRequest) {
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;

    const db = getDb();
    const orderRows = db.prepare("SELECT * FROM cafe_orders ORDER BY created_at DESC").all() as OrderRow[];
    const itemRows = db.prepare("SELECT * FROM order_items").all() as OrderItemRow[];

    return NextResponse.json({
        orders: orderRows.map(mapOrder),
        items: itemRows.map(mapOrderItem),
    });
}

export async function POST(request: NextRequest) {
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);

    if (
        !body ||
        typeof body.requestedBy !== "string" ||
        !body.requestedBy.trim() ||
        !Array.isArray(body.items)
    ) {
        return NextResponse.json({ error: "نام درخواست‌کننده و حداقل یک کالا الزامی است." }, { status: 400 });
    }

    const validItems = (body.items as Array<{ productId?: string; requestedQuantity?: number }>).filter(
        (item) => typeof item.productId === "string" && Number(item.requestedQuantity) > 0
    );

    if (validItems.length === 0) {
        return NextResponse.json({ error: "حداقل یک کالای معتبر برای درخواست الزامی است." }, { status: 400 });
    }

    const db = getDb();
    const orderId = createRecordId("order");
    const now = nowIso();

    const insertOrder = db.prepare(
        `INSERT INTO cafe_orders (id, requested_by, status, note, created_at, updated_at)
         VALUES (?, ?, 'pending', ?, ?, ?)`
    );
    const insertItem = db.prepare(
        `INSERT INTO order_items (id, order_id, product_id, requested_quantity, packed_quantity)
         VALUES (?, ?, ?, ?, 0)`
    );
    const getProduct = db.prepare("SELECT * FROM products WHERE id = ?");

    const run = db.transaction(() => {
        insertOrder.run(orderId, body.requestedBy.trim(), typeof body.note === "string" ? body.note.trim() || null : null, now, now);

        for (const item of validItems) {
            const productRow = getProduct.get(item.productId) as ProductRow | undefined;
            const product = productRow ? toProduct(productRow) : undefined;
            const requestedQuantity = normalizeOrderQuantity(product, Number(item.requestedQuantity));

            insertItem.run(createRecordId("orderitem"), orderId, item.productId, requestedQuantity);
        }
    });

    run();

    const orderRow = db.prepare("SELECT * FROM cafe_orders WHERE id = ?").get(orderId) as OrderRow;
    const itemRows = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId) as OrderItemRow[];

    return NextResponse.json({ order: mapOrder(orderRow), items: itemRows.map(mapOrderItem) });
}
