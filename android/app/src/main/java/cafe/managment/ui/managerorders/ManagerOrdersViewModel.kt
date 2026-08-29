package cafe.managment.ui.managerorders

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.model.CafeOrder
import cafe.managment.data.model.OrderItem
import cafe.managment.data.model.Product
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.repository.OrdersRepository
import cafe.managment.ui.storageorders.isDeliveredStatus
import kotlinx.coroutines.launch

enum class ManagerOrderFilter { REQUESTED, DELIVERED }

class ManagerOrdersViewModel(
    private val ordersRepository: OrdersRepository,
    private val inventoryRepository: InventoryRepository,
) : ViewModel() {

    var orders by mutableStateOf<List<CafeOrder>>(emptyList()); private set
    var orderItems by mutableStateOf<List<OrderItem>>(emptyList()); private set
    var products by mutableStateOf<List<Product>>(emptyList()); private set
    var isLoading by mutableStateOf(false); private set
    var errorMessage by mutableStateOf<String?>(null); private set

    var activeFilter by mutableStateOf(ManagerOrderFilter.REQUESTED); private set
    var selectedOrderId by mutableStateOf<String?>(null); private set

    init { load() }

    fun load() {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                val ordersSnapshot = ordersRepository.getOrders()
                orders = ordersSnapshot.orders
                orderItems = ordersSnapshot.items
                products = inventoryRepository.getInventory().products
                if (selectedOrderId == null) selectedOrderId = visibleOrders().firstOrNull()?.id
            } catch (e: Exception) {
                errorMessage = "خطا در دریافت اطلاعات: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }

    fun onFilterChange(filter: ManagerOrderFilter) {
        activeFilter = filter
        selectedOrderId = visibleOrders().firstOrNull()?.id
    }

    fun selectOrder(orderId: String) { selectedOrderId = orderId }

    fun visibleOrders(): List<CafeOrder> = orders.filter { order ->
        if (order.status == "cancelled") return@filter false
        if (activeFilter == ManagerOrderFilter.DELIVERED) isDeliveredStatus(order.status) else !isDeliveredStatus(order.status)
    }

    fun selectedOrder(): CafeOrder? = visibleOrders().find { it.id == selectedOrderId } ?: visibleOrders().firstOrNull()

    fun itemsFor(orderId: String): List<OrderItem> = orderItems.filter { it.orderId == orderId }

    fun productFor(productId: String): Product? = products.find { it.id == productId }

    fun totalsFor(orderId: String): Triple<Double, Double, Int> {
        val items = itemsFor(orderId)
        return Triple(items.sumOf { it.requestedQuantity }, items.sumOf { it.packedQuantity }, items.size)
    }

    fun progressPercent(requested: Double, packed: Double): Int {
        if (requested <= 0) return 0
        return ((packed / requested) * 100).toInt().coerceIn(0, 100)
    }
}
