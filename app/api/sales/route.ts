import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDb, nowIso } from "../../../lib/db";
import type { SalesBatch } from "../../../lib/types";

type BatchRow = {
    id: string;
    shift_date: string;
    shift_label: string | null;
    source_type: string;
    source_file_name: string | null;
    imported_by: string | null;
    created_at: string;
};

type ItemRow = {
    id: string;
    batch_id: string;
    recipe_id: string | null;
    item_name: string;
    quantity_sold: number;
    unit_price: number | null;
    revenue: number | null;
};

type SalesItemInput = {
    itemName: string;
    quantitySold: number;
    unitPrice?: number | null;
    revenue?: number | null;
    recipeId?: string | null;
};

function mapBatch(row: BatchRow, itemRows: ItemRow[]): SalesBatch {
    return {
        id: row.id,
        shiftDate: row.shift_date,
        shiftLabel: row.shift_label ?? undefined,
        sourceType: row.source_type as SalesBatch["sourceType"],
        sourceFileName: row.source_file_name ?? undefined,
        importedBy: row.imported_by ?? undefined,
        createdAt: row.created_at,
        items: itemRows
            .filter((item) => item.batch_id === row.id)
            .map((item) => ({
                id: item.id,
                recipeId: item.recipe_id,
                itemName: item.item_name,
                quantitySold: item.quantity_sold,
                unitPrice: item.unit_price,
                revenue: item.revenue,
            })),
    };
}

export async function GET(request: NextRequest) {
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");

    const db = getDb();

    let batchRows: BatchRow[];
    if (from && to) {
        batchRows = db
            .prepare("SELECT * FROM sales_batches WHERE shift_date >= ? AND shift_date <= ? ORDER BY shift_date DESC")
            .all(from, to) as BatchRow[];
    } else {
        batchRows = db.prepare("SELECT * FROM sales_batches ORDER BY shift_date DESC").all() as BatchRow[];
    }

    const batchIds = batchRows.map((row) => row.id);
    const itemRows = batchIds.length
        ? (db
            .prepare(`SELECT * FROM sales_items WHERE batch_id IN (${batchIds.map(() => "?").join(",")})`)
            .all(...batchIds) as ItemRow[])
        : [];

    return NextResponse.json({ batches: batchRows.map((row) => mapBatch(row, itemRows)) });
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (
        !body ||
        typeof body.shiftDate !== "string" ||
        typeof body.sourceType !== "string" ||
        !Array.isArray(body.items) ||
        body.items.length === 0
    ) {
        return NextResponse.json({ error: "تاریخ شیفت، نوع منبع و حداقل یک آیتم فروش الزامی است." }, { status: 400 });
    }

    const db = getDb();
    const batchId = createRecordId("salesbatch");
    const now = nowIso();

    const insertBatchStmt = db.prepare(
        `INSERT INTO sales_batches (id, shift_date, shift_label, source_type, source_file_name, imported_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const insertItemStmt = db.prepare(
        `INSERT INTO sales_items (id, batch_id, recipe_id, item_name, quantity_sold, unit_price, revenue)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const run = db.transaction(() => {
        insertBatchStmt.run(
            batchId,
            body.shiftDate,
            typeof body.shiftLabel === "string" ? body.shiftLabel : null,
            body.sourceType,
            typeof body.sourceFileName === "string" ? body.sourceFileName : null,
            typeof body.importedBy === "string" ? body.importedBy : null,
            now
        );

        for (const item of body.items as SalesItemInput[]) {
            if (!item.itemName || !(item.quantitySold > 0)) continue;

            insertItemStmt.run(
                createRecordId("salesitem"),
                batchId,
                item.recipeId ?? null,
                item.itemName,
                item.quantitySold,
                item.unitPrice ?? null,
                item.revenue ?? null
            );
        }
    });

    run();

    const batchRow = db.prepare("SELECT * FROM sales_batches WHERE id = ?").get(batchId) as BatchRow;
    const itemRows = db.prepare("SELECT * FROM sales_items WHERE batch_id = ?").all(batchId) as ItemRow[];

    return NextResponse.json({ batch: mapBatch(batchRow, itemRows) });
}
