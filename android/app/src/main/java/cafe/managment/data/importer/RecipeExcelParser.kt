package cafe.managment.data.importer

import cafe.managment.data.model.Product

private val RECIPE_NAME_HEADERS = listOf("نام رسپی", "رسپی", "عنوان رسپی")
private val INGREDIENT_NAME_HEADERS = listOf("نام ماده اولیه", "ماده اولیه", "نام کالا", "کالا")
private val QUANTITY_HEADERS = listOf("مقدار", "مقدار مصرفی", "تعداد")

data class ParsedIngredientRow(
    val ingredientName: String,
    val quantity: Double,
    val productId: String?,
    val stockUnit: String?,
)

data class ParsedRecipePreview(
    val name: String,
    val rows: MutableList<ParsedIngredientRow> = mutableListOf(),
)

data class RecipeExcelParseResult(
    val recipes: List<ParsedRecipePreview>,
    val matchedCount: Int,
    val unmatchedCount: Int,
)

/** Mirrors staff-management-saas/lib/recipe-excel.ts's parseRecipeExcelRows. */
object RecipeExcelParser {

    fun parse(rows: List<Map<String, String>>, products: List<Product>): RecipeExcelParseResult {
        if (rows.isEmpty()) return RecipeExcelParseResult(emptyList(), 0, 0)

        val recipeNameKey = findColumnKey(rows[0], RECIPE_NAME_HEADERS)
        val ingredientNameKey = findColumnKey(rows[0], INGREDIENT_NAME_HEADERS)
        val quantityKey = findColumnKey(rows[0], QUANTITY_HEADERS)

        requireNotNull(recipeNameKey) { "ستون «نام رسپی» پیدا نشد." }
        requireNotNull(ingredientNameKey) { "ستون «نام ماده اولیه» پیدا نشد." }
        requireNotNull(quantityKey) { "ستون «مقدار» پیدا نشد." }

        val productsByName = products.associateBy { normalize(it.name) }
        val recipesByName = LinkedHashMap<String, ParsedRecipePreview>()
        var matchedCount = 0
        var unmatchedCount = 0

        for (row in rows) {
            val recipeName = row[recipeNameKey]?.trim().orEmpty()
            val ingredientName = row[ingredientNameKey]?.trim().orEmpty()
            val quantity = row[quantityKey]?.trim()?.toDoubleOrNull() ?: 0.0

            if (recipeName.isEmpty() || ingredientName.isEmpty()) continue

            val product = productsByName[normalize(ingredientName)]
            if (product != null) matchedCount++ else unmatchedCount++

            val ingredientRow = ParsedIngredientRow(
                ingredientName = ingredientName,
                quantity = quantity,
                productId = product?.id,
                stockUnit = product?.stockUnit ?: product?.unit,
            )

            recipesByName.getOrPut(normalize(recipeName)) { ParsedRecipePreview(name = recipeName) }
                .rows.add(ingredientRow)
        }

        return RecipeExcelParseResult(recipesByName.values.toList(), matchedCount, unmatchedCount)
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
