import { NextRequest, NextResponse } from "next/server";
import { getDataDb } from "../../../../lib/db";
import { requireAuth } from "../../../../lib/session";
import { sendSms } from "../../../../lib/sms";
import type { PurchaseOrder } from "../../../../lib/types";

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

function mapOrder(row: OrderRow, itemRows: OrderItemRow[]): PurchaseOrder {
    return {
        id: row.id,
        supplierId: row.supplier_id,
        status: row.status,
        smsStatus: row.sms_status,
        createdBy: row.created_by ?? undefined,
        createdAt: row.created_at,
        items: itemRows.map((item) => ({
            id: item.id,
            productId: item.product_id ?? undefined,
            productName: item.product_name,
            quantity: item.quantity,
            stockUnit: item.stock_unit ?? undefined,
        })),
    };
}

function buildSmsMessage(itemRows: OrderItemRow[]) {
    const lines = itemRows.map((item) => `${item.product_name}: ${item.quantity}${item.stock_unit ? ` ${item.stock_unit}` : ""}`);
    return `سفارش جدید از Penza:\n${lines.join("\n")}`;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request, ["manager"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const isDemo = auth.account.role === "demo";
    const db = getDataDb(isDemo);
    const existing = db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(id) as OrderRow | undefined;

    if (!existing) {
        return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    }

    if (body?.resendSms) {
        const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(existing.supplier_id) as SupplierRow | undefined;
        const itemRows = db.prepare("SELECT * FROM purchase_order_items WHERE purchase_order_id = ?").all(id) as OrderItemRow[];

        if (!supplier) {
            return NextResponse.json({ error: "فروشنده این سفارش پیدا نشد." }, { status: 404 });
        }

        // Demo mode must never send a real SMS to a real supplier.
        const smsResult = isDemo ? { status: "sent" as const } : await sendSms(supplier.phone, buildSmsMessage(itemRows));
        db.prepare("UPDATE purchase_orders SET sms_status = ? WHERE id = ?").run(smsResult.status, id);
    } else if (typeof body?.status === "string") {
        db.prepare("UPDATE purchase_orders SET status = ? WHERE id = ?").run(body.status, id);
    }

    const orderRow = db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(id) as OrderRow;
    const itemRows = db.prepare("SELECT * FROM purchase_order_items WHERE purchase_order_id = ?").all(id) as OrderItemRow[];

    return NextResponse.json({ order: mapOrder(orderRow, itemRows) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request, ["manager"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const db = getDataDb(auth.account.role === "demo");

    db.prepare("DELETE FROM purchase_orders WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
}
