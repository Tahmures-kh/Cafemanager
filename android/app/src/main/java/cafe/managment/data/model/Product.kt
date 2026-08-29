package cafe.managment.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Product(
    val id: String,
    val name: String,
    val category: String,
    val unit: String,
    val stockUnit: String? = null,
    val orderUnit: String? = null,
    val orderUnitQuantity: Double? = null,
    val orderQuantityStep: Double? = null,
)

@Serializable
data class InventoryItem(
    val id: String,
    val productId: String,
    val currentQuantity: Double,
    val minimumQuantity: Double,
    val criticalQuantity: Double,
)

@Serializable
data class StockMovement(
    val id: String,
    val productId: String,
    val type: String,
    val quantity: Double,
    val description: String,
    val createdBy: String,
    val createdAt: String,
)
