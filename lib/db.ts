import path from "path";
import { mkdirSync } from "fs";
import Database from "better-sqlite3";
import { hashPassword } from "./password";

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

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            unit TEXT NOT NULL,
            stock_unit TEXT,
            order_unit TEXT,
            order_unit_quantity REAL,
            order_quantity_step REAL
        );

        CREATE TABLE IF NOT EXISTS inventory_items (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
            current_quantity REAL NOT NULL DEFAULT 0,
            minimum_quantity REAL NOT NULL DEFAULT 0,
            critical_quantity REAL NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS stock_movements (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            type TEXT NOT NULL,
            quantity REAL NOT NULL,
            description TEXT NOT NULL,
            created_by TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cafe_orders (
            id TEXT PRIMARY KEY,
            requested_by TEXT NOT NULL,
            status TEXT NOT NULL,
            note TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES cafe_orders(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL,
            requested_quantity REAL NOT NULL,
            packed_quantity REAL NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            role TEXT NOT NULL,
            display_name TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            ip TEXT,
            user_agent TEXT,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS unit_types (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON sessions(account_id);
        CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
        CREATE INDEX IF NOT EXISTS idx_audit_log_scope ON audit_log(scope);
        CREATE INDEX IF NOT EXISTS idx_sales_items_batch_id ON sales_items(batch_id);
        CREATE INDEX IF NOT EXISTS idx_sales_batches_shift_date ON sales_batches(shift_date);
        CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(purchase_order_id);
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON inventory_items(product_id);
        CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
        CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_cafe_orders_status ON cafe_orders(status);
    `);
}

function seedInventoryIfEmpty(database: Database.Database) {
    const { count } = database.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
    if (count > 0) return;

    const { products, inventoryItems } = require("./mock-data") as typeof import("./mock-data");

    const insertProduct = database.prepare(
        `INSERT INTO products (id, name, category, unit, stock_unit, order_unit, order_unit_quantity, order_quantity_step)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertInventory = database.prepare(
        `INSERT INTO inventory_items (id, product_id, current_quantity, minimum_quantity, critical_quantity, par_quantity)
         VALUES (?, ?, ?, ?, ?, ?)`
    );

    const run = database.transaction(() => {
        for (const product of products) {
            insertProduct.run(
                product.id,
                product.name,
                product.category,
                product.unit,
                product.stockUnit ?? null,
                product.orderUnit ?? null,
                product.orderUnitQuantity ?? null,
                product.orderQuantityStep ?? null
            );
        }
        for (const item of inventoryItems) {
            insertInventory.run(
                item.id,
                item.productId,
                item.currentQuantity,
                item.minimumQuantity,
                item.criticalQuantity,
                item.parQuantity
            );
        }
    });

    run();
}

function seedUnitTypesIfEmpty(database: Database.Database) {
    const { count } = database.prepare("SELECT COUNT(*) as count FROM unit_types").get() as { count: number };
    if (count > 0) return;

    const { products } = require("./mock-data") as typeof import("./mock-data");

    const names = new Set<string>(["کیلوگرم", "لیتر", "عدد", "بسته", "وزن"]);
    products.forEach((product) => {
        if (product.unit) names.add(product.unit);
        if (product.stockUnit) names.add(product.stockUnit);
        if (product.orderUnit) names.add(product.orderUnit);
    });

    const insertUnitType = database.prepare(`INSERT INTO unit_types (id, name, created_at) VALUES (?, ?, ?)`);
    const now = nowIso();

    const run = database.transaction(() => {
        for (const name of names) {
            insertUnitType.run(createRecordId("unit"), name, now);
        }
    });

    run();
}

function seedAccountsIfEmpty(database: Database.Database) {
    const { count } = database.prepare("SELECT COUNT(*) as count FROM accounts").get() as { count: number };
    if (count > 0) return;

    const insertAccount = database.prepare(
        `INSERT INTO accounts (id, username, password_hash, password_salt, role, display_name, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
    );

    const now = nowIso();
    const seedAccounts: Array<{ id: string; username: string; password: string; role: string; displayName: string }> = [
        { id: "account-seed-admin", username: "tahmures", password: "tahmures123", role: "admin", displayName: "مدیر سیستم" },
        { id: "account-seed-manager", username: "manager", password: "manager123", role: "manager", displayName: "مدیر" },
        { id: "account-seed-staff", username: "staff", password: "staff123", role: "staff", displayName: "کاربر کافه" },
        { id: "account-seed-storage", username: "storage", password: "storage123", role: "storage", displayName: "انباردار" },
        { id: "account-seed-accountant", username: "accountant", password: "accountant123", role: "accountant", displayName: "حسابدار" },
    ];

    const run = database.transaction(() => {
        for (const account of seedAccounts) {
            const { hash, salt } = hashPassword(account.password);
            insertAccount.run(account.id, account.username, hash, salt, account.role, account.displayName, now);
        }
    });

    run();
}

const LOW_STOCK_ALERT_PERCENT_KEY = "low_stock_alert_percent";
const DEFAULT_LOW_STOCK_ALERT_PERCENT = "20";

/** Adds columns to tables that already existed before this column was
 * introduced. CREATE TABLE IF NOT EXISTS only helps for brand-new
 * databases — a live database with real data needs an explicit ALTER. */
function migrateSchema(database: Database.Database) {
    const inventoryColumns = database.prepare("PRAGMA table_info(inventory_items)").all() as Array<{ name: string }>;
    const hasParQuantity = inventoryColumns.some((column) => column.name === "par_quantity");

    if (!hasParQuantity) {
        database.exec("ALTER TABLE inventory_items ADD COLUMN par_quantity REAL NOT NULL DEFAULT 0");
        database.exec("UPDATE inventory_items SET par_quantity = current_quantity WHERE par_quantity = 0");
    }
}

function seedSettingsIfEmpty(database: Database.Database) {
    const existing = database.prepare("SELECT value FROM app_settings WHERE key = ?").get(LOW_STOCK_ALERT_PERCENT_KEY);
    if (existing) return;

    database
        .prepare("INSERT INTO app_settings (key, value) VALUES (?, ?)")
        .run(LOW_STOCK_ALERT_PERCENT_KEY, DEFAULT_LOW_STOCK_ALERT_PERCENT);
}

export function getDb(): Database.Database {
    if (db) return db;

    mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_FILE);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
    migrateSchema(db);
    seedInventoryIfEmpty(db);
    seedUnitTypesIfEmpty(db);
    seedAccountsIfEmpty(db);
    seedSettingsIfEmpty(db);

    return db;
}

export const LOW_STOCK_ALERT_PERCENT_SETTING_KEY = LOW_STOCK_ALERT_PERCENT_KEY;

export function createRecordId(prefix: string) {
    return createId(prefix);
}

export function nowIso() {
    return new Date().toISOString();
}
