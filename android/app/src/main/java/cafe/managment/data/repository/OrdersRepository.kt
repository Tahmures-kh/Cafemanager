package cafe.managment.data.repository

import cafe.managment.data.model.CafeOrder
import cafe.managment.data.model.OrderItem
import cafe.managment.data.network.CreateOrderItemRequest
import cafe.managment.data.network.CreateOrderRequest
import cafe.managment.data.network.RetrofitProvider
import cafe.managment.data.network.UpdateOrderRequest
import cafe.managment.data.network.UpdatePackedQuantityRequest
import cafe.managment.data.settings.AppSettingsRepository
import kotlinx.coroutines.flow.first

data class OrdersSnapshot(val orders: List<CafeOrder>, val items: List<OrderItem>)

class OrdersRepository(private val settingsRepository: AppSettingsRepository) {

    private suspend fun api() = RetrofitProvider.get(settingsRepository.baseUrl.first())

    suspend fun getOrders(): OrdersSnapshot {
        val response = api().getOrders()
        return OrdersSnapshot(response.orders, response.items)
    }

    suspend fun createOrder(requestedBy: String, note: String?, items: List<Pair<String, Double>>): OrdersSnapshot {
        val response = api().createOrder(
            CreateOrderRequest(
                requestedBy = requestedBy,
                note = note,
                items = items.map { (productId, quantity) -> CreateOrderItemRequest(productId, quantity) },
            )
        )
        return OrdersSnapshot(listOf(response.order), response.items)
    }

    suspend fun updateStatus(orderId: String, status: String, createdBy: String?): OrdersSnapshot {
        val response = api().updateOrder(orderId, UpdateOrderRequest(status = status, createdBy = createdBy))
        return OrdersSnapshot(listOf(response.order), response.items)
    }

    suspend fun fillRequested(orderId: String): OrdersSnapshot {
        val response = api().updateOrder(orderId, UpdateOrderRequest(fillRequested = true))
        return OrdersSnapshot(listOf(response.order), response.items)
    }

    suspend fun updatePackedQuantity(orderId: String, itemId: String, packedQuantity: Double): OrderItem =
        api().updatePackedQuantity(orderId, itemId, UpdatePackedQuantityRequest(packedQuantity)).item

    suspend fun cancelOrder(orderId: String, createdBy: String?) = updateStatus(orderId, "cancelled", createdBy)

    suspend fun confirmReceived(orderId: String, createdBy: String?) = updateStatus(orderId, "received", createdBy)

    suspend fun deliverOrder(orderId: String, createdBy: String?) = updateStatus(orderId, "sent", createdBy)
}
