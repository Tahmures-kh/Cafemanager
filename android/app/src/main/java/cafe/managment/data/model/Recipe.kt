package cafe.managment.data.model

import kotlinx.serialization.Serializable

@Serializable
data class RecipeIngredient(
    val id: String? = null,
    val productId: String,
    val quantity: Double,
    val productName: String? = null,
    val stockUnit: String? = null,
)

@Serializable
data class Recipe(
    val id: String,
    val name: String,
    val category: String? = null,
    val ingredients: List<RecipeIngredient> = emptyList(),
    val createdAt: String,
    val updatedAt: String,
)
