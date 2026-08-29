package cafe.managment.data.repository

import cafe.managment.data.model.PurchaseOrder
import cafe.managment.data.model.PurchaseOrderItem
import cafe.managment.data.network.CreatePurchaseRequest
import cafe.managment.data.network.RetrofitProvider
import cafe.managment.data.network.UpdatePurchaseRequest
import cafe.managment.data.settings.AppSettingsRepository
import kotlinx.coroutines.flow.first

class PurchasesRepository(private val settingsRepository: AppSettingsRepository) {

    private suspend fun api() = RetrofitProvider.get(settingsRepository.baseUrl.first())

    suspend fun getPurchases(): List<PurchaseOrder> = api().getPurchases().orders

    suspend fun createPurchase(
        supplierId: String,
        items: List<PurchaseOrderItem>,
        createdBy: String?,
    ): PurchaseOrder = api().createPurchase(
        CreatePurchaseRequest(supplierId = supplierId, items = items, createdBy = createdBy)
    ).order

    suspend fun updateStatus(id: String, status: String): PurchaseOrder =
        api().updatePurchase(id, UpdatePurchaseRequest(status = status)).order

    suspend fun resendSms(id: String): PurchaseOrder =
        api().updatePurchase(id, UpdatePurchaseRequest(resendSms = true)).order

    suspend fun deletePurchase(id: String) {
        api().deletePurchase(id)
    }
}
