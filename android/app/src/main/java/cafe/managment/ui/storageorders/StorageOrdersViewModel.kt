package cafe.managment.ui.storageorders

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.model.CafeOrder
import cafe.managment.data.model.InventoryItem
import cafe.managment.data.model.OrderItem
import cafe.managment.data.model.Product
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.repository.OrdersRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.settings.Role
import cafe.managment.data.util.ProductUnits
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

private const val AUDIT_SCOPE = "orders"

enum class StorageOrderFilter { REQUESTED, DELIVERED }

data class AggregatedRequestItem(val productId: String, val requested: Double, val packed: Double, val orderCount: Int)

fun isDeliveredStatus(status: String) = status == "sent" || status == "received"

fun orderStatusLabel(status: String) = when (status) {
    "received" -> "تحویل تایید شد"
    "sent" -> "تحویل درخواست"
    "cancelled" -> "لغو شده"
    else -> "درخواست کالا"
}

class StorageOrdersViewModel(
    private val ordersRepository: OrdersRepository,
    private val inventoryRepository: InventoryRepository,
    private val auditRepository: AuditRepository,
    private val settingsRepository: AppSettingsRepository,
) : ViewModel() {

    var orders by mutableStateOf<List<CafeOrder>>(emptyList()); private set
    var orderItems by mutableStateOf<List<OrderItem>>(emptyList()); private set
    var products by mutableStateOf<List<Product>>(emptyList()); private set
    var inventoryItems by mutableStateOf<List<InventoryItem>>(emptyList()); private set
    var isLoading by mutableStateOf(false); private set
    var errorMessage by mutableStateOf<String?>(null); private set
    var infoMessage by mutableStateOf<String?>(null); private set
    var actorName by mutableStateOf(""); private set

    var activeFilter by mutableStateOf(StorageOrderFilter.REQUESTED); private set
    var selectedOrderId by mutableStateOf<String?>(null); private set
    var packedInputs by mutableStateOf<Map<String, String>>(emptyMap()); private set
    var busyOrderId by mutableStateOf<String?>(null); private set

    init {
        viewModelScope.launch { actorName = settingsRepository.actorName.first().orEmpty() }
        load()
    }

    fun load() {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                val ordersSnapshot = ordersRepository.getOrders()
                orders = ordersSnapshot.orders
                orderItems = ordersSnapshot.items
                val inventorySnapshot = inventoryRepository.getInventory()
                products = inventorySnapshot.products
                inventoryItems = inventorySnapshot.inventoryItems
                packedInputs = orderItems.associate { it.id to formatQuantity(it.packedQuantity) }
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
        viewModelScope.launch { settingsRepository.setActorName(value) }
    }

    fun onFilterChange(filter: StorageOrderFilter) {
        activeFilter = filter
        selectedOrderId = visibleOrders().firstOrNull()?.id
    }

    fun selectOrder(orderId: String) { selectedOrderId = orderId }

    fun visibleOrders(): List<CafeOrder> = orders.filter { order ->
        if (order.status == "cancelled") return@filter false
        if (activeFilter == StorageOrderFilter.DELIVERED) isDeliveredStatus(order.status) else !isDeliveredStatus(order.status)
    }

    fun selectedOrder(): CafeOrder? = visibleOrders().find { it.id == selectedOrderId } ?: visibleOrders().firstOrNull()

    fun itemsFor(orderId: String): List<OrderItem> = orderItems.filter { it.orderId == orderId }

    fun productFor(productId: String): Product? = products.find { it.id == productId }

    fun inventoryFor(productId: String): InventoryItem? = inventoryItems.find { it.productId == productId }

    fun totalsFor(orderId: String): Triple<Double, Double, Int> {
        val items = itemsFor(orderId)
        return Triple(items.sumOf { it.requestedQuantity }, items.sumOf { it.packedQuantity }, items.size)
    }

    fun progressPercent(requested: Double, packed: Double): Int {
        if (requested <= 0) return 0
        return ((packed / requested) * 100).toInt().coerceIn(0, 100)
    }

    fun aggregatedItems(): List<AggregatedRequestItem> {
        val visibleIds = visibleOrders().map { it.id }.toSet()
        val relevant = orderItems.filter { it.orderId in visibleIds }
        return relevant.groupBy { it.productId }
            .map { (productId, items) ->
                AggregatedRequestItem(
                    productId = productId,
                    requested = items.sumOf { it.requestedQuantity },
                    packed = items.sumOf { it.packedQuantity },
                    orderCount = items.map { it.orderId }.distinct().size,
                )
            }
            .sortedByDescending { it.requested - it.packed }
    }

    fun notStartedCount(): Int = orders.count { order ->
        !isDeliveredStatus(order.status) && order.status != "cancelled" && totalsFor(order.id).second <= 0.0
    }

    fun onPackedInputChange(itemId: String, value: String) {
        packedInputs = packedInputs + (itemId to value)
    }

    fun submitPackedQuantity(orderId: String, itemId: String) {
        val value = packedInputs[itemId]?.trim()?.toDoubleOrNull() ?: return
        viewModelScope.launch {
            errorMessage = null
            try {
                ordersRepository.updatePackedQuantity(orderId, itemId, value)
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در ثبت مقدار آماده‌شده: ${e.message}"
            }
        }
    }

    fun fillRequested(orderId: String) {
        viewModelScope.launch {
            busyOrderId = orderId
            errorMessage = null
            try {
                ordersRepository.fillRequested(orderId)
                auditRepository.logEvent(AUDIT_SCOPE, "fill_requested", "آماده‌سازی خودکار طبق موجودی برای درخواست #${orderId.takeLast(6)}", Role.STORAGE.value, actorName.ifBlank { null })
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در آماده‌سازی: ${e.message}"
            } finally {
                busyOrderId = null
            }
        }
    }

    fun deliverOrder(orderId: String) {
        val (requested, packed, _) = totalsFor(orderId)
        val hasPackable = itemsFor(orderId).any { item ->
            val product = productFor(item.productId)
            val available = ProductUnits.stockToOrderQuantity(product, inventoryFor(item.productId)?.currentQuantity ?: 0.0)
            minOf(item.requestedQuantity, available) > 0
        }

        if (packed <= 0.0 && !hasPackable) {
            errorMessage = "برای این درخواست هیچ موجودی قابل تحویل وجود ندارد. اول موجودی انبار را اصلاح کن."
            return
        }

        viewModelScope.launch {
            busyOrderId = orderId
            errorMessage = null
            try {
                if (packed <= 0.0) {
                    ordersRepository.fillRequested(orderId)
                }
                ordersRepository.deliverOrder(orderId, actorName.ifBlank { null })
                auditRepository.logEvent(AUDIT_SCOPE, "deliver_order", "تحویل درخواست #${orderId.takeLast(6)}", Role.STORAGE.value, actorName.ifBlank { null })
                infoMessage = "تحویل درخواست #${orderId.takeLast(6)} با موفقیت ثبت شد."
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در تحویل درخواست: ${e.message}"
            } finally {
                busyOrderId = null
            }
        }
    }

    fun dismissInfo() { infoMessage = null }
}

private fun formatQuantity(value: Double): String = if (value == value.toLong().toDouble()) value.toLong().toString() else value.toString()
