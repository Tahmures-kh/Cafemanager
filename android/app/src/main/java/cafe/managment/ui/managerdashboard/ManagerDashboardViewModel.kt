package cafe.managment.ui.managerdashboard

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.model.CafeOrder
import cafe.managment.data.model.InventoryItem
import cafe.managment.data.model.Product
import cafe.managment.data.model.StockMovement
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.repository.OrdersRepository
import cafe.managment.data.util.ProductUnits
import cafe.managment.ui.storageorders.isDeliveredStatus
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class LowStockRow(val product: Product, val inventoryItem: InventoryItem?, val tier: ProductUnits.StockStatusTier)

class ManagerDashboardViewModel(
    private val ordersRepository: OrdersRepository,
    private val inventoryRepository: InventoryRepository,
) : ViewModel() {

    var orders by mutableStateOf<List<CafeOrder>>(emptyList()); private set
    var products by mutableStateOf<List<Product>>(emptyList()); private set
    var inventoryItems by mutableStateOf<List<InventoryItem>>(emptyList()); private set
    var movements by mutableStateOf<List<StockMovement>>(emptyList()); private set
    var isLoading by mutableStateOf(false); private set
    var errorMessage by mutableStateOf<String?>(null); private set

    init { load() }

    fun load() {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                orders = ordersRepository.getOrders().orders
                val inventorySnapshot = inventoryRepository.getInventory()
                products = inventorySnapshot.products
                inventoryItems = inventorySnapshot.inventoryItems
                movements = inventorySnapshot.movements
            } catch (e: Exception) {
                errorMessage = "خطا در دریافت اطلاعات: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }

    private fun isToday(iso: String): Boolean {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        return iso.startsWith(today)
    }

    fun todayNewOrdersCount(): Int = orders.count { isToday(it.createdAt) }

    fun todayDeliveredOrdersCount(): Int = orders.count { isDeliveredStatus(it.status) && isToday(it.updatedAt) }

    fun todayMovementsCount(): Int = movements.count { isToday(it.createdAt) }

    fun lowStockRows(): List<LowStockRow> {
        val tierRank = mapOf(
            ProductUnits.StockStatusTier.OUT to 0,
            ProductUnits.StockStatusTier.CRITICAL to 1,
            ProductUnits.StockStatusTier.LOW to 2,
            ProductUnits.StockStatusTier.OK to 3,
        )
        return products
            .map { product ->
                val inventoryItem = inventoryItems.find { it.productId == product.id }
                LowStockRow(product, inventoryItem, ProductUnits.getStockStatus(product, inventoryItem))
            }
            .filter { it.tier != ProductUnits.StockStatusTier.OK }
            .sortedBy { tierRank[it.tier] }
    }

    fun recentOrders(): List<CafeOrder> = orders.filter { it.status != "cancelled" }.take(8)

    fun recentMovements(): List<StockMovement> = movements.take(5)
}
