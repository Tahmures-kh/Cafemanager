import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import os from "os";

const KEEP_COUNT = 14;

const projectDb = path.join(process.cwd(), "data", "app.db");
const backupDir = path.join(os.homedir(), "penza-backups");
fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(backupDir, `app-${timestamp}.db`);

const db = new Database(projectDb, { readonly: true, fileMustExist: true });
await db.backup(backupPath);
db.close();

const files = fs
    .readdirSync(backupDir)
    .filter((name) => name.startsWith("app-") && name.endsWith(".db"))
    .map((name) => ({ name, mtime: fs.statSync(path.join(backupDir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

for (const { name } of files.slice(KEEP_COUNT)) {
    fs.unlinkSync(path.join(backupDir, name));
}

console.log(`[${new Date().toISOString()}] backup created: ${backupPath} (${files.length > KEEP_COUNT ? KEEP_COUNT : files.length} kept)`);
