package cafe.managment.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ExchangeRateValues(
    val usd: Double,
    val eur: Double,
    @SerialName("try") val tryLira: Double = 0.0,
)

@Serializable
data class IngredientPrice(
    val productId: String,
    val productName: String,
    val unitPrice: Double,
    val stockUnit: String? = null,
    val updatedAt: String,
)
