---
name: cafemanagment-project-overview
description: What this Android app is, its companion web backend, and which screens are built vs. missing
metadata:
  type: project
---

`cafemanagment` (package `cafe.managment`) is an Android/Jetpack Compose companion app for a Next.js
web app called `staff-management-saas`. There is no real hosting yet — the user runs the Next.js
backend locally via `next dev` and enters the reachable base URL (emulator loopback `10.0.2.2:3000` or
the PC's LAN IP for a physical device) on the app's server-settings screen. `RetrofitProvider` rebuilds
the Retrofit client whenever that URL changes. `ApiService` mirrors `staff-management-saas/app/api/*`
routes (purchases, suppliers, recipes, sales, exchange rates, ingredient prices, audit).

Login is a hardcoded on-device credential check (`PenzaCredentials`, mirroring
`staff-management-saas/lib/auth.ts`) against three roles: MANAGER, STAFF, STORAGE
(`data/settings/Role.kt`). The active role persists in DataStore (`AppSettingsRepository`).

As of 2026-07-09 (end of day), all 11 screens are built and wired into `MainActivity`'s `NavHost`:
Login, Server Settings, Suppliers, Purchases, Recipes, Sales, Manager Dashboard, Manager Orders,
Staff Request, Staff Orders, Storage Inventory, Storage Orders, plus a role-aware Home screen with
an action-card grid gating each card to the right role(s). `./gradlew assembleDebug` succeeds.

A full "Penza" visual theme was built (`ui/theme/`: `Color.kt`, `Type.kt`, `Theme.kt`,
`PenzaComponents.kt`) mirroring `staff-management-saas/app/globals.css`'s green palette
(`#00A300`/`#007A00`/`#0B2F0B`), bold Persian headlines, rounded hero/card shapes, and a
`PenzaPill`/`PenzaHero`/`PenzaCard`/`PenzaStatusBadge`/`PenzaAuditHistory` component set reused by
every screen. `MainActivity` forces `LayoutDirection.Rtl` app-wide (the web forces `dir="rtl"`
regardless of locale; Compose does not do this automatically from Persian string content alone) —
except LTR is deliberately re-forced on URL/website input fields (`CompositionLocalProvider` override)
since embedding LTR content like URLs in an RTL paragraph otherwise produces stray bidi artifacts
(e.g. a phantom leading `/` before `http://...`).

Purchases/Recipes/Sales are **manager-only** on the web (only exist under `/manager`, never
`/staff` or `/storage`) — the Home screen's action-card grid gates these three cards to
`Role.MANAGER`; Suppliers/Settings stay visible to all roles. Audit, Exchange Rates, and Ingredient
Prices have API routes but no dedicated web page — they're small embedded panels (audit-history list,
ingredient-price table, exchange-rate readout), not separate nav destinations, and the Android port
follows that same embedding rather than inventing 3 extra screens.

Update: Orders and Inventory turned out to have real Next.js API routes after all (the earlier
`localStorage`-mock finding didn't hold for these two), so `OrdersRepository`/`InventoryRepository`
call `ApiService.getOrders()`/`getInventory()` etc. like every other repository — no local-storage
mock ended up being used on the Android side. Staff Request/Orders and Storage Inventory/Orders
screens were built on top of these same two repositories. `Tasks` remains out of scope. `Reports`
was out of scope until 2026-07-17: `/manager/reports` and `/storage/reports` both render the same
shared web component (`components/PeriodReport.tsx`, parametrized by `role`), so it was ported as one
`ui/report/PeriodReportScreen.kt` + `PeriodReportViewModel.kt` reused by both `Routes.MANAGER_REPORTS`
and `Routes.STORAGE_REPORTS` in `MainActivity.kt` — date-range presets (today/7-days/month-start),
6 summary cards, top-delivered-products, filtered orders list, filtered stock-movements list, and a
"copy summary" clipboard action. CSV/Excel/PDF export from the web version were deliberately *not*
ported (would need `FileProvider`/manifest changes not otherwise justified yet) — only the clipboard
summary made it across. See [[manager-inventory-role-leak-fix]] for the broader role-scoping audit
this was part of.

The product catalog (`Product`: id/name/category/unit/stockUnit/orderUnit/...) has no live API either
— it's the same static ~426-row array from `lib/mock-data.ts`. It was extracted once and bundled as
`app/src/main/assets/products.json`, loaded via `data/catalog/ProductCatalog.kt`
(`Json.decodeFromStream`, cached after first read). This is required plumbing, not a demo feature:
`RecipeIngredient.productId` is non-nullable, so Recipes needs a real product picker
(`ProductPicker` composable in `RecipesScreen.kt`: a filter-as-you-type list, not
`ExposedDropdownMenuBox` — avoided due to Material3 API-version uncertainty for that BOM). Purchases'
`PurchaseOrderItem.productId` is nullable, so that screen just uses free-text product-name fields.

Excel/CSV import (Recipes, Sales) uses `org.dhatim:fastexcel-reader:0.20.1` (added to
`libs.versions.toml`/`app/build.gradle.kts`) wrapped by `data/importer/SpreadsheetReader.kt`
(`ReadableWorkbook.firstSheet.read()` → header row + `Map<String,String>` per data row). Header-name
matching (`RecipeExcelParser.kt`, `SalesExcelParser.kt`) mirrors
`lib/recipe-excel.ts`/`lib/sales-excel.ts` exactly (same Persian header-variant lists, same
match-by-trimmed-lowercase-name rule). Sales also supports AI-photo import: uploads to the existing
server-side `/api/sales/extract-image` endpoint (multipart), no on-device AI dependency needed — the
model call is entirely server-side.

An `actorName` field (`AppSettingsRepository.actorName`, DataStore-backed) was added mirroring the
web's `lib/actor-name.ts` — a remembered "who is doing this" display name used for
`createdBy`/`importedBy`/audit `actorName`, since there's no real user-account system yet.

All screens follow the same pattern established by `SuppliersScreen`: a `ViewModel` with
`mutableStateOf` fields + `viewModelFactory { initializer { ... } }`, a repository constructed with
`AppSettingsRepository`, Persian-language UI strings, styled with the shared `Penza*` theme
components. Any new screen should follow that same shape for consistency.

See also [[agp-kotlin-plugin-conflict]] and [[core-ktx-compilesdk37-mismatch]] for build-config
history.

The project has no git repository yet.
