package cafe.managment.data.model

import kotlinx.serialization.Serializable

@Serializable
data class PurchaseOrderItem(
    val id: String? = null,
    val productId: String? = null,
    val productName: String,
    val quantity: Double,
    val stockUnit: String? = null,
)

@Serializable
data class PurchaseOrder(
    val id: String,
    val supplierId: String,
    val status: String,
    val smsStatus: String,
    val createdBy: String? = null,
    val createdAt: String,
    val items: List<PurchaseOrderItem> = emptyList(),
)
