# Penza Cafe & Storage SaaS — Holy Bible / Next Session Handoff

**Project:** Penza internal cafe ↔ storage request system  
**Current version:** V1.21 completed, V1.22 handoff Bible  
**Last updated:** 2026-06-19  
**Framework:** Next.js App Router + TypeScript + Tailwind CSS  
**UI language:** Persian  
**Direction:** RTL  
**Current data mode:** frontend MVP using browser `localStorage`  
**Important:** This is not production-authenticated yet. It is still a local MVP/demo.

---

## 1. Product Goal

The app is for Penza cafe operations. It connects cafe staff, the storage man, and the manager around one simple workflow:

```text
Cafe staff creates request
↓
Storage man prepares the requested items
↓
Storage man delivers the request
↓
Cafe staff confirms receiving it
↓
Manager can monitor orders, inventory, and reports
```

The app should stay simple. The user explicitly decided that the visible workflow should not become complicated.

Main visible concepts:

```text
درخواست کالا
تحویل درخواست
```

Avoid adding extra operational labels unless requested later.

Do NOT bring back these concepts for now:

```text
critical
urgent
problem mode
red alert layer
warning severity levels
complex request statuses
```

---

## 2. Design Rules

### Brand

Cafe name:

```text
Penza
```

Official green selected by user:

```text
#00A300
```

Supporting colors currently used:

```text
Hover green: #008A00
Dark readable green text: #0B2F0B
Secondary green: #007A00
Soft green background: #f2fff2 / mint-white tones
```

Theme direction:

```text
Green + white
Clean
Modern
Alive, but not noisy
No black background
No brown theme
```

Storage list design direction:

```text
Compact list/table view
Storage man must be able to scan all requested goods quickly
Avoid huge item cards
```

User liked the current storage list direction and said it is good enough for now, but can be improved later.

---

## 3. Role Rules

### Manager

Manager should see all work and status inside manager pages.

Manager should NOT need to click into staff or storage dashboards.

Manager routes:

```text
/manager
/manager/dashboard
/manager/orders
/manager/inventory
/manager/reports
/manager/tasks  → legacy redirect to /manager/orders
```

Manager can see:

```text
all requests
request delivery state
inventory
stock movements
period reports
```

---

### Cafe Staff

Cafe staff should stay inside staff pages.

Staff routes:

```text
/staff
/staff/request
/staff/dashboard
```

Cafe staff can:

```text
create request
see own requests
see if request is delivered
confirm received request
```

Keep staff screens simple. Staff does not manage storage.

Important pending decision:

Current `/staff/request` no longer shows exact inventory quantity. Safer MVP rule selected for now: staff can request products, while exact stock remains visible only to storage and manager. Earlier product rule said cafe staff should not see storage stock. If the user changes their mind later, use one of these:

```text
Option A: hide storage quantity from staff request page
Option B: allow staff to see quantity because Penza is internal and it helps request realistically
```

Current implementation uses Option A. Do not show exact storage quantity to staff unless user asks to bring it back.

---

### Storage Man

Storage routes:

```text
/storage
/storage/orders
/storage/dashboard
/storage/reports
```

Storage man can now:

```text
see all incoming requests
see all requested goods in compact list form
enter prepared/packed quantity
mark request delivered
see whole stock list
add stock item
adjust existing stock with quick + / - corrections
remove stock item
see zero-stock status
see stock movement history
open reports
```

Storage dashboard is now the stock-control screen.

---

## 4. Current Workflow

### Staff request flow

Route:

```text
/staff/request
```

Current features:

```text
search products
category filters
compact product cards
quantity controls
selected-items cart
submit request
optional note
```

When submitted:

```text
new order is created in shared localStorage
status starts as pending
order appears in storage and manager pages
```

---

### Storage order flow

Route:

```text
/storage/orders
```

Current features:

```text
request/delivered tabs
compact aggregated goods list
selected order detail panel
requested quantity visible
prepared/packed quantity input
fill according to available stock button
stock shortage badges
mark as delivered button
reset test data button
```

Important behavior:

When storage marks an order as delivered/sent:

```text
packed quantity is clamped to requested quantity and available stock
packed quantity is deducted from inventory
stock movement is created only for the actual delivered quantity
order becomes visible as delivered
```

---

### Staff delivery confirmation

Route:

```text
/staff/dashboard
```

Current behavior:

```text
staff sees sent/delivered requests
staff can click confirm received
status becomes received
```

Still keep visible language simple:

```text
درخواست کالا
تحویل درخواست
```

---

## 5. Inventory System

### Real stock imported

An Excel file was imported:

```text
انبار گردانی اردیبهشت 1405.xlsx
```

Imported result:

```text
426 real stock items
```

Used Excel columns:

```text
نام کالا  → product name
واحد      → unit
مانده     → current stock quantity
```

The old fake sample inventory was replaced.

### Current inventory source

Initial seed data is generated in:

```text
lib/mock-data.ts
```

Active runtime data is stored in browser localStorage via:

```text
lib/local-store.ts
```

Current localStorage key:

```text
cafe-storage-mvp-store-v3-real-stock-editor-reports
```

If testing gets weird, use reset test data button or clear this localStorage key.

---

## 6. Storage Stock Management

Latest V1.20 stock/order safety polish:

```text
storage packing is now clamped to available inventory
manual prepared quantity cannot exceed requested quantity or current stock
آماده‌سازی طبق موجودی now fills only what can actually be delivered
if an order has no deliverable stock, storage gets an alert instead of sending a zero-delivery order
storage order aggregate list shows stock status per requested item
storage order detail shows قابل آماده‌سازی and shortage badges
staff request page still hides exact quantity but now shows broad availability labels: قابل درخواست / موجودی کم / موجودی بحرانی / ناموجود
storage dashboard shows zero-stock count and stock status badges
manager inventory page shows zero-stock count and status badges
final sent stock movement uses actual clamped delivered quantity
```

Previous V1.19 stock/report polish:

```text
removed dead row-level edit button from stock list
stock side panel is now only for adding new items
existing item quantity corrections should use quick + / - with reason
report page has today / 7 days / current month presets
report page has Excel-compatible .xls export
report page keeps CSV export as backup
report print button renamed PDF / چاپ because browser print can save PDF
report date defaults use local browser date instead of UTC slicing
```

Previous V1.18 stock UX improvements:

```text
category filter added
sort by latest change / name / high quantity / low quantity
quick + stock correction added
quick - stock correction added
reason field added for stock corrections
latest movement shown per product row
delete confirmation now shows item name and current quantity
manual correction reasons are saved into movement history
```

Route:

```text
/storage/dashboard
```

Current features:

```text
search all stock
view all stock items
see zero-stock count
see موجود / ناموجود status badges
add new stock item
adjust existing stock quantity with quick + / - and reason
remove stock item
see recent stock movements
```

Inventory actions added to local store:

```ts
addInventoryProduct(input)
updateInventoryProduct(productId, input)
adjustInventoryQuantity(productId, deltaQuantity, reason)
removeInventoryProduct(productId)
```

Stock edits update everywhere:

```text
staff request page
storage pages
manager pages
reports
```

Stock changes create movement history automatically:

```text
add stock item     → stock_in movement
edit quantity      → manual_correction movement
remove stock item  → manual_correction movement with negative quantity
order delivery     → sent_to_cafe movement
```

---

## 7. Report System

Report pages added:

```text
/storage/reports
/manager/reports
```

Shared/report/access components:

```text
components/PeriodReport.tsx
components/RoleGuard.tsx
components/RoleEntryLink.tsx
components/SetRoleOnVisit.tsx
components/AccessDeniedNotice.tsx
lib/role-session.ts
```

Report features:

```text
select start date
select end date
request count
received/delivered request count
total requested quantity
total delivered quantity
stock edit/add/remove history
stock movement table
top delivered products
print report button
copy summary button
CSV export for Excel
```

Report scope:

```text
frontend/localStorage only
not saved to PDF yet
CSV export exists for Excel; real .xlsx export not added yet
```

Recommended next improvement later:

```text
Native .xlsx export
Direct PDF file export
manager-specific summary cards
```

---

## 8. Current Data Model

Important files:

```text
lib/types.ts
lib/mock-data.ts
lib/local-store.ts
```

Important types:

```ts
export type UserRole = "owner" | "manager" | "cafe_staff" | "storage_staff";

export type ProductCategory =
  | "coffee"
  | "dairy"
  | "packaging"
  | "bakery"
  | "syrup"
  | "cleaning"
  | "other";

export type OrderStatus =
  | "pending"
  | "packing"
  | "ready"
  | "sent"
  | "received"
  | "cancelled";

export type StockMovementType =
  | "stock_in"
  | "packed_for_cafe"
  | "sent_to_cafe"
  | "manual_correction"
  | "damaged";
```

Main entities:

```text
User
Cafe
Product
InventoryItem
CafeOrder
OrderItem
StockMovement
```

Note:

Some old internal statuses/types still exist in TypeScript for compatibility, but UI should currently present only the simple two-step language:

```text
درخواست کالا
تحویل درخواست
```

---

## 9. Current Pages

### Root

```text
/
```

Purpose:

```text
role entry page for demo/testing
links to manager, staff, storage entry pages
```

---

### Manager

```text
/manager
```

Entry page for manager role.

```text
/manager/dashboard
```

Manager command center.

```text
/manager/orders
```

Manager order monitor. Manager sees request/delivery data without entering storage dashboard.

```text
/manager/inventory
```

Manager inventory view with search.

```text
/manager/reports
```

Period report page for manager.

---

### Staff

```text
/staff
```

Cafe staff entry page.

```text
/staff/request
```

Create request page.

```text
/staff/dashboard
```

Staff request tracking and receive confirmation page.

---

### Storage

```text
/storage
```

Storage entry page.

```text
/storage/orders
```

Storage request preparation and delivery page.

```text
/storage/dashboard
```

Storage stock management page.

```text
/storage/reports
```

Storage period report page.

---

## 10. What Changed in the Latest Session

### V1.13

```text
Imported real Excel stock list
Added 426 real stock items
Replaced fake sample products
Added decimal quantity support
Added manager inventory search
Reset localStorage key for clean stock loading
```

### V1.14

```text
Storage dashboard now shows whole stock list
Storage man can add stock
Storage man can edit stock
Storage man can remove stock
Stock edits update shared local store
Stock edits create stock movements
Added storage report page
Added manager report page
Added shared PeriodReport component
Reports support selected date range
Reports include request/delivery/movement summaries
```

### V1.16 / V1.17

```text
Added temporary role session using browser localStorage
Added RoleGuard for manager/staff/storage protected pages
Added role entry links that save selected role before navigation
Added access-denied notice on home page
Restored missing components/PeriodReport.tsx so reports pages compile
Added CSV export for Excel from report page
Hidden exact storage quantity from staff request page
Kept inventory quantity visible only for storage and manager
```

### V1.18

```text
Improved storage dashboard stock UX
Added category filter to storage stock table
Added stock sorting by latest change, name, high quantity, and low quantity
Added quick + موجودی / - موجودی correction panel
Added reason field for quick stock corrections
Added reason field for full stock edit quantity corrections
Saved correction reason inside stock movement descriptions
Added latest movement column per stock row
Improved delete confirmation with current quantity display
Added adjustInventoryQuantity(productId, deltaQuantity, reason) to local store
```

### V1.19

```text
Removed row-level ویرایش button from storage stock list because it was taking table space and was not needed for MVP flow
Simplified storage side form to add-only mode
Kept quantity changes focused on quick + / - correction panel with reason field
Added report date presets: امروز, 7 روز اخیر, ماه جاری
Added Excel-compatible .xls report export with summary, top delivered products, and movement/order rows
Kept CSV report export as a lightweight fallback
Renamed print action to PDF / چاپ
Fixed report date helper to use local browser date instead of UTC toISOString slicing
```

### V1.20

```text
Added safe packing clamp so storage cannot prepare more than requested quantity or available stock
Updated آماده‌سازی کامل to آماده‌سازی طبق موجودی
Auto-fill now fills only deliverable quantities based on current inventory
Delivery now refuses zero-deliverable orders with a clear browser alert
Delivery movement history now records the actual clamped sent quantity
Storage order aggregate list now shows موجود / کمبود موجودی / ناموجود per product
Storage order detail now shows قابل آماده‌سازی per item and shortage warning box
Staff request page still hides exact stock quantity but shows broad availability labels
Storage dashboard now shows zero-stock count and status badges in the stock table
Manager inventory now shows zero-stock count and status badges
```

---

## 11. Known Issues / Do Not Forget

### 1. Temporary role session exists; real authentication still missing

Role selection is now saved in browser localStorage for the MVP demo.

Protected role pages now use a temporary client-side RoleGuard. This blocks casual direct access from the wrong role, but it is not real backend security yet. Real authentication is still required before production.

Previously anyone could paste URLs directly:

```text
/manager/dashboard
/storage/dashboard
/staff/dashboard
```

Temporary role session + route guards are now added. Need real authentication later.

---

### 2. Still localStorage only

Data exists only in the browser.

Limitations:

```text
data is not shared across different PCs
clearing browser data removes edits
no real multi-user sync
no audit-proof history
```

Database/Supabase should come later, after MVP flow is finalized.

---

### 3. Staff stock visibility rule is now safer

Earlier rule said cafe staff should not see exact storage stock. Current implementation follows that safer MVP rule.

```text
Staff sees product list and can request quantity.
Storage/Manager see actual stock.
```

If the user later wants internal transparency, exact stock quantity can be restored on `/staff/request`.

---

### 4. Product categories are auto-guessed

Excel did not provide clean product categories.

Current categories are rough/automatic.

Later needed:

```text
category edit screen
bulk category cleanup
better category names based on Penza operations
```

---

### 5. Reports are basic

Reports work visually, print, copy summary, and export CSV for Excel.

Still missing:

```text
Native .xlsx export instead of HTML-based .xls
Direct PDF file export instead of browser print/save as PDF
manager-specific summary cards
```

---

### 6. Some code types/statuses are more complex than current UI

The TypeScript model still has statuses like:

```text
packing
ready
cancelled
critical
low
```

This is okay internally for now, but do not expose extra complexity in UI unless user asks.

---

## 11.5. V1.21 Update — English Number Display

Completed after V1.20:

```text
All UI number formatters changed from Persian digits to English digits ✅
Hard-coded Persian numerals in visible UI changed to English numerals ✅
Date/time formatter keeps Persian date style but uses English numerals ✅
Report preset label changed from 7 روز اخیر to 7 روز اخیر ✅
Staff/storage numbered guide cards changed from 1/2/3 to 1/2/3 ✅
Home demo metrics changed from 12/4/3 to 12/4/3 ✅
Mock-data address numeral changed from 81 to 81 ✅
```

Decision note:

```text
UI language remains Persian RTL. Only the digits changed to English/Latin numerals.
```

---

## 11.6. V1.22 Update — Storage Stock List Default Cleanup

Completed after V1.21:

```text
Removed default statistic cards above /storage/dashboard stock list ✅
Removed noisy default counters: total stock items, summed stock quantity, zero-stock count, open requests, delivered requests ✅
Storage dashboard now opens directly to search/filter/sort controls and the inventory table ✅
Operational numbers still remain available in reports/manager views when explicitly needed ✅
```

Decision note:

```text
Storage stock list should not show summary counters by default. Daily users mostly need the actual stock rows, filters, quick + / - correction, and latest movement. Summary numbers should appear only when asked through reporting/manager-style views.
```

---

## 12. Next Session TODO — Recommended Order

### Priority 1 — Manager / staff workflow polish

Stock/order safety is improved in V1.20. English-number UI formatting is now applied in V1.21. Storage dashboard default stats cleanup is applied in V1.22.

Next add:

```text
staff request presets / favorite products
manager daily cards
storage order list density polish
empty-state and success-state polish
```

The app should still stay simple and not bring back urgent/critical/problem UI.

---

### Priority 2 — Supabase planning

Not yet implementation unless user asks.

Before Supabase, finalize:

```text
role model
request workflow
inventory adjustment workflow
report fields
audit log needs
```

Then migrate localStorage state to database tables.

---

## 13. Quick Test Checklist

After opening the app locally, test these pages:

```text
/
/staff
/staff/request
/staff/dashboard
/storage
/storage/orders
/storage/dashboard
/storage/reports
/manager
/manager/dashboard
/manager/orders
/manager/inventory
/manager/reports
```

Test flow:

```text
1. Go to /staff/request
2. Search product
3. Add quantity
4. Submit request
5. Go to /storage/orders
6. Select request
7. Enter prepared quantity
8. Click تحویل درخواست
9. Go to /staff/dashboard
10. Confirm received
11. Go to /storage/dashboard
12. Check inventory deducted
13. Go to /manager/reports or /storage/reports
14. Select date range and confirm movement appears
```

---

## 14. Current Best Next Prompt

Use this next time:

```text
Continue Penza Cafe & Storage SaaS from the updated Holy Bible. Role session and route guards are done. Staff exact stock quantity is hidden for safer MVP, but staff now sees broad availability labels. Storage stock UX has filters, sorting, quick + / - corrections, correction reasons, latest movement column, improved delete confirmation, and the row-level edit button has been removed. Default statistic cards above the storage stock list were removed because they were noisy; show summary numbers only in reports/manager-style views when asked. Storage order packing is clamped to available inventory and shows shortage/status badges. Report page has date presets, Excel-compatible .xls export, CSV export, and PDF/print action. UI numbers use English/Latin digits while Persian RTL language is preserved. Keep UI Persian RTL, green + white, official green #00A300. Keep workflow simple: only درخواست کالا and تحویل درخواست. Do not bring back urgent/critical/problem UI. Next polish staff favorites/presets and manager daily cards, then plan Supabase.
```

---

## 15. Current Project Status Summary

Current MVP status:

```text
Real Excel stock imported ✅
Shared local order/inventory store ✅
Staff can create requests ✅
Storage can prepare and deliver requests ✅
Storage can manage whole stock list ✅
Manager can monitor orders/inventory ✅
Manager/storage reports exist ✅
Green + white Penza design applied ✅
Simple workflow restored ✅
Temporary role guards added ✅
Exact staff stock quantity hidden ✅
CSV report export added ✅
Excel-compatible report export added ✅
PDF/print report action added ✅
Report date presets added ✅
Storage stock UX improved ✅
Quick stock correction with reason added ✅
Dead stock-row edit button removed ✅
Storage packing clamped to actual stock ✅
Storage shortage/status badges added ✅
English/Latin UI digits applied ✅
Staff broad availability labels added ✅
Zero-stock manager/storage visibility added ✅
Noisy storage stock-list summary cards removed ✅
Real database missing ❌
Real authentication missing ❌
Native .xlsx export missing ❌
```
