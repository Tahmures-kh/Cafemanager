package cafe.managment.data.repository

import cafe.managment.data.model.IngredientPrice
import cafe.managment.data.network.ExchangeRatesResponse
import cafe.managment.data.network.IngredientPriceRequest
import cafe.managment.data.network.RetrofitProvider
import cafe.managment.data.settings.AppSettingsRepository
import kotlinx.coroutines.flow.first

class PricingRepository(private val settingsRepository: AppSettingsRepository) {

    private suspend fun api() = RetrofitProvider.get(settingsRepository.baseUrl.first())

    suspend fun getExchangeRates(): ExchangeRatesResponse = api().getExchangeRates()

    suspend fun getIngredientPrices(): List<IngredientPrice> = api().getIngredientPrices().prices

    suspend fun saveIngredientPrice(productId: String, productName: String?, unitPrice: Double, stockUnit: String?) {
        api().putIngredientPrice(
            IngredientPriceRequest(productId = productId, unitPrice = unitPrice, productName = productName, stockUnit = stockUnit)
        )
    }
}
