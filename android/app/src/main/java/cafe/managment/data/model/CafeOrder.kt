package cafe.managment.data.model

import kotlinx.serialization.Serializable

@Serializable
data class CafeOrder(
    val id: String,
    val requestedBy: String,
    val status: String,
    val note: String? = null,
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
data class OrderItem(
    val id: String,
    val orderId: String,
    val productId: String,
    val requestedQuantity: Double,
    val packedQuantity: Double,
)
