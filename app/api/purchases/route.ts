import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDataDb, nowIso } from "../../../lib/db";
import { requireAuth } from "../../../lib/session";
import { sendSms } from "../../../lib/sms";
import type { PurchaseOrder } from "../../../lib/types";

type OrderRow = {
    id: string;
    supplier_id: string;
    status: string;
    sms_status: string;
    created_by: string | null;
    created_at: string;
};

type OrderItemRow = {
    id: string;
    purchase_order_id: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    stock_unit: string | null;
};

type SupplierRow = { id: string; name: string; phone: string };

type PurchaseItemInput = {
    productId?: string | null;
    productName: string;
    quantity: number;
    stockUnit?: string | null;
};

function mapOrder(row: OrderRow, itemRows: OrderItemRow[]): PurchaseOrder {
    return {
        id: row.id,
        supplierId: row.supplier_id,
        status: row.status,
        smsStatus: row.sms_status,
        createdBy: row.created_by ?? undefined,
        createdAt: row.created_at,
        items: itemRows
            .filter((item) => item.purchase_order_id === row.id)
            .map((item) => ({
                id: item.id,
                productId: item.product_id ?? undefined,
                productName: item.product_name,
                quantity: item.quantity,
                stockUnit: item.stock_unit ?? undefined,
            })),
    };
}

function buildSmsMessage(items: PurchaseItemInput[]) {
    const lines = items.map((item) => `${item.productName}: ${item.quantity}${item.stockUnit ? ` ${item.stockUnit}` : ""}`);
    return `سفارش جدید از Penza:\n${lines.join("\n")}`;
}

export async function GET(request: NextRequest) {
    const auth = requireAuth(request, ["manager"]);
    if (!auth.ok) return auth.response;

    const db = getDataDb(auth.account.role === "demo");
    const orderRows = db.prepare("SELECT * FROM purchase_orders ORDER BY created_at DESC").all() as OrderRow[];
    const itemRows = db.prepare("SELECT * FROM purchase_order_items").all() as OrderItemRow[];

    return NextResponse.json({ orders: orderRows.map((row) => mapOrder(row, itemRows)) });
}

export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["manager"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);

    if (
        !body ||
        typeof body.supplierId !== "string" ||
        !Array.isArray(body.items) ||
        body.items.length === 0
    ) {
        return NextResponse.json({ error: "فروشنده و حداقل یک ردیف کالا الزامی است." }, { status: 400 });
    }

    const isDemo = auth.account.role === "demo";
    const db = getDataDb(isDemo);
    const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(body.supplierId) as SupplierRow | undefined;

    if (!supplier) {
        return NextResponse.json({ error: "فروشنده پیدا نشد." }, { status: 404 });
    }

    const orderId = createRecordId("purchase");
    const now = nowIso();
    const items = body.items as PurchaseItemInput[];

    const insertOrderStmt = db.prepare(
        `INSERT INTO purchase_orders (id, supplier_id, status, sms_status, created_by, created_at)
         VALUES (?, ?, 'pending', 'pending', ?, ?)`
    );
    const insertItemStmt = db.prepare(
        `INSERT INTO purchase_order_items (id, purchase_order_id, product_id, product_name, quantity, stock_unit)
         VALUES (?, ?, ?, ?, ?, ?)`
    );

    const run = db.transaction(() => {
        insertOrderStmt.run(orderId, body.supplierId, typeof body.createdBy === "string" ? body.createdBy : null, now);

        for (const item of items) {
            if (!item.productName || !(item.quantity > 0)) continue;

            insertItemStmt.run(
                createRecordId("purchaseitem"),
                orderId,
                item.productId ?? null,
                item.productName,
                item.quantity,
                item.stockUnit ?? null
            );
        }
    });

    run();

    // Demo mode must never send a real SMS to a real supplier.
    const smsResult = isDemo ? { status: "sent" as const } : await sendSms(supplier.phone, buildSmsMessage(items));
    db.prepare("UPDATE purchase_orders SET sms_status = ? WHERE id = ?").run(smsResult.status, orderId);

    const orderRow = db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(orderId) as OrderRow;
    const itemRows = db.prepare("SELECT * FROM purchase_order_items WHERE purchase_order_id = ?").all(orderId) as OrderItemRow[];

    return NextResponse.json({
        order: mapOrder(orderRow, itemRows),
        smsError: smsResult.status === "error" ? smsResult.message : undefined,
    });
}
