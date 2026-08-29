package cafe.managment.ui.report

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.model.CafeOrder
import cafe.managment.data.model.OrderItem
import cafe.managment.data.model.Product
import cafe.managment.data.model.StockMovement
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.repository.OrdersRepository
import cafe.managment.data.settings.Role
import cafe.managment.data.util.ProductUnits
import cafe.managment.ui.storageorders.isDeliveredStatus
import kotlinx.coroutines.launch
import java.time.LocalDate

/** Kotlin port of staff-management-saas/components/PeriodReport.tsx — shared by manager/reports and storage/reports, same as the web component is shared by both roles. */

enum class ReportPreset { TODAY, WEEK, MONTH }

data class ReportCard(val title: String, val value: String, val hint: String)

data class TopDeliveredProduct(val product: Product, val quantity: Double)

class PeriodReportViewModel(
    val role: Role,
    private val ordersRepository: OrdersRepository,
    private val inventoryRepository: InventoryRepository,
) : ViewModel() {

    var orders by mutableStateOf<List<CafeOrder>>(emptyList()); private set
    var orderItems by mutableStateOf<List<OrderItem>>(emptyList()); private set
    var products by mutableStateOf<List<Product>>(emptyList()); private set
    var movements by mutableStateOf<List<StockMovement>>(emptyList()); private set
    var isLoading by mutableStateOf(false); private set
    var errorMessage by mutableStateOf<String?>(null); private set

    var startDate by mutableStateOf(daysAgoValue(7)); private set
    var endDate by mutableStateOf(todayValue()); private set

    init { load() }

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
                movements = inventorySnapshot.movements
            } catch (e: Exception) {
                errorMessage = "خطا در دریافت اطلاعات: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }

    fun onStartDateChange(value: String) { startDate = value }
    fun onEndDateChange(value: String) { endDate = value }

    fun applyPreset(preset: ReportPreset) {
        endDate = todayValue()
        startDate = when (preset) {
            ReportPreset.TODAY -> todayValue()
            ReportPreset.WEEK -> daysAgoValue(7)
            ReportPreset.MONTH -> monthStartValue()
        }
    }

    private fun isInsideRange(iso: String): Boolean {
        val startBound = "${startDate}T00:00:00"
        val endBound = "${endDate}T23:59:59.999"
        return iso >= startBound && iso <= endBound
    }

    fun itemsFor(orderId: String): List<OrderItem> = orderItems.filter { it.orderId == orderId }

    fun productFor(productId: String): Product? = products.find { it.id == productId }

    fun filteredOrders(): List<CafeOrder> = orders.filter { isInsideRange(it.createdAt) }

    fun filteredMovements(): List<StockMovement> = movements.filter { isInsideRange(it.createdAt) }

    fun deliveredOrders(): List<CafeOrder> = filteredOrders().filter { isDeliveredStatus(it.status) }

    fun receivedOrders(): List<CafeOrder> = filteredOrders().filter { it.status == "received" }

    private fun totalRequestedQuantity(): Double =
        filteredOrders().flatMap { itemsFor(it.id) }.sumOf { it.requestedQuantity }

    private fun totalDeliveredQuantity(): Double =
        deliveredOrders().flatMap { itemsFor(it.id) }.sumOf { it.packedQuantity }

    fun topDeliveredProducts(): List<TopDeliveredProduct> {
        val totals = LinkedHashMap<String, Double>()
        deliveredOrders().flatMap { itemsFor(it.id) }.forEach { item ->
            totals[item.productId] = (totals[item.productId] ?: 0.0) + item.packedQuantity
        }
        return totals.entries
            .mapNotNull { (productId, quantity) -> productFor(productId)?.let { TopDeliveredProduct(it, quantity) } }
            .sortedByDescending { it.quantity }
            .take(8)
    }

    fun summaryCards(): List<ReportCard> {
        val requested = totalRequestedQuantity()
        val delivered = totalDeliveredQuantity()
        return listOf(
            ReportCard("تعداد درخواست", ProductUnits.formatNumber(filteredOrders().size.toDouble()), "در بازه انتخابی"),
            ReportCard("تحویل درخواست", ProductUnits.formatNumber(deliveredOrders().size.toDouble()), "ارسال یا تایید شده"),
            ReportCard("تایید دریافت", ProductUnits.formatNumber(receivedOrders().size.toDouble()), "توسط کافه"),
            ReportCard("گردش موجودی", ProductUnits.formatNumber(filteredMovements().size.toDouble()), "افزودن، اصلاح یا تحویل"),
            ReportCard("مجموع تعداد درخواستی", ProductUnits.formatNumber(requested), "جمع تعداد در قلم‌های درخواستی"),
            ReportCard("مجموع تعداد تحویل‌شده", ProductUnits.formatNumber(delivered), "جمع تعداد در قلم‌های تحویل‌شده"),
        )
    }

    fun summaryText(): String = listOf(
        "گزارش Penza از $startDate تا $endDate",
        "تعداد درخواست: ${filteredOrders().size}",
        "تحویل درخواست: ${deliveredOrders().size}",
        "تایید دریافت: ${receivedOrders().size}",
        "مجموع تعداد درخواستی: ${ProductUnits.formatNumber(totalRequestedQuantity())}",
        "مجموع تعداد تحویل‌شده: ${ProductUnits.formatNumber(totalDeliveredQuantity())}",
        "گردش موجودی: ${filteredMovements().size}",
    ).joinToString("\n")
}

private fun todayValue(): String = LocalDate.now().toString()
private fun daysAgoValue(days: Long): String = LocalDate.now().minusDays(days).toString()
private fun monthStartValue(): String = LocalDate.now().withDayOfMonth(1).toString()

fun reportOrderStatusLabel(status: String): String = when {
    status == "sent" || status == "received" -> "تحویل درخواست"
    status == "cancelled" -> "لغو شده"
    else -> "درخواست کالا"
}

fun reportMovementLabel(type: String): String = when (type) {
    "stock_in" -> "افزودن موجودی"
    "packed_for_cafe" -> "آماده‌سازی"
    "sent_to_cafe" -> "تحویل درخواست"
    "manual_correction" -> "اصلاح موجودی"
    "damaged" -> "کسر موجودی"
    else -> type
}
