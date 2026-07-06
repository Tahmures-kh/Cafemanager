import path from "path";
import { mkdirSync } from "fs";
import Database from "better-sqlite3";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "app.db");

let db: Database.Database | null = null;

function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function initSchema(database: Database.Database) {
    database.exec(`
        CREATE TABLE IF NOT EXISTS recipes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS recipe_ingredients (
            id TEXT PRIMARY KEY,
            recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            quantity REAL NOT NULL,
            stock_unit TEXT
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            scope TEXT NOT NULL,
            action TEXT NOT NULL,
            description TEXT,
            actor_role TEXT,
            actor_name TEXT,
            ip TEXT,
            user_agent TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sales_batches (
            id TEXT PRIMARY KEY,
            shift_date TEXT NOT NULL,
            shift_label TEXT,
            source_type TEXT NOT NULL,
            source_file_name TEXT,
            imported_by TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sales_items (
            id TEXT PRIMARY KEY,
            batch_id TEXT NOT NULL REFERENCES sales_batches(id) ON DELETE CASCADE,
            recipe_id TEXT,
            item_name TEXT NOT NULL,
            quantity_sold REAL NOT NULL,
            unit_price REAL,
            revenue REAL
        );

        CREATE TABLE IF NOT EXISTS ingredient_prices (
            product_id TEXT PRIMARY KEY,
            product_name TEXT NOT NULL,
            unit_price REAL NOT NULL,
            stock_unit TEXT,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS exchange_rates (
            currency TEXT PRIMARY KEY,
            rate_to_toman REAL NOT NULL,
            fetched_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            website TEXT,
            notes TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS purchase_orders (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL REFERENCES suppliers(id),
            status TEXT NOT NULL,
            sms_status TEXT NOT NULL,
            created_by TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS purchase_order_items (
            id TEXT PRIMARY KEY,
            purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
            product_id TEXT,
            product_name TEXT NOT NULL,
            quantity REAL NOT NULL,
            stock_unit TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
        CREATE INDEX IF NOT EXISTS idx_audit_log_scope ON audit_log(scope);
        CREATE INDEX IF NOT EXISTS idx_sales_items_batch_id ON sales_items(batch_id);
        CREATE INDEX IF NOT EXISTS idx_sales_batches_shift_date ON sales_batches(shift_date);
        CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(purchase_order_id);
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
    `);
}

export function getDb(): Database.Database {
    if (db) return db;

    mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_FILE);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);

    return db;
}

export function createRecordId(prefix: string) {
    return createId(prefix);
}

export function nowIso() {
    return new Date().toISOString();
}
