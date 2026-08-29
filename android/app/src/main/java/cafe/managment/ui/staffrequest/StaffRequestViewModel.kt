package cafe.managment.ui.staffrequest

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.model.InventoryItem
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
val QUICK_AMOUNTS = listOf(1.0, 5.0, 10.0)

class StaffRequestViewModel(
    private val inventoryRepository: InventoryRepository,
    private val ordersRepository: OrdersRepository,
    private val auditRepository: AuditRepository,
    private val settingsRepository: AppSettingsRepository,
) : ViewModel() {

    var products by mutableStateOf<List<Product>>(emptyList()); private set
    var inventoryItems by mutableStateOf<List<InventoryItem>>(emptyList()); private set
    var isLoading by mutableStateOf(false); private set
    var errorMessage by mutableStateOf<String?>(null); private set
    var infoMessage by mutableStateOf<String?>(null); private set
    var actorName by mutableStateOf(""); private set

    var searchTerm by mutableStateOf(""); private set
    var categoryFilter by mutableStateOf<String?>(null); private set
    var quantities by mutableStateOf<Map<String, Double>>(emptyMap()); private set
    var note by mutableStateOf(""); private set
    var submitting by mutableStateOf(false); private set

    init {
        viewModelScope.launch { actorName = settingsRepository.actorName.first().orEmpty() }
        load()
    }

    fun load() {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                val snapshot = inventoryRepository.getInventory()
                products = snapshot.products
                inventoryItems = snapshot.inventoryItems
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

    fun onSearchChange(value: String) { searchTerm = value }
    fun onCategoryFilterChange(value: String?) { categoryFilter = value }
    fun onNoteChange(value: String) { note = value }

    fun inventoryFor(productId: String): InventoryItem? = inventoryItems.find { it.productId == productId }

    fun filteredProducts(): List<Product> {
        val search = searchTerm.trim().lowercase()
        return products.filter { product ->
            val matchesCategory = categoryFilter == null || product.category == categoryFilter
            val matchesSearch = search.isEmpty() ||
                product.name.lowercase().contains(search) ||
                cafe.managment.data.util.ProductCategories.label(product.category).lowercase().contains(search)
            matchesCategory && matchesSearch
        }
    }

    fun quantityFor(productId: String): Double = quantities[productId] ?: 0.0

    fun updateQuantity(productId: String, value: Double) {
        infoMessage = null
        val product = products.find { it.id == productId }
        val safeValue = ProductUnits.normalizeOrderQuantity(product, value)
        quantities = if (safeValue <= 0.0) quantities - productId else quantities + (productId to safeValue)
    }

    fun addQuantity(productId: String, amount: Double) {
        updateQuantity(productId, quantityFor(productId) + amount)
    }

    fun removeItem(productId: String) { updateQuantity(productId, 0.0) }

    fun selectedItems(): List<Pair<Product, Double>> =
        products.mapNotNull { product -> quantities[product.id]?.let { qty -> if (qty > 0) product to qty else null } }

    fun submit() {
        val items = selectedItems()
        if (items.isEmpty()) {
            errorMessage = "حداقل یک کالا با تعداد معتبر انتخاب کنید."
            return
        }
        viewModelScope.launch {
            submitting = true
            errorMessage = null
            try {
                ordersRepository.createOrder(
                    requestedBy = actorName.ifBlank { "کاربر کافه" },
                    note = note.trim().ifBlank { null },
                    items = items.map { (product, qty) -> product.id to qty },
                )
                auditRepository.logEvent(AUDIT_SCOPE, "create_request", "ثبت درخواست کالا (${items.size} قلم)", Role.STAFF.value, actorName.ifBlank { null })
                infoMessage = "درخواست با موفقیت ثبت شد."
                quantities = emptyMap()
                note = ""
            } catch (e: Exception) {
                errorMessage = "خطا در ثبت درخواست: ${e.message}"
            } finally {
                submitting = false
            }
        }
    }
}
