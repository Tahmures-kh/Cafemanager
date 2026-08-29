import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../lib/db";
import { requireAuth } from "../../../lib/session";
import type { WorkshopAllocation, WorkshopDepartment } from "../../../lib/types";

const VALID_DEPARTMENTS: WorkshopDepartment[] = ["bakery", "pastry", "saucier", "storage_costs"];

type AllocationRow = {
    id: string;
    department: string;
    product_id: string;
    quantity: number;
    created_by: string | null;
    created_at: string;
};

type InventoryRow = {
    id: string;
    product_id: string;
    current_quantity: number;
    par_quantity: number;
};

function mapAllocation(row: AllocationRow): WorkshopAllocation {
    return {
        id: row.id,
        department: row.department as WorkshopDepartment,
        productId: row.product_id,
        quantity: row.quantity,
        createdBy: row.created_by ?? "",
        createdAt: row.created_at,
    };
}

export async function GET(request: NextRequest) {
    const auth = requireAuth(request, ["storage"]);
    if (!auth.ok) return auth.response;

    const db = getDb();
    const rows = db
        .prepare("SELECT * FROM workshop_allocations ORDER BY created_at DESC LIMIT 200")
        .all() as AllocationRow[];

    return NextResponse.json({ allocations: rows.map(mapAllocation) });
}

export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["storage"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);

    const department = typeof body?.department === "string" ? body.department : "";
    const productId = typeof body?.productId === "string" ? body.productId : "";
    const requestedQuantity = Number(body?.quantity);

    if (!VALID_DEPARTMENTS.includes(department as WorkshopDepartment)) {
        return NextResponse.json({ error: "بخش کارگاه نامعتبر است." }, { status: 400 });
    }

    if (!productId || !Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
        return NextResponse.json({ error: "کالا و مقدار معتبر الزامی است." }, { status: 400 });
    }

    const db = getDb();
    const inventoryRow = db.prepare("SELECT * FROM inventory_items WHERE product_id = ?").get(productId) as
        | InventoryRow
        | undefined;

    if (!inventoryRow) {
        return NextResponse.json({ error: "کالا در انبار پیدا نشد." }, { status: 404 });
    }

    const quantity = Math.min(requestedQuantity, Math.max(0, inventoryRow.current_quantity));

    if (quantity <= 0) {
        return NextResponse.json({ error: "موجودی این کالا در انبار کافی نیست." }, { status: 400 });
    }

    const allocationId = createRecordId("wsa");
    const createdBy = typeof body.createdBy === "string" ? body.createdBy : null;
    const now = nowIso();
    const nextQuantity = Math.max(0, inventoryRow.current_quantity - quantity);

    const departmentLabel: Record<WorkshopDepartment, string> = {
        bakery: "نانوایی",
        pastry: "شیرینی‌پزی",
        saucier: "سوسیه",
        storage_costs: "هزینه‌های انبار",
    };

    const insertAllocation = db.prepare(
        `INSERT INTO workshop_allocations (id, department, product_id, quantity, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
    );
    const updateInventory = db.prepare("UPDATE inventory_items SET current_quantity = ? WHERE product_id = ?");
    const insertMovement = db.prepare(
        `INSERT INTO stock_movements (id, product_id, type, quantity, description, created_by, created_at)
         VALUES (?, ?, 'workshop_allocation', ?, ?, ?, ?)`
    );

    const run = db.transaction(() => {
        insertAllocation.run(allocationId, department, productId, quantity, createdBy, now);
        updateInventory.run(nextQuantity, productId);
        insertMovement.run(
            createRecordId("sm"),
            productId,
            -quantity,
            `تخصیص به کارگاه — ${departmentLabel[department as WorkshopDepartment]}`,
            createdBy,
            now
        );
    });

    run();

    const allocationRow = db.prepare("SELECT * FROM workshop_allocations WHERE id = ?").get(allocationId) as AllocationRow;

    return NextResponse.json({ allocation: mapAllocation(allocationRow) });
}
