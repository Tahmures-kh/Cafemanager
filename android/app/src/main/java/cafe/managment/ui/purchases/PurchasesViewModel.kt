package cafe.managment.ui.purchases

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.model.AuditLogEntry
import cafe.managment.data.model.PurchaseOrder
import cafe.managment.data.model.PurchaseOrderItem
import cafe.managment.data.model.Supplier
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.PurchasesRepository
import cafe.managment.data.repository.SuppliersRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.settings.Role
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

private const val AUDIT_SCOPE = "purchases"

data class PurchaseItemDraft(
    val productName: String = "",
    val quantity: String = "",
    val stockUnit: String = "",
)

data class SupplierFormState(
    val name: String = "",
    val phone: String = "",
    val website: String = "",
    val notes: String = "",
)

class PurchasesViewModel(
    private val repository: PurchasesRepository,
    private val suppliersRepository: SuppliersRepository,
    private val auditRepository: AuditRepository,
    private val settingsRepository: AppSettingsRepository,
) : ViewModel() {

    var suppliers by mutableStateOf<List<Supplier>>(emptyList())
        private set

    var orders by mutableStateOf<List<PurchaseOrder>>(emptyList())
        private set

    var auditEntries by mutableStateOf<List<AuditLogEntry>>(emptyList())
        private set

    var isLoading by mutableStateOf(false)
        private set

    var errorMessage by mutableStateOf<String?>(null)
        private set

    var infoMessage by mutableStateOf<String?>(null)
        private set

    var submitting by mutableStateOf(false)
        private set

    var selectedSupplierId by mutableStateOf<String?>(null)
        private set

    var items by mutableStateOf(listOf(PurchaseItemDraft()))
        private set

    var actorName by mutableStateOf("")
        private set

    var editingSupplierId by mutableStateOf<String?>(null); private set
    var supplierForm by mutableStateOf(SupplierFormState()); private set
    var pendingDeleteSupplier by mutableStateOf<Supplier?>(null); private set

    init {
        viewModelScope.launch {
            actorName = settingsRepository.actorName.first().orEmpty()
        }
        load()
    }

    fun load() {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                suppliers = suppliersRepository.getSuppliers()
                orders = repository.getPurchases()
                auditEntries = auditRepository.getEntries(AUDIT_SCOPE)
                if (selectedSupplierId == null) selectedSupplierId = suppliers.firstOrNull()?.id
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

    fun selectSupplier(id: String) {
        selectedSupplierId = id
    }

    fun addItemRow() {
        items = items + PurchaseItemDraft()
    }

    fun removeItemRow(index: Int) {
        if (items.size <= 1) return
        items = items.filterIndexed { i, _ -> i != index }
    }

    fun updateItem(index: Int, transform: (PurchaseItemDraft) -> PurchaseItemDraft) {
        items = items.mapIndexed { i, item -> if (i == index) transform(item) else item }
    }

    fun submitOrder() {
        val supplierId = selectedSupplierId
        if (supplierId == null) {
            errorMessage = "ابتدا یک فروشنده انتخاب کنید."
            return
        }
        val validItems = items
            .mapNotNull { draft ->
                val quantity = draft.quantity.trim().toDoubleOrNull()
                if (draft.productName.isBlank() || quantity == null || quantity <= 0.0) return@mapNotNull null
                PurchaseOrderItem(
                    productName = draft.productName.trim(),
                    quantity = quantity,
                    stockUnit = draft.stockUnit.ifBlank { null },
                )
            }

        if (validItems.isEmpty()) {
            errorMessage = "حداقل یک ردیف کالای معتبر (با نام و مقدار) الزامی است."
            return
        }

        viewModelScope.launch {
            submitting = true
            errorMessage = null
            infoMessage = null
            try {
                val order = repository.createPurchase(
                    supplierId = supplierId,
                    items = validItems,
                    createdBy = actorName.ifBlank { null },
                )
                items = listOf(PurchaseItemDraft())
                infoMessage = if (order.smsStatus == "error") {
                    "سفارش ثبت شد اما ارسال پیامک ناموفق بود."
                } else {
                    "سفارش با موفقیت ثبت شد."
                }
                auditRepository.logEvent(
                    scope = AUDIT_SCOPE,
                    action = "create_order",
                    description = "ثبت سفارش خرید جدید (${validItems.size} قلم کالا)",
                    actorRole = Role.MANAGER.value,
                    actorName = actorName.ifBlank { null },
                )
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در ثبت سفارش: ${e.message}"
            } finally {
                submitting = false
            }
        }
    }

    fun resendSms(order: PurchaseOrder) {
        viewModelScope.launch {
            errorMessage = null
            try {
                repository.resendSms(order.id)
                auditRepository.logEvent(
                    scope = AUDIT_SCOPE,
                    action = "resend_sms",
                    description = "ارسال مجدد پیامک برای سفارش #${order.id.takeLast(6)}",
                    actorRole = Role.MANAGER.value,
                    actorName = actorName.ifBlank { null },
                )
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در ارسال مجدد پیامک: ${e.message}"
            }
        }
    }

    fun supplierName(supplierId: String): String = suppliers.find { it.id == supplierId }?.name ?: "فروشنده"

    fun openNewSupplierForm() {
        editingSupplierId = "new"
        supplierForm = SupplierFormState()
    }

    fun openEditSupplierForm(supplier: Supplier) {
        editingSupplierId = supplier.id
        supplierForm = SupplierFormState(
            name = supplier.name,
            phone = supplier.phone,
            website = supplier.website.orEmpty(),
            notes = supplier.notes.orEmpty(),
        )
    }

    fun onSupplierFormChange(transform: (SupplierFormState) -> SupplierFormState) {
        supplierForm = transform(supplierForm)
    }

    fun cancelSupplierForm() {
        editingSupplierId = null
        supplierForm = SupplierFormState()
    }

    fun saveSupplier() {
        val id = editingSupplierId ?: return
        val name = supplierForm.name.trim()
        val phone = supplierForm.phone.trim()
        if (name.isEmpty() || phone.isEmpty()) {
            errorMessage = "نام و شماره تماس فروشنده الزامی است."
            return
        }
        val website = supplierForm.website.trim().ifBlank { null }
        val notes = supplierForm.notes.trim().ifBlank { null }

        viewModelScope.launch {
            errorMessage = null
            try {
                if (id == "new") {
                    suppliersRepository.createSupplier(name, phone, website, notes)
                    auditRepository.logEvent(AUDIT_SCOPE, "create_supplier", "افزودن فروشنده «$name»", Role.MANAGER.value, actorName.ifBlank { null })
                } else {
                    suppliersRepository.updateSupplier(id, name, phone, website, notes)
                    auditRepository.logEvent(AUDIT_SCOPE, "update_supplier", "ویرایش فروشنده «$name»", Role.MANAGER.value, actorName.ifBlank { null })
                }
                cancelSupplierForm()
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در ثبت فروشنده: ${e.message}"
            }
        }
    }

    fun requestDeleteSupplier(supplier: Supplier) { pendingDeleteSupplier = supplier }
    fun cancelDeleteSupplier() { pendingDeleteSupplier = null }

    fun confirmDeleteSupplier() {
        val supplier = pendingDeleteSupplier ?: return
        viewModelScope.launch {
            errorMessage = null
            try {
                suppliersRepository.deleteSupplier(supplier.id)
                auditRepository.logEvent(AUDIT_SCOPE, "delete_supplier", "حذف فروشنده «${supplier.name}»", Role.MANAGER.value, actorName.ifBlank { null })
                pendingDeleteSupplier = null
                if (editingSupplierId == supplier.id) cancelSupplierForm()
                if (selectedSupplierId == supplier.id) selectedSupplierId = null
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در حذف فروشنده: ${e.message}"
                pendingDeleteSupplier = null
            }
        }
    }
}
