package cafe.managment.ui.stafforders

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.model.CafeOrder
import cafe.managment.data.model.OrderItem
import cafe.managment.data.model.Product
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.repository.OrdersRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.settings.Role
import cafe.managment.ui.storageorders.isDeliveredStatus
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

private const val AUDIT_SCOPE = "orders"

enum class StaffOrderFilter { REQUESTED, DELIVERED }

class StaffOrdersViewModel(
    private val ordersRepository: OrdersRepository,
    private val inventoryRepository: InventoryRepository,
    private val auditRepository: AuditRepository,
    private val settingsRepository: AppSettingsRepository,
) : ViewModel() {

    var orders by mutableStateOf<List<CafeOrder>>(emptyList()); private set
    var orderItems by mutableStateOf<List<OrderItem>>(emptyList()); private set
    var products by mutableStateOf<List<Product>>(emptyList()); private set
    var isLoading by mutableStateOf(false); private set
    var errorMessage by mutableStateOf<String?>(null); private set
    var infoMessage by mutableStateOf<String?>(null); private set
    var actorName by mutableStateOf(""); private set

    var activeFilter by mutableStateOf(StaffOrderFilter.REQUESTED); private set
    var selectedOrderId by mutableStateOf<String?>(null); private set
    var confirming by mutableStateOf(false); private set

    init {
        viewModelScope.launch {
            actorName = settingsRepository.actorName.first().orEmpty()
            load()
        }
    }

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

    fun onActorNameChange(value: String) {
        actorName = value
        viewModelScope.launch {
            settingsRepository.setActorName(value)
            load()
        }
    }

    fun onFilterChange(filter: StaffOrderFilter) {
        activeFilter = filter
        selectedOrderId = visibleOrders().firstOrNull()?.id
    }

    fun selectOrder(orderId: String) { selectedOrderId = orderId }

    private fun myOrders(): List<CafeOrder> =
        if (actorName.isBlank()) orders else orders.filter { it.requestedBy == actorName }

    fun visibleOrders(): List<CafeOrder> = myOrders().filter { order ->
        if (order.status == "cancelled") return@filter false
        if (activeFilter == StaffOrderFilter.DELIVERED) isDeliveredStatus(order.status) else !isDeliveredStatus(order.status)
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

    fun requestedCount(): Int = myOrders().count { !isDeliveredStatus(it.status) && it.status != "cancelled" }
    fun deliveredCount(): Int = myOrders().count { isDeliveredStatus(it.status) }
    fun pendingConfirmationCount(): Int = myOrders().count { it.status == "sent" }

    fun confirmReceived(orderId: String) {
        viewModelScope.launch {
            confirming = true
            errorMessage = null
            try {
                ordersRepository.confirmReceived(orderId, actorName.ifBlank { null })
                auditRepository.logEvent(AUDIT_SCOPE, "confirm_received", "تایید دریافت درخواست #${orderId.takeLast(6)}", Role.STAFF.value, actorName.ifBlank { null })
                infoMessage = "دریافت درخواست #${orderId.takeLast(6)} با موفقیت تایید شد."
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در تایید دریافت: ${e.message}"
            } finally {
                confirming = false
            }
        }
    }

    fun dismissInfo() { infoMessage = null }
}
