import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../../lib/db";
import { requireAuth } from "../../../../lib/session";
import type { InventoryItem, Product } from "../../../../lib/types";

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
    par_quantity: number;
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
        parQuantity: row.par_quantity,
    };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    const auth = requireAuth(request, ["manager", "storage"]);
    if (!auth.ok) return auth.response;

    const { productId } = await params;
    const body = await request.json().catch(() => null);

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const unit = typeof body?.unit === "string" ? body.unit.trim() : "";

    if (!body || !name || !unit || typeof body.category !== "string") {
        return NextResponse.json({ error: "نام کالا، دسته و واحد الزامی است." }, { status: 400 });
    }

    const db = getDb();
    const existingProduct = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as ProductRow | undefined;
    const existingInventory = db.prepare("SELECT * FROM inventory_items WHERE product_id = ?").get(productId) as
        | InventoryRow
        | undefined;

    if (!existingProduct || !existingInventory) {
        return NextResponse.json({ error: "کالا پیدا نشد." }, { status: 404 });
    }

    const stockUnit = (typeof body.stockUnit === "string" ? body.stockUnit : unit).trim() || unit;
    const orderUnit = (typeof body.orderUnit === "string" ? body.orderUnit : stockUnit).trim() || stockUnit;
    const orderUnitQuantity = Number(body.orderUnitQuantity) || 1;
    const orderQuantityStep =
        Number(body.orderQuantityStep) ||
        (orderUnit === stockUnit && orderUnitQuantity === 1 ? 0.001 : 1);

    const previousQuantity = existingInventory.current_quantity;
    const nextQuantity = Number.isFinite(Number(body.currentQuantity)) ? Math.max(0, Number(body.currentQuantity)) : previousQuantity;
    const minimumQuantity = Number.isFinite(Number(body.minimumQuantity)) ? Math.max(0, Number(body.minimumQuantity)) : existingInventory.minimum_quantity;
    const criticalQuantity = Number.isFinite(Number(body.criticalQuantity)) ? Math.max(0, Number(body.criticalQuantity)) : existingInventory.critical_quantity;
    const quantityChanged = nextQuantity !== previousQuantity;
    const reason = typeof body.correctionReason === "string" ? body.correctionReason.trim() : "";

    const updateProduct = db.prepare(
        `UPDATE products SET name = ?, category = ?, unit = ?, stock_unit = ?, order_unit = ?, order_unit_quantity = ?, order_quantity_step = ? WHERE id = ?`
    );
    const updateInventory = db.prepare(
        `UPDATE inventory_items SET current_quantity = ?, minimum_quantity = ?, critical_quantity = ? WHERE product_id = ?`
    );
    const insertMovement = db.prepare(
        `INSERT INTO stock_movements (id, product_id, type, quantity, description, created_by, created_at)
         VALUES (?, ?, 'manual_correction', ?, ?, ?, ?)`
    );

    const run = db.transaction(() => {
        updateProduct.run(name, body.category, stockUnit, stockUnit, orderUnit, orderUnitQuantity, orderQuantityStep, productId);
        updateInventory.run(nextQuantity, minimumQuantity, criticalQuantity, productId);

        if (quantityChanged) {
            const description = reason
                ? `اصلاح موجودی: ${previousQuantity} → ${nextQuantity} — ${reason}`
                : `اصلاح موجودی: ${previousQuantity} → ${nextQuantity}`;
            insertMovement.run(
                createRecordId("sm"),
                productId,
                nextQuantity - previousQuantity,
                description,
                typeof body.createdBy === "string" ? body.createdBy : null,
                nowIso()
            );
        }
    });

    run();

    const productRow = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as ProductRow;
    const inventoryRow = db.prepare("SELECT * FROM inventory_items WHERE product_id = ?").get(productId) as InventoryRow;

    return NextResponse.json({ product: mapProduct(productRow), inventoryItem: mapInventoryItem(inventoryRow) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    const auth = requireAuth(request, ["manager", "storage"]);
    if (!auth.ok) return auth.response;

    const { productId } = await params;
    const body = await request.json().catch(() => null);

    const db = getDb();
    const existingInventory = db.prepare("SELECT * FROM inventory_items WHERE product_id = ?").get(productId) as
        | InventoryRow
        | undefined;

    if (!existingInventory) {
        return NextResponse.json({ error: "کالا پیدا نشد." }, { status: 404 });
    }

    const insertMovement = db.prepare(
        `INSERT INTO stock_movements (id, product_id, type, quantity, description, created_by, created_at)
         VALUES (?, ?, 'manual_correction', ?, ?, ?, ?)`
    );
    const deleteProduct = db.prepare("DELETE FROM products WHERE id = ?");

    const run = db.transaction(() => {
        insertMovement.run(
            createRecordId("sm"),
            productId,
            -existingInventory.current_quantity,
            "حذف کالا از لیست انبار",
            typeof body?.createdBy === "string" ? body.createdBy : null,
            nowIso()
        );
        deleteProduct.run(productId);
    });

    run();

    return NextResponse.json({ success: true });
}
