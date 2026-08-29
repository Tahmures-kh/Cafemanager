package cafe.managment.data.importer

import cafe.managment.data.model.Recipe
import cafe.managment.data.model.SalesItem

private val ITEM_NAME_HEADERS = listOf("نام آیتم", "نام محصول", "نام کالا", "نام رسپی", "آیتم")
private val QUANTITY_HEADERS = listOf("تعداد فروخته‌شده", "تعداد فروخته شده", "تعداد", "مقدار")
private val UNIT_PRICE_HEADERS = listOf("قیمت واحد", "قیمت")
private val REVENUE_HEADERS = listOf("مبلغ", "مبلغ کل", "جمع")

data class ParsedSalesRow(
    val itemName: String,
    val quantitySold: Double,
    val unitPrice: Double?,
    val revenue: Double?,
    val recipeId: String?,
)

data class SalesExcelParseResult(
    val rows: List<ParsedSalesRow>,
    val matchedCount: Int,
    val unmatchedCount: Int,
)

/** Mirrors staff-management-saas/lib/sales-excel.ts's parseSalesExcelRows: sold item names match recipe names, not product names. */
object SalesExcelParser {

    fun parse(rows: List<Map<String, String>>, recipes: List<Recipe>): SalesExcelParseResult {
        if (rows.isEmpty()) return SalesExcelParseResult(emptyList(), 0, 0)

        val itemNameKey = findColumnKey(rows[0], ITEM_NAME_HEADERS)
        val quantityKey = findColumnKey(rows[0], QUANTITY_HEADERS)
        val unitPriceKey = findColumnKey(rows[0], UNIT_PRICE_HEADERS)
        val revenueKey = findColumnKey(rows[0], REVENUE_HEADERS)

        requireNotNull(itemNameKey) { "ستون «نام آیتم» پیدا نشد." }
        requireNotNull(quantityKey) { "ستون «تعداد فروخته‌شده» پیدا نشد." }

        val recipesByName = recipes.associateBy { normalize(it.name) }
        var matchedCount = 0
        var unmatchedCount = 0

        val parsedRows = rows.mapNotNull { row ->
            val itemName = row[itemNameKey]?.trim().orEmpty()
            val quantitySold = row[quantityKey]?.trim()?.toDoubleOrNull() ?: 0.0
            if (itemName.isEmpty() || quantitySold <= 0.0) return@mapNotNull null

            val recipe = recipesByName[normalize(itemName)]
            if (recipe != null) matchedCount++ else unmatchedCount++

            ParsedSalesRow(
                itemName = itemName,
                quantitySold = quantitySold,
                unitPrice = unitPriceKey?.let { row[it]?.trim()?.toDoubleOrNull() },
                revenue = revenueKey?.let { row[it]?.trim()?.toDoubleOrNull() },
                recipeId = recipe?.id,
            )
        }

        return SalesExcelParseResult(parsedRows, matchedCount, unmatchedCount)
    }

    /** Mirrors matchSalesItemsToRecipes in the same web file — used for the AI-photo-extraction path. */
    fun matchToRecipes(items: List<SalesItem>, recipes: List<Recipe>): SalesExcelParseResult {
        val recipesByName = recipes.associateBy { normalize(it.name) }
        var matchedCount = 0
        var unmatchedCount = 0

        val rows = items
            .filter { it.itemName.isNotBlank() && it.quantitySold > 0.0 }
            .map { item ->
                val recipe = recipesByName[normalize(item.itemName)]
                if (recipe != null) matchedCount++ else unmatchedCount++
                ParsedSalesRow(
                    itemName = item.itemName,
                    quantitySold = item.quantitySold,
                    unitPrice = item.unitPrice,
                    revenue = item.revenue,
                    recipeId = recipe?.id,
                )
            }

        return SalesExcelParseResult(rows, matchedCount, unmatchedCount)
    }
}

private fun normalize(value: String) = value.trim().lowercase()

private fun findColumnKey(sampleRow: Map<String, String>, candidates: List<String>): String? {
    val keys = sampleRow.keys
    for (candidate in candidates) {
        val match = keys.find { normalize(it) == normalize(candidate) }
        if (match != null) return match
    }
    return null
}
