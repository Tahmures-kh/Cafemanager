---
name: manager-inventory-role-leak-fix
description: Home-screen action grid was leaking manager/storage/staff panels across roles (inventory CRUD, suppliers, server settings); fixed by re-auditing every role's actions against the web app
metadata:
  type: project
---

On 2026-07-17 the user reported that manager/staff/storage were "having each other's panels" —
screens each role shouldn't see. Investigation against the web app
(`c:/Projects/staff-management-saas`) found the concrete bug: `/manager/inventory` and
`/storage/dashboard` are two **separate** Next.js pages with very different capabilities —
`/storage/dashboard` is the full add/edit/quick-adjust/delete inventory tool, while
`/manager/inventory` is a read-only KPI-cards + read-only table + read-only movement history report
(no forms, no mutation actions). The Android app only had one inventory screen
(`ui/inventory/InventoryScreen.kt`, the storage CRUD tool) and `ManagerDashboardScreen`'s "موجودی
انبار" button routed straight to it via `Routes.STORAGE_INVENTORY` — so Manager got full add/edit/
delete/adjust powers that should be storage-only.

Fix: added `ui/managerinventory/ManagerInventoryScreen.kt` + `ManagerInventoryViewModel.kt` (read-only,
mirrors `/manager/inventory` exactly: 6 KPI cards, search-only filter, read-only table, read-only
movement list), added `Routes.MANAGER_INVENTORY = "manager/inventory"` in `MainActivity.kt`, and
repointed `ManagerDashboardScreen`'s `onOpenInventory` to the new route. Storage's own home-screen
card still correctly points at the original `InventoryScreen`/`Routes.STORAGE_INVENTORY`.

**Why this matters going forward:** other screens that look similar across roles on the web (e.g.
anything under both `/manager/*` and `/storage/*` or `/staff/*`) must be checked individually —
matching Persian labels/UI style does NOT mean matching capability. Verified at the time of this fix
that `ManagerOrdersScreen` vs `StorageOrdersScreen` vs `StaffOrdersScreen` were already correctly
separate files with role-appropriate capabilities (manager = read-only, storage = pack/deliver
workflow, staff = confirm-received only) — only inventory had the leak. If new cross-role
functionality is added, always diff against the specific web page for that exact role+path, not
just against a same-named screen already built for a different role.

**Follow-up (same day):** the user then flagged two more leaks in `HomeScreen.kt`'s per-role action
grid, found by the same "check against the actual web route" method:

1. **Suppliers** was added unconditionally for every role. On the web, supplier CRUD only exists
   embedded inside `/manager/purchases` (see `handleSaveSupplier`/`openNewSupplierForm` in that
   page) — there is no standalone suppliers route reachable by staff or storage at all. Fixed by
   moving the "فروشنده‌ها" `HomeAction` inside the `Role.MANAGER` branch only.
2. **Server address settings** ("تنظیمات آدرس سرور") was also added unconditionally for every role.
   This has no web equivalent at all — it's pure Android plumbing for pointing the app at wherever
   `next dev` is running (see [[project-overview]]). Removed it from the per-role action grid
   entirely; it's still reachable pre-login from `LoginScreen`'s existing `onOpenSettings` callback,
   so nothing was lost, just kept out of the day-to-day per-role panel.

After this pass, `HomeScreen.kt`'s three role branches (MANAGER/STAFF/STORAGE) contain *only*
actions that exist in the equivalent web role's own routes, and `MainActivity.kt`'s `NavHost` maps
every route to exactly one screen used by exactly one role (no route is reachable by two different
role branches anymore, following the inventory fix above). The general lesson from both rounds:
whenever a Home action or route was added "for convenience" without checking whether the
corresponding web role could reach it, it leaked. Any new Android screen/action should be checked
against the specific web role directory it claims to mirror before wiring it into more than one
role's Home grid.

**Follow-up #2 (same day):** the "manager-only" fix for Suppliers above was only half right — the
user then clarified Suppliers shouldn't be its own standalone screen/nav item *at all*, even for
manager, because on the web it isn't a route — supplier CRUD (`handleSaveSupplier`,
`openEditSupplierForm`, `handleDeleteSupplier`, the `فروشنده‌ها (count)` table) is embedded directly
inside `/manager/purchases/page.tsx`, above the "سفارش خرید جدید" purchase-order form on that same
page. Fixed by deleting the standalone screen entirely (`ui/suppliers/SuppliersScreen.kt` +
`SuppliersViewModel.kt` removed, `Routes.SUPPLIERS` and its `HomeAction` removed) and merging full
supplier CRUD into `ui/purchases/PurchasesViewModel.kt`/`PurchasesScreen.kt` as a `SuppliersPanel`
composable rendered above the purchase-order form — add/edit/delete with an `AlertDialog` delete
confirmation (mirroring `InventoryScreen`'s delete-confirmation pattern), all logged under the
existing `AUDIT_SCOPE = "purchases"` (matches the web's `AUDIT_SCOPE` in that same page). Also added
`SuppliersRepository.updateSupplier` (API route already existed; the repository method didn't).
`PurchasesScreen` only ever had a read-only supplier *picker* dropdown before — full CRUD now lives
there instead of a separate screen.

**Sharper version of the lesson:** matching Persian labels/theme isn't the only trap — a feature can
also look right at the "which role can reach this" level while still being wrong at the "is this even
its own page on the web, or is it embedded inside a bigger page" level. Always check both: (1) which
role(s) can reach a route, and (2) whether the web treats it as a standalone route at all, before
building it as a separate Android screen.

**Follow-up #3 (same day): reported "inventory list missing" was a layout-ordering bug, not a data
bug.** User said the inventory list wasn't showing in storage's and manager's inventory screens
"while it's being listed in web." Investigated end-to-end using the Android emulator
(`adb`) against the real `staff-management-saas` dev server (`next dev`, confirmed running via
`curl localhost:3000/api/inventory`, confirmed the SQLite DB (`data/app.db`) has 426 seeded products
via `seedInventoryIfEmpty` in `lib/db.ts`) — the API and data pipeline were completely fine end to
end. Live-testing both screens on-device (logged in as manager and separately as storage, navigated
to each inventory screen, screenshotted) showed the *real* bug: in `ui/inventory/InventoryScreen.kt`
(storage's CRUD tool), the tall "افزودن کالا" (add-product form, ~10 fields) was placed between the
filters and the actual "کالاهای انبار" product list, pushing the list ~2.5 screens down on a phone.
On the web, the list is the prominent main-column content and the add-form is a small sidebar
(`storage/dashboard/page.tsx`'s `lg:grid-cols-[1fr_24rem]`), so this ordering never mattered there —
but stacked vertically on mobile it reads as "list is missing" since most users don't scroll past a
big form first. Fixed by moving `item { AddProductCard(viewModel) }` to after the rows list (and the
empty-state check), right before `RecentMovementsCard` — list now renders immediately after the
filters card. `ManagerInventoryScreen.kt` didn't have this problem (list already sits right after the
KPI cards + search field, no large form in between) — left unchanged. Rebuilt, reinstalled, and
re-verified live: the list ("سیروپ گل رز", "S500", ...) now appears on the first screen without
scrolling past any form.

Secondary, non-blocking observation from the same investigation: `ManagerInventoryViewModel.cards()`'s
"کم‌موجود" (LOW+CRITICAL tier count) can under-count relative to `ManagerDashboardViewModel`'s
"کالای کم‌موجود" (any non-OK tier, i.e. LOW+CRITICAL+OUT) because an item can have `currentQuantity > 0`
but still round down to 0 order-units (`stockToOrderQuantity` floors by `orderQuantityStep`), landing
it in the OUT tier instead of LOW/CRITICAL. This exactly mirrors the web's own
`manager/inventory/page.tsx` logic (`zeroStockCount` uses raw `currentQuantity <= 0`,
`lowStockCount` uses tier LOW/CRITICAL only) — it's not an Android-introduced bug, just an existing
web quirk being faithfully ported. Left as-is; only worth touching if the user asks to fix it on both
sides.

**Reusable technique for this class of bug report:** when the user says "X isn't showing" and the
underlying screen/data logic looks correct on read-through, don't stop at code review — drive the
actual app via `adb` (the emulator at `emulator-5554` was already running) against the real dev
server and screenshot each step (`adb exec-out screencap`, then Read the PNG). This project's backend
is a local `next dev` process the user runs themselves, so verifying "is the server actually up and
seeded" (`curl`, or query `data/app.db` directly with `node -e "require('better-sqlite3')..."`) before
assuming a client bug is a fast, cheap first check.

See also [[project-overview]] for the overall app/web mapping.
