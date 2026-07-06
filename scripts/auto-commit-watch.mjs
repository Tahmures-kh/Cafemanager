// Watches the project for any file change (yours or Claude's) and commits it
// automatically after a short quiet period. Ignores .git/node_modules/.next.
// Run with: npm run watch:autocommit

import { watch } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const ignoredSegments = ["\\.git", "node_modules", "\\.next", "\\bout\\b", "\\bbuild\\b"];
const ignoredPattern = new RegExp(ignoredSegments.join("|"));
const DEBOUNCE_MS = 15000;

let timer = null;
let committing = false;
let pendingWhileCommitting = false;

function log(message) {
    console.log(`[auto-commit] ${new Date().toLocaleTimeString()} ${message}`);
}

async function runGit(args) {
    const { stdout } = await execFileAsync("git", args, { cwd: root });
    return stdout;
}

async function commitIfDirty() {
    if (committing) {
        pendingWhileCommitting = true;
        return;
    }

    committing = true;

    try {
        const status = await runGit(["status", "--porcelain"]);

        if (!status.trim()) {
            log("no changes to commit");
            return;
        }

        await runGit(["add", "-A"]);
        const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
        await runGit(["commit", "-m", `auto: snapshot ${timestamp}`]);
        log(`committed snapshot ${timestamp}`);
    } catch (error) {
        log(`skipped (${error.message.split("\n")[0]})`);
    } finally {
        committing = false;

        if (pendingWhileCommitting) {
            pendingWhileCommitting = false;
            scheduleCommit();
        }
    }
}

function scheduleCommit() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(commitIfDirty, DEBOUNCE_MS);
}

log(`watching ${root} for changes (auto-commit after ${DEBOUNCE_MS / 1000}s idle)`);

watch(root, { recursive: true }, (_eventType, filename) => {
    if (!filename || ignoredPattern.test(filename)) return;
    scheduleCommit();
});
