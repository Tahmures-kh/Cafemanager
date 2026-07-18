import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../lib/db";
import { requireAuth } from "../../../lib/session";
import type { InventoryItem, Product, StockMovement } from "../../../lib/types";

type ProductRow = {
    id: string;
    name: string;
    category: string;
    unit: string;
    stock_unit: string | null;
    order_unit: string | null;
    order_unit_quantity: number | null;
    order_quantity_step: number | null;
};

type InventoryRow = {
    id: string;
    product_id: string;
    current_quantity: number;
    minimum_quantity: number;
    critical_quantity: number;
};

type MovementRow = {
    id: string;
    product_id: string;
    type: string;
    quantity: number;
    description: string;
    created_by: string | null;
    created_at: string;
};

function mapProduct(row: ProductRow): Product {
    return {
        id: row.id,
        name: row.name,
        category: row.category as Product["category"],
        unit: row.unit,
        stockUnit: row.stock_unit ?? undefined,
        orderUnit: row.order_unit ?? undefined,
        orderUnitQuantity: row.order_unit_quantity ?? undefined,
        orderQuantityStep: row.order_quantity_step ?? undefined,
    };
}

function mapInventoryItem(row: InventoryRow): InventoryItem {
    return {
        id: row.id,
        productId: row.product_id,
        currentQuantity: row.current_quantity,
        minimumQuantity: row.minimum_quantity,
        criticalQuantity: row.critical_quantity,
    };
}

function mapMovement(row: MovementRow): StockMovement {
    return {
        id: row.id,
        productId: row.product_id,
        type: row.type as StockMovement["type"],
        quantity: row.quantity,
        description: row.description,
        createdBy: row.created_by ?? "",
        createdAt: row.created_at,
    };
}

export async function GET(request: NextRequest) {
    const auth = requireAuth(request);
    if (!auth.ok) return auth.response;

    const db = getDb();
    const limitParam = Number(request.nextUrl.searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 200;

    const productRows = db.prepare("SELECT * FROM products ORDER BY name ASC").all() as ProductRow[];
    const inventoryRows = db.prepare("SELECT * FROM inventory_items").all() as InventoryRow[];
    const movementRows = db
        .prepare("SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT ?")
        .all(limit) as MovementRow[];

    return NextResponse.json({
        products: productRows.map(mapProduct),
        inventoryItems: inventoryRows.map(mapInventoryItem),
        movements: movementRows.map(mapMovement),
    });
}

export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "storage"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const unit = typeof body?.unit === "string" ? body.unit.trim() : "";

    if (!body || !name || !unit || typeof body.category !== "string") {
        return NextResponse.json({ error: "نام کالا، دسته و واحد الزامی است." }, { status: 400 });
    }

    const db = getDb();

    const stockUnit = (typeof body.stockUnit === "string" ? body.stockUnit : unit).trim() || unit;
    const orderUnit = (typeof body.orderUnit === "string" ? body.orderUnit : stockUnit).trim() || stockUnit;
    const orderUnitQuantity = Number(body.orderUnitQuantity) || 1;
    const orderQuantityStep =
        Number(body.orderQuantityStep) ||
        (orderUnit === stockUnit && orderUnitQuantity === 1 ? 0.001 : 1);
    const currentQuantity = Number.isFinite(Number(body.currentQuantity)) ? Math.max(0, Number(body.currentQuantity)) : 0;

    const productId = createRecordId("p");
    const inventoryId = createRecordId("inv");
    const now = nowIso();

    const insertProduct = db.prepare(
        `INSERT INTO products (id, name, category, unit, stock_unit, order_unit, order_unit_quantity, order_quantity_step)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertInventory = db.prepare(
        `INSERT INTO inventory_items (id, product_id, current_quantity, minimum_quantity, critical_quantity)
         VALUES (?, ?, ?, ?, ?)`
    );
    const insertMovement = db.prepare(
        `INSERT INTO stock_movements (id, product_id, type, quantity, description, created_by, created_at)
         VALUES (?, ?, 'stock_in', ?, ?, ?, ?)`
    );

    const run = db.transaction(() => {
        insertProduct.run(productId, name, body.category, stockUnit, stockUnit, orderUnit, orderUnitQuantity, orderQuantityStep);
        insertInventory.run(
            inventoryId,
            productId,
            currentQuantity,
            Number.isFinite(Number(body.minimumQuantity)) ? Math.max(0, Number(body.minimumQuantity)) : 0,
            Number.isFinite(Number(body.criticalQuantity)) ? Math.max(0, Number(body.criticalQuantity)) : 0
        );
        insertMovement.run(
            createRecordId("sm"),
            productId,
            currentQuantity,
            "افزودن کالا به انبار",
            typeof body.createdBy === "string" ? body.createdBy : null,
            now
        );
    });

    run();

    const productRow = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as ProductRow;
    const inventoryRow = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(inventoryId) as InventoryRow;

    return NextResponse.json({ product: mapProduct(productRow), inventoryItem: mapInventoryItem(inventoryRow) });
}
