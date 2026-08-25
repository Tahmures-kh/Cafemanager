import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../../../lib/db";
import { requireAuth } from "../../../../../lib/session";
import type { InventoryItem, StockMovement } from "../../../../../lib/types";

type InventoryRow = {
    id: string;
    product_id: string;
    current_quantity: number;
    minimum_quantity: number;
    critical_quantity: number;
    par_quantity: number;
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    const auth = requireAuth(request, ["manager", "storage"]);
    if (!auth.ok) return auth.response;

    const { productId } = await params;
    const body = await request.json().catch(() => null);

    const deltaQuantity = Number(body?.deltaQuantity);
    if (!body || !Number.isFinite(deltaQuantity) || deltaQuantity === 0) {
        return NextResponse.json({ error: "مقدار اصلاح باید عددی و غیرصفر باشد." }, { status: 400 });
    }

    const db = getDb();
    const existingInventory = db.prepare("SELECT * FROM inventory_items WHERE product_id = ?").get(productId) as
        | InventoryRow
        | undefined;

    if (!existingInventory) {
        return NextResponse.json({ error: "کالا پیدا نشد." }, { status: 404 });
    }

    const previousQuantity = existingInventory.current_quantity;
    const nextQuantity = Math.max(0, previousQuantity + deltaQuantity);
    const appliedDelta = nextQuantity - previousQuantity;

    if (appliedDelta === 0) {
        return NextResponse.json({ error: "تغییری برای اعمال وجود ندارد." }, { status: 400 });
    }

    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const description = reason
        ? `اصلاح سریع موجودی: ${previousQuantity} → ${nextQuantity} — ${reason}`
        : `اصلاح سریع موجودی: ${previousQuantity} → ${nextQuantity}`;
    const movementId = createRecordId("sm");
    const now = nowIso();

    // A restock (positive delta) resets the "full" reference level used by
    // the percent-based low-stock alarm; a correction/subtraction doesn't.
    const updateInventory = db.prepare(
        appliedDelta > 0
            ? "UPDATE inventory_items SET current_quantity = ?, par_quantity = ? WHERE product_id = ?"
            : "UPDATE inventory_items SET current_quantity = ? WHERE product_id = ?"
    );
    const insertMovement = db.prepare(
        `INSERT INTO stock_movements (id, product_id, type, quantity, description, created_by, created_at)
         VALUES (?, ?, 'manual_correction', ?, ?, ?, ?)`
    );

    const run = db.transaction(() => {
        if (appliedDelta > 0) {
            updateInventory.run(nextQuantity, nextQuantity, productId);
        } else {
            updateInventory.run(nextQuantity, productId);
        }
        insertMovement.run(
            movementId,
            productId,
            appliedDelta,
            description,
            typeof body.createdBy === "string" ? body.createdBy : null,
            now
        );
    });

    run();

    const inventoryRow = db.prepare("SELECT * FROM inventory_items WHERE product_id = ?").get(productId) as InventoryRow;
    const movementRow = db.prepare("SELECT * FROM stock_movements WHERE id = ?").get(movementId) as MovementRow;

    return NextResponse.json({ inventoryItem: mapInventoryItem(inventoryRow), movement: mapMovement(movementRow) });
}
