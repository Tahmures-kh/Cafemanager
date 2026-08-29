package cafe.managment.ui.inventory

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.model.AuditLogEntry
import cafe.managment.data.model.InventoryItem
import cafe.managment.data.model.Product
import cafe.managment.data.model.StockMovement
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.settings.Role
import cafe.managment.data.util.ProductUnits
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

private const val AUDIT_SCOPE = "inventory"

enum class SortMode { RECENT, NAME, QUANTITY_HIGH, QUANTITY_LOW }

data class InventoryRow(val product: Product, val inventoryItem: InventoryItem?, val latestMovement: StockMovement?)

data class AddProductForm(
    val name: String = "",
    val category: String = "other",
    val unit: String = "",
    val orderUnit: String = "",
    val orderUnitQuantity: String = "1",
    val currentQuantity: String = "0",
)

data class EditProductForm(
    val productId: String,
    val name: String,
    val category: String,
    val unit: String,
    val orderUnit: String,
    val orderUnitQuantity: String,
    val currentQuantity: String,
)

class InventoryViewModel(
    private val repository: InventoryRepository,
    private val auditRepository: AuditRepository,
    private val settingsRepository: AppSettingsRepository,
) : ViewModel() {

    var products by mutableStateOf<List<Product>>(emptyList()); private set
    var inventoryItems by mutableStateOf<List<InventoryItem>>(emptyList()); private set
    var movements by mutableStateOf<List<StockMovement>>(emptyList()); private set
    var isLoading by mutableStateOf(false); private set
    var errorMessage by mutableStateOf<String?>(null); private set
    var infoMessage by mutableStateOf<String?>(null); private set
    var actorName by mutableStateOf(""); private set

    var searchTerm by mutableStateOf(""); private set
    var categoryFilter by mutableStateOf<String?>(null); private set
    var sortMode by mutableStateOf(SortMode.RECENT); private set

    var addForm by mutableStateOf(AddProductForm()); private set
    var submittingAdd by mutableStateOf(false); private set

    var quickAdjustProductId by mutableStateOf<String?>(null); private set
    var quickAdjustAdding by mutableStateOf(true); private set
    var quickAdjustAmount by mutableStateOf("1"); private set
    var quickAdjustReason by mutableStateOf(""); private set

    var editForm by mutableStateOf<EditProductForm?>(null); private set

    var pendingDeleteProduct by mutableStateOf<Product?>(null); private set

    init {
        viewModelScope.launch { actorName = settingsRepository.actorName.first().orEmpty() }
        load()
    }

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

    fun onActorNameChange(value: String) {
        actorName = value
        viewModelScope.launch { settingsRepository.setActorName(value) }
    }

    fun onSearchChange(value: String) { searchTerm = value }
    fun onCategoryFilterChange(value: String?) { categoryFilter = value }
    fun onSortModeChange(value: SortMode) { sortMode = value }

    fun rows(): List<InventoryRow> {
        val latestByProduct = movements.groupBy { it.productId }.mapValues { (_, list) -> list.maxByOrNull { it.createdAt } }
        val search = searchTerm.trim().lowercase()

        val filtered = products.filter { product ->
            val matchesCategory = categoryFilter == null || product.category == categoryFilter
            val matchesSearch = search.isEmpty() ||
                product.name.lowercase().contains(search) ||
                ProductUnits.stockUnit(product).lowercase().contains(search) ||
                cafe.managment.data.util.ProductCategories.label(product.category).lowercase().contains(search)
            matchesCategory && matchesSearch
        }

        val withState = filtered.map { product ->
            InventoryRow(product, inventoryItems.find { it.productId == product.id }, latestByProduct[product.id])
        }

        return when (sortMode) {
            SortMode.NAME -> withState.sortedBy { it.product.name }
            SortMode.QUANTITY_HIGH -> withState.sortedByDescending { it.inventoryItem?.currentQuantity ?: 0.0 }
            SortMode.QUANTITY_LOW -> withState.sortedBy { it.inventoryItem?.currentQuantity ?: 0.0 }
            SortMode.RECENT -> withState.sortedByDescending { it.latestMovement?.createdAt ?: "" }
        }
    }

    fun lowStockRows(): List<InventoryRow> = rows().filter { row ->
        ProductUnits.getStockStatus(row.product, row.inventoryItem) != ProductUnits.StockStatusTier.OK
    }

    fun onAddFormChange(transform: (AddProductForm) -> AddProductForm) { addForm = transform(addForm) }

    fun resetAddForm() { addForm = AddProductForm() }

    fun submitAdd() {
        val name = addForm.name.trim()
        val unit = addForm.unit.trim()
        if (name.isEmpty() || unit.isEmpty()) {
            errorMessage = "نام کالا و واحد الزامی است."
            return
        }
        viewModelScope.launch {
            submittingAdd = true
            errorMessage = null
            try {
                repository.addProduct(
                    name = name,
                    category = addForm.category,
                    unit = unit,
                    stockUnit = unit,
                    orderUnit = addForm.orderUnit.trim().ifBlank { null },
                    orderUnitQuantity = addForm.orderUnitQuantity.trim().toDoubleOrNull(),
                    orderQuantityStep = null,
                    currentQuantity = addForm.currentQuantity.trim().toDoubleOrNull() ?: 0.0,
                    createdBy = actorName.ifBlank { null },
                )
                auditRepository.logEvent(AUDIT_SCOPE, "add_product", "افزودن کالا «$name» به انبار", Role.STORAGE.value, actorName.ifBlank { null })
                infoMessage = "کالای «$name» با موفقیت به انبار اضافه شد."
                resetAddForm()
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در افزودن کالا: ${e.message}"
            } finally {
                submittingAdd = false
            }
        }
    }

    fun openQuickAdjust(productId: String, adding: Boolean) {
        editForm = null
        quickAdjustProductId = productId
        quickAdjustAdding = adding
        quickAdjustAmount = "1"
        quickAdjustReason = ""
    }

    fun onQuickAdjustAmountChange(value: String) { quickAdjustAmount = value }
    fun onQuickAdjustReasonChange(value: String) { quickAdjustReason = value }

    fun resetQuickAdjust() { quickAdjustProductId = null }

    fun submitQuickAdjust() {
        val productId = quickAdjustProductId ?: return
        val amount = quickAdjustAmount.trim().toDoubleOrNull()
        if (amount == null || amount <= 0.0) {
            errorMessage = "مقدار اصلاح باید عددی و مثبت باشد."
            return
        }
        val delta = if (quickAdjustAdding) amount else -amount
        val product = products.find { it.id == productId }

        viewModelScope.launch {
            errorMessage = null
            try {
                repository.adjustQuantity(productId, delta, quickAdjustReason.trim().ifBlank { null }, actorName.ifBlank { null })
                auditRepository.logEvent(
                    AUDIT_SCOPE, "adjust_quantity",
                    "اصلاح موجودی «${product?.name ?: productId}» (${if (quickAdjustAdding) "+" else "-"}$amount)",
                    Role.STORAGE.value, actorName.ifBlank { null },
                )
                infoMessage = "موجودی «${product?.name ?: ""}» با موفقیت اصلاح شد."
                resetQuickAdjust()
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در اصلاح موجودی: ${e.message}"
            }
        }
    }

    fun openEdit(product: Product) {
        quickAdjustProductId = null
        val inventoryItem = inventoryItems.find { it.productId == product.id }
        editForm = EditProductForm(
            productId = product.id,
            name = product.name,
            category = product.category,
            unit = ProductUnits.stockUnit(product),
            orderUnit = ProductUnits.orderUnit(product),
            orderUnitQuantity = ProductUnits.orderUnitQuantity(product).let { if (it == it.toLong().toDouble()) it.toLong().toString() else it.toString() },
            currentQuantity = (inventoryItem?.currentQuantity ?: 0.0).let { if (it == it.toLong().toDouble()) it.toLong().toString() else it.toString() },
        )
    }

    fun onEditFormChange(transform: (EditProductForm) -> EditProductForm) {
        editForm = editForm?.let(transform)
    }

    fun resetEdit() { editForm = null }

    fun submitEdit() {
        val form = editForm ?: return
        val name = form.name.trim()
        val unit = form.unit.trim()
        if (name.isEmpty() || unit.isEmpty()) {
            errorMessage = "نام کالا و واحد الزامی است."
            return
        }
        viewModelScope.launch {
            errorMessage = null
            try {
                repository.updateProduct(
                    productId = form.productId,
                    name = name,
                    category = form.category,
                    unit = unit,
                    stockUnit = unit,
                    orderUnit = form.orderUnit.trim().ifBlank { null },
                    orderUnitQuantity = form.orderUnitQuantity.trim().toDoubleOrNull(),
                    orderQuantityStep = null,
                    currentQuantity = form.currentQuantity.trim().toDoubleOrNull() ?: 0.0,
                    minimumQuantity = null,
                    criticalQuantity = null,
                    correctionReason = null,
                    createdBy = actorName.ifBlank { null },
                )
                auditRepository.logEvent(AUDIT_SCOPE, "edit_product", "ویرایش کالای «$name»", Role.STORAGE.value, actorName.ifBlank { null })
                infoMessage = "کالای «$name» با موفقیت ویرایش شد."
                resetEdit()
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در ویرایش کالا: ${e.message}"
            }
        }
    }

    fun requestDelete(product: Product) { pendingDeleteProduct = product }
    fun cancelDelete() { pendingDeleteProduct = null }

    fun confirmDelete() {
        val product = pendingDeleteProduct ?: return
        viewModelScope.launch {
            errorMessage = null
            try {
                repository.deleteProduct(product.id)
                auditRepository.logEvent(AUDIT_SCOPE, "delete_product", "حذف کالای «${product.name}» از انبار", Role.STORAGE.value, actorName.ifBlank { null })
                infoMessage = "کالای «${product.name}» از انبار حذف شد."
                pendingDeleteProduct = null
                if (quickAdjustProductId == product.id) resetQuickAdjust()
                if (editForm?.productId == product.id) resetEdit()
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در حذف کالا: ${e.message}"
                pendingDeleteProduct = null
            }
        }
    }

    fun dismissInfo() { infoMessage = null }
}
