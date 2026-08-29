package cafe.managment.ui.managerinventory

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.model.InventoryItem
import cafe.managment.data.model.Product
import cafe.managment.data.model.StockMovement
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.util.ProductCategories
import cafe.managment.data.util.ProductUnits
import kotlinx.coroutines.launch

/** Read-only manager report mirroring staff-management-saas's /manager/inventory page — no add/edit/adjust/delete, unlike the storage-only [cafe.managment.ui.inventory.InventoryScreen]. */
data class ManagerInventoryRow(val product: Product, val inventoryItem: InventoryItem?)

data class ManagerInventoryCard(val title: String, val value: String, val description: String)

class ManagerInventoryViewModel(
    private val repository: InventoryRepository,
) : ViewModel() {

    var products by mutableStateOf<List<Product>>(emptyList()); private set
    var inventoryItems by mutableStateOf<List<InventoryItem>>(emptyList()); private set
    var movements by mutableStateOf<List<StockMovement>>(emptyList()); private set
    var isLoading by mutableStateOf(false); private set
    var errorMessage by mutableStateOf<String?>(null); private set

    var searchTerm by mutableStateOf(""); private set

    init { load() }

    fun load() {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                val snapshot = repository.getInventory()
                products = snapshot.products
                inventoryItems = snapshot.inventoryItems
                movements = snapshot.movements
            } catch (e: Exception) {
                errorMessage = "خطا در دریافت اطلاعات: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }

    fun onSearchChange(value: String) { searchTerm = value }

    private fun productFor(productId: String): Product? = products.find { it.id == productId }

    fun rows(): List<ManagerInventoryRow> {
        val search = searchTerm.trim().lowercase()

        return inventoryItems
            .map { item -> ManagerInventoryRow(productFor(item.productId) ?: return@map null, item) }
            .filterNotNull()
            .filter { row ->
                if (search.isEmpty()) return@filter true
                row.product.name.lowercase().contains(search) ||
                    ProductUnits.stockUnit(row.product).lowercase().contains(search) ||
                    ProductUnits.orderUnit(row.product).lowercase().contains(search) ||
                    ProductCategories.label(row.product.category).lowercase().contains(search)
            }
    }

    fun cards(): List<ManagerInventoryCard> {
        val totalCurrentQuantity = inventoryItems.sumOf { it.currentQuantity }
        val zeroStockCount = inventoryItems.count { it.currentQuantity <= 0 }
        val lowStockCount = inventoryItems.count { item ->
            val tier = ProductUnits.getStockStatus(productFor(item.productId), item)
            tier == ProductUnits.StockStatusTier.LOW || tier == ProductUnits.StockStatusTier.CRITICAL
        }
        val stockInCount = movements.count { it.type == "stock_in" }
        val deliveredCount = movements.count { it.type == "sent_to_cafe" }

        return listOf(
            ManagerInventoryCard("کالاهای انبار", ProductUnits.formatNumber(inventoryItems.size.toDouble()), "تعداد کالاهای ثبت‌شده"),
            ManagerInventoryCard("مجموع موجودی", ProductUnits.formatNumber(totalCurrentQuantity), "جمع عددی موجودی فعلی"),
            ManagerInventoryCard("ناموجود", ProductUnits.formatNumber(zeroStockCount.toDouble()), "کالاهای با موجودی صفر"),
            ManagerInventoryCard("کم‌موجود", ProductUnits.formatNumber(lowStockCount.toDouble()), "زیر حد مجاز تعریف‌شده در انبار"),
            ManagerInventoryCard("ورود کالا", ProductUnits.formatNumber(stockInCount.toDouble()), "حرکت‌های ورود ثبت‌شده"),
            ManagerInventoryCard("رویدادهای ارسال به کافه", ProductUnits.formatNumber(deliveredCount.toDouble()), "ثبت حرکت‌های تحویل به کافه"),
        )
    }

    fun recentMovements(): List<StockMovement> = movements.take(10)
}

fun movementTypeLabel(type: String): String = when (type) {
    "stock_in" -> "ورود به انبار"
    "packed_for_cafe" -> "آماده‌سازی برای کافه"
    "sent_to_cafe" -> "تحویل درخواست"
    "manual_correction" -> "اصلاح دستی"
    "damaged" -> "کسر از موجودی"
    else -> type
}
