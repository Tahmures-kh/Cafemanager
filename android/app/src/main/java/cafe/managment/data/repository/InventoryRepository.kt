package cafe.managment.data.repository

import cafe.managment.data.model.InventoryItem
import cafe.managment.data.model.Product
import cafe.managment.data.model.StockMovement
import cafe.managment.data.network.AdjustInventoryRequest
import cafe.managment.data.network.InventoryProductRequest
import cafe.managment.data.network.RetrofitProvider
import cafe.managment.data.settings.AppSettingsRepository
import kotlinx.coroutines.flow.first

data class InventorySnapshot(
    val products: List<Product>,
    val inventoryItems: List<InventoryItem>,
    val movements: List<StockMovement>,
)

class InventoryRepository(private val settingsRepository: AppSettingsRepository) {

    private suspend fun api() = RetrofitProvider.get(settingsRepository.baseUrl.first())

    suspend fun getInventory(): InventorySnapshot {
        val response = api().getInventory()
        return InventorySnapshot(response.products, response.inventoryItems, response.movements)
    }

    suspend fun addProduct(
        name: String,
        category: String,
        unit: String,
        stockUnit: String?,
        orderUnit: String?,
        orderUnitQuantity: Double?,
        orderQuantityStep: Double?,
        currentQuantity: Double,
        createdBy: String?,
    ): Product = api().createInventoryProduct(
        InventoryProductRequest(
            name = name,
            category = category,
            unit = unit,
            stockUnit = stockUnit,
            orderUnit = orderUnit,
            orderUnitQuantity = orderUnitQuantity,
            orderQuantityStep = orderQuantityStep,
            currentQuantity = currentQuantity,
            createdBy = createdBy,
        )
    ).product

    suspend fun updateProduct(
        productId: String,
        name: String,
        category: String,
        unit: String,
        stockUnit: String?,
        orderUnit: String?,
        orderUnitQuantity: Double?,
        orderQuantityStep: Double?,
        currentQuantity: Double,
        minimumQuantity: Double?,
        criticalQuantity: Double?,
        correctionReason: String?,
        createdBy: String?,
    ): Product = api().updateInventoryProduct(
        productId,
        InventoryProductRequest(
            name = name,
            category = category,
            unit = unit,
            stockUnit = stockUnit,
            orderUnit = orderUnit,
            orderUnitQuantity = orderUnitQuantity,
            orderQuantityStep = orderQuantityStep,
            currentQuantity = currentQuantity,
            minimumQuantity = minimumQuantity,
            criticalQuantity = criticalQuantity,
            correctionReason = correctionReason,
            createdBy = createdBy,
        )
    ).product

    suspend fun deleteProduct(productId: String) {
        api().deleteInventoryProduct(productId)
    }

    suspend fun adjustQuantity(productId: String, deltaQuantity: Double, reason: String?, createdBy: String?): InventoryItem =
        api().adjustInventoryProduct(productId, AdjustInventoryRequest(deltaQuantity, reason, createdBy)).inventoryItem
}
