package cafe.managment.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Supplier(
    val id: String,
    val name: String,
    val phone: String,
    val website: String? = null,
    val notes: String? = null,
    val createdAt: String,
)
