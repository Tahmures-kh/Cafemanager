package cafe.managment.data.model

import kotlinx.serialization.Serializable

@Serializable
data class SalesItem(
    val id: String? = null,
    val recipeId: String? = null,
    val itemName: String,
    val quantitySold: Double,
    val unitPrice: Double? = null,
    val revenue: Double? = null,
)

@Serializable
data class SalesBatch(
    val id: String,
    val shiftDate: String,
    val shiftLabel: String? = null,
    val sourceType: String,
    val sourceFileName: String? = null,
    val importedBy: String? = null,
    val createdAt: String,
    val items: List<SalesItem> = emptyList(),
)
