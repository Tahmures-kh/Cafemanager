# Cafe & Storage SaaS — Project Holy Bible

**Project name:** Temporary / not finalized  
**Current project folder:** `C:\Projects\staff-management-saas`  
**Framework:** Next.js 16.2.9 with App Router, TypeScript, Tailwind CSS, Turbopack  
**Language:** Persian UI  
**Direction:** RTL  
**Current stage:** Frontend MVP with shared localStorage order workflow  
**Last updated:** 2026-06-17

---

## 1. Core Product Idea

This SaaS is for managing communication and operations between **cafes** and their **central storage/inventory**.

The main workflow is:

```text
Cafe staff requests goods
↓
Storage staff receives the request
↓
Storage staff prepares / packs the goods
↓
Storage sends the goods to the cafe
↓
Cafe confirms delivery
↓
Owner / manager sees everything
```

The platform is intended for use in Iran, so all visible UI text should be Persian and RTL.

---

## 2. Main Business Rule

The most important access rule:

```text
Cafe staff must NOT see storage stock.
```

Cafe staff should not see:

```text
- Current storage inventory
- Low-stock alerts
- Critical stock warnings
- Stock movement history
- Exact warehouse stock quantities
```

Cafe staff can only see:

```text
- Product list for requesting goods
- Their own cafe orders
- Order status
- Delivery confirmation button
```

Storage stock can be seen only by:

```text
- Owner
- Manager
- Storage staff
```

---

## 3. User Roles

### Owner / Manager

Full access.

Can see:

```text
- All cafe orders
- All storage inventory
- Low-stock alerts
- Critical stock alerts
- Stock movement history
- Cafe/order activity
- Future reports
- Future user management
```

Current route:

```text
/manager
/manager/dashboard
/manager/orders
/manager/tasks   ← legacy redirect to /manager/orders
/manager/inventory
```

---

### Cafe Staff

Limited access.

Can do:

```text
- Request goods from storage
- See only their own cafe orders
- Track order status
- Confirm delivered goods
```

Cannot do:

```text
- See storage stock
- See low-stock alerts
- See stock movement history
- See other cafes' sensitive data
- Access manager reports
```

Current route:

```text
/staff/dashboard
/staff/request
```

Note: `staff` currently means cafe staff. Later it may be better renamed to `/cafe`.

---

### Storage Staff / Storage Man

Operational storage access.

Can see:

```text
- Incoming cafe orders
- Order items
- Requested quantity
- Packed quantity
- Storage inventory
- Low-stock alerts
- Critical-stock alerts
- Stock movement history
```

Can do later:

```text
- Start packing
- Enter packed quantity
- Mark order ready
- Mark order sent
- Register stock-in
- Correct stock manually
- Record damaged/wasted goods
```

Current route:

```text
/storage
/storage/dashboard
```

---

## 4. Current App Routes

### Root / Role Selection

```text
/
```

Purpose:

```text
- Public MVP role entry page
- Shows manager, cafe staff, and storage staff entry cards
- Used for demo/testing until real login is added
```

Current links:

```text
/manager
/staff
/storage
```

Important rule:

```text
Root can link to role entry pages during MVP testing.
After entering a role, dashboards must not link into other role dashboards.
```

---

### Manager Main Page

```text
/manager
```

Purpose:

```text
- Main landing page for owner/manager
- Shows quick stats
- Links to manager dashboard, orders board, inventory
- Shows future placeholders for user management and reports
```

Important import path:

```ts
../../lib/mock-data
../../lib/types
```

---

### Manager Dashboard

```text
/manager/dashboard
```

Purpose:

```text
- High-level overview for owner/manager
- Shows active cafe orders
- Shows low-stock warnings
- Shows storage inventory summary
- Shows recent stock movements
```

Important import path:

```ts
../../../lib/mock-data
../../../lib/types
```

---

### Manager Orders Board

Current route:

```text
/manager/orders
```

Legacy route:

```text
/manager/tasks → redirects to /manager/orders
```

Actual purpose:

```text
- Cafe orders board
- Groups orders by status
- Shows order items
- Shows packed/requested quantities
```

Current order columns:

```text
pending    = در انتظار بررسی
packing    = در حال آماده‌سازی
ready      = آماده ارسال
sent       = ارسال شده
received   = تحویل شده
cancelled  = لغو شده
```

---

### Manager Inventory Page

```text
/manager/inventory
```

Purpose:

```text
- Full storage inventory page
- Shows current quantity
- Minimum quantity
- Critical quantity
- Status labels
- Stock movement history
```

Visible to:

```text
- Owner
- Manager
```

Storage staff sees storage/inventory summaries inside storage routes, not by entering manager inventory.

Not visible to:

```text
- Cafe staff
```

---

### Cafe Staff Dashboard

```text
/staff/dashboard
```

Purpose:

```text
- Cafe staff dashboard
- Shows only this cafe's own orders
- Shows order statuses
- Has button to register request goods
- Does NOT show storage inventory
```

Important rule:

```text
No storage stock information should appear here.
```

---

### Cafe Request Goods Page

```text
/staff/request
```

Purpose:

```text
- Cafe staff selects products and enters requested quantity
- User submits an order into the shared temporary localStorage store
- New order appears in manager and storage pages without Supabase yet
- No storage stock quantity shown
```

This page is for cafe staff only.

Important rule:

```text
Do not show current storage inventory on this page.
```

---

### Storage Main Page

```text
/storage
```

Purpose:

```text
- Main landing page for storage staff
- Shows quick stats
- Links only to storage dashboard and storage orders
- Does not link to manager inventory anymore
```

Important import path:

```ts
../../lib/mock-data
../../lib/types
```

---

### Storage Dashboard

```text
/storage/dashboard
```

Purpose:

```text
- Storage worker operational page
- Shows incoming cafe orders
- Shows each requested item
- Shows requested quantity and packed quantity
- Shows current warehouse stock for storage worker
- Shows low-stock and critical warnings
- Shows stock movement history
```

Visible to:

```text
- Storage staff
```

Owner/Manager should inspect the same operational data from `/manager/dashboard`, `/manager/orders`, and `/manager/inventory`, not by entering the storage role.

---

## 5. Current Data Model

Base seed mock data is stored in:

```text
lib/types.ts
lib/mock-data.ts
```

Shared temporary workflow data is handled in:

```text
lib/local-store.ts
```

Current storage method:

```text
Browser localStorage key: cafe-storage-mvp-store-v1
```

No real database yet.

---

## 6. Current TypeScript Types

Current important types:

```ts
export type UserRole = "owner" | "manager" | "cafe_staff" | "storage_staff";

export type UserStatus = "active" | "inactive" | "invited";

export type ProductCategory =
  | "coffee"
  | "dairy"
  | "packaging"
  | "bakery"
  | "syrup"
  | "cleaning"
  | "other";

export type InventoryStatus = "ok" | "low" | "critical";

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

---

## 7. Current Mock Users

Mock users:

```text
u1 = کامیار رضایی / owner / دفتر مدیریت
u2 = مریم احمدی / manager / دفتر مدیریت
u3 = علی محمدی / cafe_staff / کافه شعبه ونک
u4 = رضا کریمی / storage_staff / انبار مرکزی
```

Current hardcoded users:

```text
Cafe staff pages use u3
Storage pages use u4
```

This is temporary until authentication is added.

---

## 8. Current Mock Cafes

Current cafes:

```text
c1 = کافه شعبه ونک
c2 = کافه شعبه سعادت‌آباد
```

---

## 9. Current Mock Products

Current products:

```text
p1 = دانه قهوه عربیکا / کیلوگرم
p2 = شیر پرچرب / باکس
p3 = لیوان بیرون‌بر / عدد
p4 = درب لیوان / عدد
p5 = سیروپ کارامل / بطری
p6 = کروسان ساده / عدد
```

---

## 10. Inventory Status Logic

Current rule:

```ts
if currentQuantity <= criticalQuantity → critical
else if currentQuantity <= minimumQuantity → low
else → ok
```

Persian labels:

```text
ok       = موجودی کافی
low      = کمبود موجودی
critical = بحرانی
```

---

## 11. Order Status Logic

Order statuses:

```text
pending   = در انتظار بررسی
packing   = در حال آماده‌سازی
ready     = آماده ارسال
sent      = ارسال شده
received  = تحویل شده
cancelled = لغو شده
```

Expected future flow:

```text
pending → packing → ready → sent → received
```

Cancelled can happen from pending/packing/ready.

---

## 12. Current UI Language & Layout Rules

UI must remain:

```text
Persian
RTL
Clean SaaS dashboard style
B2B professional
Simple, not overloaded
```

In `app/layout.tsx`:

```tsx
<html lang="fa" dir="rtl">
```

Metadata:

```text
Title: سامانه مدیریت کافه و انبار
Description: مدیریت سفارش، موجودی، انبار و ارسال کالا بین کافه و انبار
```

---

## 13. Current Tech Status

Working:

```text
Next.js local server
Persian RTL UI
Role entry page
Manager main page
Manager dashboard
Manager order board under /manager/orders
Manager inventory page
Cafe dashboard
Cafe request goods page
Storage main page
Storage dashboard
Mock data
Shared localStorage order store
Cafe request creates real temporary order
Manager sees new/updated orders from local store
Storage sees new orders from local store
Storage can update packed quantity
Storage can move order pending → packing → ready → sent
Sending an order deducts packed quantity from temporary inventory
Cafe staff can confirm sent orders as received
Temporary stock movement rows are added when storage sends goods
```

Not built yet:

```text
Real login
Username/password authentication
Database
Database-backed order creation
Database-backed stock updates
Role-based route protection
Real cafe-specific filtering by authenticated user
Reports
User management
Deployment
PWA
```

---

## 14. Known Issues / Cleanup Needed

### 1. Rename routes — DONE

Current route:

```text
/manager/orders
```

Legacy route:

```text
/manager/tasks → redirects to /manager/orders
```

All manager links now use `/manager/orders`.

Possible future storage route:

```text
/storage/orders
```

---

### 2. Separate cafe and storage route names

Currently cafe staff is under:

```text
/staff/dashboard
/staff/request
```

Better future naming:

```text
/cafe/dashboard
/cafe/request
```

But current routes work and should not be renamed until the MVP is stable.

---

### 3. Temporary localStorage store — DONE for MVP testing

The request page now creates an order in `lib/local-store.ts`. Manager, storage, and cafe pages read from the same temporary localStorage state.

Limitations:

```text
- Data is only in the browser
- Data is not shared between different devices/users
- Data can be reset from the storage order board
- Supabase is still needed for real multi-user use
```

---

### 4. No real access control yet

Access rules are only represented in UI. Real protection must be done later with authentication and route guards.

---

### 5. Role-switch links — CLEANED

Manager, cafe, and storage pages should not contain links that send the user into another role dashboard.

Current rule:

```text
Manager pages link only to /manager/*
Cafe staff pages link only to /staff/*
Storage pages link only to /storage/*
```

Remaining security note:

```text
This is still UI-level isolation only. Direct URLs are not protected until authentication and route guards are added.
```

---

## 15. Import Path Rule

This caused errors before. Keep this rule:

```text
app/manager/page.tsx                 → ../../lib/mock-data and ../../lib/local-store
app/storage/page.tsx                 → ../../lib/local-store
app/manager/dashboard/page.tsx       → ../../../lib/mock-data and ../../../lib/local-store
app/manager/tasks/page.tsx           → redirect only
app/manager/orders/page.tsx          → ../../../lib/mock-data and ../../../lib/local-store
app/manager/inventory/page.tsx       → ../../../lib/mock-data and ../../../lib/local-store
app/storage/dashboard/page.tsx       → ../../../lib/mock-data and ../../../lib/local-store
app/storage/orders/page.tsx          → ../../../lib/mock-data and ../../../lib/local-store
app/staff/dashboard/page.tsx         → ../../../lib/mock-data and ../../../lib/local-store
app/staff/request/page.tsx           → ../../../lib/mock-data and ../../../lib/local-store
```

When replacing full scripts, always do:

```text
Ctrl + A → Delete → Paste full file
```

Do not paste new code under old code.

---

## 16. Suggested Next Session Plan

Start next session with this order:

### Step 1: Add fake role session and route guard

Create a temporary client-side role session so direct URL access is blocked during MVP testing.

Target behavior:

```text
Selecting /manager sets role = manager
Selecting /staff sets role = cafe_staff
Selecting /storage sets role = storage_staff
/manager/* redirects if current role is not manager/owner
/staff/* redirects if current role is not cafe_staff
/storage/* redirects if current role is not storage_staff
```

This is still not real security, but it prevents accidental direct URL role jumps while testing.

---

### Step 2: Improve manager control center

Manager should see everything inside manager routes:

```text
Today Orders
Storage Status
Low Stock Alerts
Cafe Requests
Recent Storage Movements
```

Do not make manager enter staff or storage dashboards.

---

### Step 3: Design database

Database tables needed:

```text
companies
users
cafes
storage_locations
products
inventory_items
cafe_orders
order_items
stock_movements
notifications
```

---

### Step 4: Add Supabase

Later stack:

```text
Supabase Auth
Supabase PostgreSQL
Row Level Security
```

Important RLS rules:

```text
Cafe staff can only see orders for their cafe.
Cafe staff cannot read inventory_items or stock_movements.
Storage staff can read inventory and orders.
Manager/Owner can read all company data.
```

---

## 17. Database Draft

Future tables:

```sql
companies
- id
- name
- created_at

users
- id
- company_id
- name
- username
- email
- role
- status
- cafe_id nullable
- storage_id nullable
- created_at

cafes
- id
- company_id
- name
- address
- manager_name
- created_at

storage_locations
- id
- company_id
- name
- address
- created_at

products
- id
- company_id
- name
- category
- unit
- is_active
- created_at

inventory_items
- id
- company_id
- storage_id
- product_id
- current_quantity
- minimum_quantity
- critical_quantity
- updated_at

cafe_orders
- id
- company_id
- cafe_id
- requested_by
- status
- note
- created_at
- updated_at

order_items
- id
- order_id
- product_id
- requested_quantity
- packed_quantity

stock_movements
- id
- company_id
- product_id
- storage_id
- type
- quantity
- description
- created_by
- created_at
```

---

## 18. MVP Definition

The MVP is not a full ERP.

The MVP should do only this:

```text
1. Cafe staff logs in
2. Cafe staff requests goods
3. Storage staff sees the request
4. Storage staff packs goods
5. Storage staff marks order sent
6. Cafe staff confirms received
7. Manager sees all orders and inventory
8. System shows low-stock alerts
```

Do not add yet:

```text
- Payroll
- Accounting
- Complex reports
- Supplier management
- Mobile native app
- AI
- Barcode scanner
- GPS delivery tracking
```

---

## 19. Product Philosophy

Keep the system simple and operational.

The product must reduce:

```text
- Phone calls between cafe and storage
- Forgotten goods
- Wrong quantities
- Unknown order status
- Lack of low-stock visibility for managers/storage
```

The product must improve:

```text
- Clear request flow
- Clear packing flow
- Clear delivery confirmation
- Inventory awareness
- Manager visibility
```

---

## 20. Current Final Status

Current app is a Persian RTL frontend MVP with shared temporary localStorage workflow.

Working pages:

```text
/                       Public role entry page
/manager                Manager main page
/manager/dashboard      Manager dashboard
/manager/orders         Manager order board
/manager/tasks          Legacy redirect to /manager/orders
/manager/inventory      Manager inventory page
/staff                  Cafe staff entry/login-style page
/staff/dashboard        Cafe-only dashboard
/staff/request          Cafe request goods page
/storage                Storage entry/login-style page
/storage/dashboard      Storage-only dashboard
/storage/orders         Storage operational order board
```

Next action:

```text
Add temporary role session/route guard, then polish manager dashboard as one control center.
```



---

## 21. Changelog — 2026-06-17 Role Isolation Cleanup

Changed:

```text
- Removed clickable role switching from the root page for cafe/storage demo roles.
- Removed manager page link back to role selection.
- Removed storage page link back to role selection.
- Removed staff dashboard link back to role selection.
- Removed cafe request link to /storage/orders.
- Removed storage page link to /manager/inventory.
- Rebuilt /staff/dashboard as cafe-only.
- Rebuilt /storage/dashboard as storage-only.
- Kept manager visibility inside manager routes: /manager/dashboard, /manager/orders, /manager/inventory.
```

Important:

```text
This prevents accidental cross-role navigation through UI clicks.
It is not real security yet. Direct URL access still requires authentication + route guards later.
```


---

## 22. Changelog — 2026-06-17 Staff/Storage Entry Fix

Problem found:

```text
The previous role isolation cleanup removed the clickable staff/storage entry cards from the root page too aggressively.
Also /staff did not exist, so a cafe staff login-style entry route was missing.
```

Fixed:

```text
- Restored root page role entry links:
  - /manager
  - /staff
  - /storage
- Added /staff as the cafe staff entry/login-style page.
- Kept /staff/dashboard as cafe-only.
- Kept /storage as the storage entry/login-style page.
- Kept manager pages isolated to /manager/* links only.
- Kept staff pages isolated to /staff/* links only.
- Kept storage pages isolated to /storage/* links only.
```

Rule clarified:

```text
The root page can be a public role entry page during MVP testing.
After entering a role, dashboards must not contain cross-role navigation.
Real security still requires authentication and route guards later.
```


---

## 23. Changelog — 2026-06-17 Shared Local Order Store

Implemented:

```text
- Added lib/local-store.ts.
- Added shared localStorage state for orders, order items, inventory items, and stock movements.
- Cafe request page now creates a real temporary order.
- Staff dashboard reads orders from the shared store.
- Staff dashboard can confirm sent orders as received.
- Manager main/dashboard/orders/inventory read live temporary order and inventory state.
- Storage main/dashboard/orders read live temporary order and inventory state.
- Storage order board can update packed quantity.
- Storage order board can fill packed quantities from requested quantities.
- Storage order board can move order status pending → packing → ready → sent.
- Storage order board can cancel active orders.
- When an order becomes sent, packed quantities are deducted from temporary inventory.
- When an order becomes sent, stock movement records are created.
- Added reset test data button on /storage/orders.
```

Important limitation:

```text
This is frontend-only localStorage. It proves the MVP workflow in one browser, but it is not real multi-user sync. Supabase is still needed later.
```

Test flow:

```text
1. Open /staff/request.
2. Create a new order.
3. Open /manager/orders and confirm the order appears.
4. Open /storage/orders.
5. Start packing, fill quantities, mark ready, mark sent.
6. Open /manager/dashboard and confirm status/inventory changed.
7. Open /staff/dashboard and confirm delivery.
```


---

## 24. Changelog — 2026-06-17 Modern Workspace UX + Storage Quantity Fix

Problem found:

```text
The MVP workflow worked, but several pages still felt like long static admin pages.
The storage order board also made requested item quantities too easy to miss, even though the data existed in the shared store.
```

Implemented:

```text
- Reworked /storage/orders into a modern operations workspace.
- Replaced the 6-column all-status board with status tabs.
- Added an order queue panel on the left.
- Added a selected order detail panel on the right.
- Made requested quantity a large primary field for each storage item.
- Made packed quantity an editable field beside the requested quantity.
- Added per-item progress and total order progress.
- Added clear Requested / Packed / Lines / Progress metrics.
- Kept storage actions: start packing, mark ready, mark sent, auto-fill quantities, cancel order.
- Reworked /manager/dashboard into a command-center style page.
- Added manager tabs: Overview, Orders, Inventory, Activity.
- Reworked /manager/orders into a modern manager order monitor with status tabs, order list, and detail panel.
- Manager can now inspect staff requests and storage progress without entering staff or storage dashboards.
```

Design direction:

```text
Avoid one long page where everything is stacked vertically.
Use app-like workspaces: header metrics, tabs, side list, detail panel, focused actions.
Manager should see everything inside manager routes only.
Storage should see clear operational packing data, especially requested quantities.
Staff should stay limited to request + own order tracking.
```

Still TODO:

```text
- Apply the same modern workspace style to /staff/dashboard and /staff/request.
- Add temporary role session and route guards.
- Add proper empty/loading states.
- Add search/filter for products and orders.
- Later: replace localStorage with Supabase for real multi-user sync.
```


---

## 25. Changelog — 2026-06-17 Penza Branding + Compact Storage List UX

User feedback:

```text
The requested quantities are visible, but the storage item cards are too large.
Storage man needs a compact list to keep an eye on all requested goods.
Some English UI text still appears in pages.
Cafe name is Penza.
```

Public Penza reference checked:

```text
- PenzaCafe public site uses cafe + bakery positioning.
- Menu is organized around categories such as coffee, tea/herbal drinks, shakes, desserts/cakes, sandwiches, salads, breakfast, main course, hot drinks, brewed coffee, and cold coffee.
- The UI direction should feel warmer and more cafe/bakery-like instead of generic cold SaaS admin.
```

Implemented:

```text
- Updated sample cafe identity to Penza Cafe.
- Updated visible branding in storage/order workspace toward Penza.
- Reworked /storage/orders again into a denser operational list.
- Added a compact aggregated goods table above the order detail area.
- Aggregated table shows all requested products for the selected status:
  - product name
  - number of orders needing it
  - total requested quantity
  - packed quantity
  - remaining quantity
  - current inventory
- Replaced oversized per-item cards with a compact table for selected order details.
- Storage item rows now show:
  - product
  - requested by cafe
  - packed input
  - inventory
  - remaining/completed status
- Kept actions:
  - start packing
  - auto-fill quantities
  - mark ready
  - mark sent
  - cancel order
  - reset test data
- Replaced remaining English UI text in the storage order workspace.
- Replaced major remaining English UI labels in manager dashboard/order monitor.
```

Design rule added:

```text
Storage screens should favor dense operational visibility over large presentation cards.
The storage man must be able to scan requested goods quickly without scrolling through huge cards.
Use detail panels only after selecting an order.
```

Still TODO:

```text
- Modernize /staff/request and /staff/dashboard with Penza styling.
- Add product search/category filters to staff request page.
- Add route guards and temporary role session.
- Replace localStorage with Supabase later.
```

---

## 26. Changelog — 2026-06-17 Penza Green Visual System + Alive Website Pass

User feedback:

```text
Penza main color is green, not brown.
Check Instagram page penza.cafe.
Apply the design direction across the whole website so it feels more alive.
```

Reference notes:

```text
- Penza public identity is cafe + bakery.
- Instagram/public references point to a green visual identity and modern cafe atmosphere.
- The internal system should feel operational and alive, not like a generic grey admin panel.
```

Implemented:

```text
- Replaced the previous brown/warm accent system with Penza green.
- Added a global Penza visual system in app/globals.css:
  - green radial background
  - Penza hero style
  - soft glass cards
  - live status dot
  - green primary buttons
  - softer table/header styling
- Redesigned the homepage into a more modern role-entry screen.
- Redesigned /manager entry page with green command-center style.
- Redesigned /staff entry page with Penza role-specific landing style.
- Redesigned /storage entry page with green operational landing style.
- Updated existing detailed pages with green primary colors instead of brown/slate where possible.
- Changed sample cafe name from Penza Cafe to Penza.
- Kept role isolation rule: manager does not navigate into staff/storage dashboards; manager views their data inside manager routes.
```

Design rule added:

```text
Penza identity color is green.
Use green as the main brand color, with soft mint backgrounds and white/glass cards.
Avoid long boring one-page admin layouts.
Prefer: hero summary, live metrics, compact cards, sticky tabs, tables, and focused detail panels.
```

Still TODO:

```text
- Continue polishing /staff/request and /staff/dashboard into a faster product-ordering workspace.
- Add search/category filter to staff request.
- Add temporary role session and route guards.
- Add real authentication and Supabase after local MVP flow is stable.
```

---

## 27. Changelog — 2026-06-17 Green + White Theme Fix and Reliable Role Entry Pages

User feedback:

```text
The staff and storage login pages stopped working again.
The green color is good, but the black/dark background should become white.
The full theme should feel green and white.
```

Implemented:

```text
- Rebuilt /staff as a simple reliable role-entry page.
- Rebuilt /storage as a simple reliable role-entry page.
- Removed store/data dependency from the staff and storage entry pages so login/entry buttons are less fragile.
- Homepage now has explicit direct entry buttons for:
  - manager
  - staff/cafe user
  - storage man
- Converted the global Penza theme from dark green hero sections to white-first green branding.
- Updated app/globals.css:
  - white page base
  - soft green/mint background glow
  - white hero cards
  - green primary buttons
  - green live dot
  - green/white cards and tables
- Updated manager, staff, storage, and storage order hero areas away from black/dark backgrounds.
- Kept green as the Penza brand color.
```

Design rule added:

```text
Penza internal system should use a green + white visual identity.
Avoid black/dark hero backgrounds.
Use green for action/status/brand accents, white for page surfaces, and soft mint for secondary panels.
Role entry pages must stay simple and reliable until real authentication is added.
```

Still TODO:

```text
- Add temporary role session and route guards.
- Modernize /staff/request with search, categories, quick quantity controls, and sticky selected-items cart.
- Continue replacing old grey/stone utility colors with Penza green/white where needed.
- Replace localStorage with Supabase after the MVP flow is stable.
```

---

## V1.9 Update — Official Penza Green Token

User requested the official website green to be:

```txt
#00A300
```

### Implemented
- Set `#00A300` as the main Penza green in the global design system.
- Updated primary buttons, active tabs, progress bars, selected order states, live indicators, and main green accents.
- Updated hover green to `#008A00`.
- Kept the overall theme white-first with soft green/mint surfaces.
- Removed remaining old deep/brown green brand values from the UI color system.

### Design Rule Going Forward
Use:
- Primary green: `#00A300`
- Hover green: `#008A00`
- Dark readable text: `#0B2F0B`
- Secondary accent green: `#007A00`
- Background: white / soft green-white only

Avoid:
- Brown theme colors
- Black/dark hero backgrounds
- Old green `#0f8f4f`

---

## V1.10 Update — Red Alert Layer for Urgent Requests and Problems

User feedback:

```txt
The green/white design is much better.
Add a red alert thing so the person using the site immediately understands the request or problem.
Continue to the next part.
```

### Implemented

- Added a shared alert helper file:
  - `lib/alerts.ts`
- Added global red alert styles in `app/globals.css`:
  - `penza-alert-card`
  - `penza-alert-badge`
  - `penza-alert-row`
  - `penza-alert-border`
  - pulsing red alert dot animation
- Added red alert logic for:
  - urgent order notes such as `فوری`, `ضروری`, `کمبود`, `urgent`, `asap`
  - requested quantity greater than available inventory
  - inventory at or below critical quantity
- Updated `/storage/orders`:
  - red alert summary banner
  - red warning badge on urgent/critical orders
  - red rows in the aggregated goods list when stock is not enough
  - red rows in selected order details when a line item cannot be packed safely
  - critical order cards become red-highlighted so storage staff sees them immediately
- Updated `/storage/dashboard`:
  - red alert banner at the top
  - red alert counter card
  - red-highlighted active orders with urgent issues
  - red-highlighted low-stock/critical inventory cards
- Updated `/manager/dashboard`:
  - red alert summary banner
  - red alert metric in the hero summary
  - red-highlighted critical orders and critical inventory items
  - warning/critical badges inside manager overview and order monitor
- Updated `/manager/orders`:
  - red alert counter in the hero
  - red alert banner above the order filters
  - red-highlighted order list items
  - red-highlighted manager order detail panel
  - red badges on line items with insufficient stock

### Alert Rules

```txt
Critical / Red:
- Order note contains urgent/problem words.
- Requested remaining quantity is greater than available inventory.
- Inventory current quantity is at or below critical quantity.

Warning / Amber:
- Order is still pending.
- Inventory is below minimum but above critical.
```

### Design Rule Going Forward

Red should be used only for real action-needed situations.
Do not make the whole site red.
Green remains the Penza brand/action color.
Red is only for urgent requests, impossible packing, critical inventory, or operational problems.

### Still TODO

```txt
- Modernize /staff/request with product search, category filters, quick quantity buttons, and sticky selected cart.
- Add temporary role session and route guards.
- Add manager approval/send-to-storage step if the workflow needs approval before packing.
- Later replace localStorage with Supabase.
```

---

## V1.11 Update — Modern Staff Ordering Screen and Staff Tracking Workspace

User asked to keep going after the red alert layer.

### Implemented

- Modernized `/staff/request` into a real app-like ordering screen:
  - product search
  - category filter chips
  - compact product cards
  - quick quantity buttons: `+1`, `+5`, `+10`
  - plus/minus quantity controls
  - sticky selected-items cart on desktop
  - order summary counters in the hero
  - clean green/white Penza visual style
- Added staff-side urgent mode:
  - user can mark the request as `فوری / مشکل‌دار`
  - urgent mode adds `فوری` to the order note
  - manager/storage red alert system automatically detects it
- Modernized `/staff/dashboard`:
  - app-like status workspace instead of long static cards
  - status filters: active, sent, received, all
  - compact order list
  - selected order detail panel
  - progress bars for requested vs packed quantities
  - staff can confirm received sent orders
  - urgent staff orders show red alert styling

### Design/UX Rule Going Forward

Staff pages should feel fast for shift usage:

```txt
Search → category → quick quantity → sticky cart → send request
```

The staff role must remain limited:

```txt
Staff can request and track their own cafe orders.
Staff must not see internal storage controls, inventory warnings, or manager tools.
```

### Still TODO

```txt
- Add temporary role session and route guards.
- Add manager approval/send-to-storage step if the workflow needs approval before packing.
- Add better mobile polish after testing on browser/device size.
- Later replace localStorage with Supabase.
```

---

## V1.12 Update — Simplified Two-State Request Flow

User feedback:

```txt
Remove the extra critical/urgent/problem concepts.
There should only be order request and request delivered.
Make it simple and easy.
```

### Implemented

- Simplified the MVP workflow to two visible business states:
  - `درخواست کالا`
  - `تحویل درخواست`
- Removed urgent mode from `/staff/request`.
- Removed red alert/critical/warning UI from the main app screens.
- Removed visible critical stock language from manager/storage pages.
- Removed the shared red alert helper from active code.
- Simplified `/staff/request`:
  - staff only selects products, quantities, optional note, and submits request.
- Simplified `/staff/dashboard`:
  - only two tabs: requests and delivered.
  - staff can still confirm received orders after storage marks them delivered.
- Simplified `/storage/orders`:
  - only two tabs: request goods and delivered requests.
  - storage man can enter packed quantities and press `تحویل درخواست`.
  - no start packing / ready / urgent / critical concepts in UI.
- Simplified `/storage/dashboard`:
  - only shows request count, delivered count, requested item count, inventory summary, and recent deliveries.
- Simplified `/manager/dashboard` and `/manager/orders`:
  - manager sees request/delivered status only, without entering staff or storage dashboards.
- Simplified `/manager/inventory`:
  - shows current inventory and stock movement only.
  - no critical/alert panel.
- Updated homepage and role entry text to match the simplified workflow.

### Current MVP Flow

```txt
Staff creates request
↓
Storage sees request
↓
Storage enters prepared quantity
↓
Storage marks request delivered
↓
Staff sees delivered request
↓
Staff can confirm received
↓
Manager monitors everything from manager pages
```

### Design Rule Going Forward

Keep Penza MVP simple:

```txt
Only two main workflow labels:
1. درخواست کالا
2. تحویل درخواست
```

Avoid adding extra workflow labels unless the user explicitly asks later:

```txt
urgent / critical / warning / ready / packing / problem
```

Internal code may still keep basic status values temporarily, but the visible UI should stay simple.

### Next TODO

```txt
- Add temporary role session and route guards.
- Improve mobile responsive layout.
- Later replace localStorage with Supabase.
```

---

## V1.13 Update — Real Penza Stock Imported From Excel

User uploaded:

```txt
انبار گردانی اردیبهشت 1405.xlsx
```

### Implemented

- Imported the Excel stock list into the app seed data.
- Replaced the old fake 6-product sample inventory with real Penza stock items.
- Imported 426 stock items from the Excel sheet.
- Used these Excel columns:
  - `نام کالا` → product name
  - `واحد` → product unit
  - `مانده` → current storage quantity
- Added automatic simple category mapping for request filters:
  - قهوه
  - لبنیات
  - بسته‌بندی
  - نان و شیرینی
  - سیروپ
  - نظافت
  - متفرقه
- Reset initial demo orders to empty so the MVP starts clean with real stock.
- Updated the localStorage key so the browser loads the new real stock seed automatically.
- Updated staff request page:
  - staff can now search through the real stock list.
  - each product shows current storage quantity.
  - decimal quantities are now allowed for kg/liter items.
- Updated manager inventory page:
  - added search by product name, unit, or category.
  - inventory table now represents the imported Excel stock.

### Important Note

The imported categories are best-effort based on product names. They are good enough for MVP testing, but later the manager should be able to edit product categories manually.

### Current Data State

```txt
Products: 426 real Excel items
Initial orders: empty
Initial movements: empty
Storage source: localStorage seed from mock-data.ts
```

### Next TODO

```txt
- Test real-stock request flow from /staff/request.
- Add manual inventory edit screen for manager/storage.
- Add Excel import/export flow later so new stock files can be uploaded without code changes.
- Add temporary role session and route guards.
- Later replace localStorage with Supabase.
```

---

## V1.14 Update — Storage Stock Control + Period Reports

User requested:

```txt
The storage man should be able to see the whole stocks in his dashboard and able to edit/add/remove stocks so it can be updated all the time.
We should have report button so it can give manager or storage man a report of what happened in a selected period of time.
```

### Implemented

- Upgraded `/storage/dashboard` into a real stock-control workspace.
- Storage man can now see the full stock list directly on the storage dashboard.
- Added stock search by:
  - product name
  - unit
  - category
- Added stock editor form for storage:
  - add product
  - edit product name
  - edit category
  - edit unit
  - edit current quantity
  - remove product
- Inventory is now editable from the shared local store, not only from the static Excel seed.
- Product data was moved into the localStorage store state so newly added/edited/deleted stock appears across:
  - staff request page
  - storage dashboard
  - storage orders
  - manager dashboard
  - manager inventory
  - manager orders
- Added stock movement records when storage adds, edits, or removes stock.
- Updated localStorage key to reset the browser into the new editable stock data model.

### Reports Added

New pages:

```txt
/storage/reports
/manager/reports
```

Report features:

- Select start date and end date.
- Shows what happened in that period:
  - number of requests created
  - number of delivered requests
  - total requested quantity
  - total delivered quantity
  - stock edits / additions / removals
  - stock movements table
  - top delivered products in the period
- Added report buttons/links from:
  - storage entry
  - storage dashboard
  - storage orders
  - manager entry
  - manager dashboard
  - manager inventory
  - manager orders
- Added print report button.
- Added copy summary button.

### Important Technical Change

- New records now use ISO date strings internally.
- UI displays them in Persian date/time format using `formatDateTime()`.
- This makes date-range reporting possible with normal browser date inputs.

### Current MVP Flow

```txt
Staff requests real stock items
↓
Storage sees request and prepares quantities
↓
Storage marks request delivered
↓
Inventory is deducted automatically
↓
Storage can manually edit stock any time
↓
Manager/storage can generate date-range reports
```

### Next TODO

```txt
- Test add/edit/remove stock in /storage/dashboard.
- Test date range reports after creating/delivering sample requests.
- Add temporary role session and route guards.
- Add export report to CSV/Excel later.
- Later replace localStorage with Supabase.
```
