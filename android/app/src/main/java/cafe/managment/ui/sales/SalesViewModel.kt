package cafe.managment.ui.sales

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.importer.SalesExcelParseResult
import cafe.managment.data.importer.SalesExcelParser
import cafe.managment.data.model.AuditLogEntry
import cafe.managment.data.model.Recipe
import cafe.managment.data.model.SalesBatch
import cafe.managment.data.model.SalesItem
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.RecipesRepository
import cafe.managment.data.repository.SalesRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.settings.Role
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private const val AUDIT_SCOPE = "sales"

data class SalesItemDraft(val itemName: String = "", val quantitySold: String = "", val unitPrice: String = "")

class SalesViewModel(
    private val repository: SalesRepository,
    private val recipesRepository: RecipesRepository,
    private val auditRepository: AuditRepository,
    private val settingsRepository: AppSettingsRepository,
) : ViewModel() {

    var batches by mutableStateOf<List<SalesBatch>>(emptyList()); private set
    var recipes by mutableStateOf<List<Recipe>>(emptyList()); private set
    var auditEntries by mutableStateOf<List<AuditLogEntry>>(emptyList()); private set
    var isLoading by mutableStateOf(false); private set
    var errorMessage by mutableStateOf<String?>(null); private set
    var infoMessage by mutableStateOf<String?>(null); private set
    var actorName by mutableStateOf(""); private set

    var shiftDate by mutableStateOf(todayIso()); private set
    var shiftLabel by mutableStateOf(""); private set
    var manualItems by mutableStateOf(listOf(SalesItemDraft())); private set
    var submittingManual by mutableStateOf(false); private set

    var importPreview by mutableStateOf<SalesExcelParseResult?>(null); private set
    var importSourceType by mutableStateOf<String?>(null); private set
    var importFileName by mutableStateOf<String?>(null); private set
    var importError by mutableStateOf<String?>(null); private set
    var importing by mutableStateOf(false); private set
    var extractingImage by mutableStateOf(false); private set

    init {
        viewModelScope.launch { actorName = settingsRepository.actorName.first().orEmpty() }
        load()
    }

    fun load() {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                batches = repository.getSales()
                recipes = recipesRepository.getRecipes()
                auditEntries = auditRepository.getEntries(AUDIT_SCOPE)
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

    fun onShiftDateChange(value: String) { shiftDate = value }
    fun onShiftLabelChange(value: String) { shiftLabel = value }

    fun addManualItemRow() { manualItems = manualItems + SalesItemDraft() }

    fun removeManualItemRow(index: Int) {
        if (manualItems.size <= 1) return
        manualItems = manualItems.filterIndexed { i, _ -> i != index }
    }

    fun updateManualItem(index: Int, transform: (SalesItemDraft) -> SalesItemDraft) {
        manualItems = manualItems.mapIndexed { i, item -> if (i == index) transform(item) else item }
    }

    fun submitManual() {
        val items = manualItems.mapNotNull { draft ->
            val quantity = draft.quantitySold.trim().toDoubleOrNull()
            if (draft.itemName.isBlank() || quantity == null || quantity <= 0.0) return@mapNotNull null
            val unitPrice = draft.unitPrice.trim().toDoubleOrNull()
            val recipe = recipes.find { it.name.trim().equals(draft.itemName.trim(), ignoreCase = true) }
            SalesItem(
                recipeId = recipe?.id,
                itemName = draft.itemName.trim(),
                quantitySold = quantity,
                unitPrice = unitPrice,
                revenue = unitPrice?.let { it * quantity },
            )
        }
        if (items.isEmpty()) {
            errorMessage = "حداقل یک آیتم معتبر (با نام و تعداد) الزامی است."
            return
        }

        viewModelScope.launch {
            submittingManual = true
            errorMessage = null
            infoMessage = null
            try {
                repository.createSalesBatch(
                    shiftDate = shiftDate,
                    shiftLabel = shiftLabel.ifBlank { null },
                    sourceType = "manual",
                    sourceFileName = null,
                    importedBy = actorName.ifBlank { null },
                    items = items,
                )
                manualItems = listOf(SalesItemDraft())
                infoMessage = "فروش شیفت با موفقیت ثبت شد."
                auditRepository.logEvent(
                    AUDIT_SCOPE, "create_manual",
                    "ثبت فروش شیفت $shiftDate — ${items.size} آیتم (دستی)",
                    Role.MANAGER.value, actorName.ifBlank { null },
                )
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در ثبت فروش: ${e.message}"
            } finally {
                submittingManual = false
            }
        }
    }

    fun onSpreadsheetParsed(fileName: String, sourceType: String, rows: List<Map<String, String>>) {
        importFileName = fileName
        importSourceType = sourceType
        importError = null
        try {
            importPreview = SalesExcelParser.parse(rows, recipes)
        } catch (e: Exception) {
            importError = e.message
            importPreview = null
        }
    }

    fun onImportFailed(message: String) {
        importError = message
        importPreview = null
        extractingImage = false
    }

    fun onImagePicked(fileName: String) {
        importFileName = fileName
        importSourceType = "image"
        importError = null
        importPreview = null
        extractingImage = true
    }

    fun onImageExtracted(items: List<SalesItem>) {
        extractingImage = false
        importPreview = SalesExcelParser.matchToRecipes(items, recipes)
    }

    fun cancelImportPreview() {
        importPreview = null
        importSourceType = null
        importFileName = null
        importError = null
        extractingImage = false
    }

    fun confirmImport() {
        val preview = importPreview ?: return
        val sourceType = importSourceType ?: return
        if (preview.rows.isEmpty()) {
            importError = "هیچ آیتمی برای ایمپورت پیدا نشد."
            return
        }

        viewModelScope.launch {
            importing = true
            try {
                repository.createSalesBatch(
                    shiftDate = shiftDate,
                    shiftLabel = shiftLabel.ifBlank { null },
                    sourceType = sourceType,
                    sourceFileName = importFileName,
                    importedBy = actorName.ifBlank { null },
                    items = preview.rows.map { row ->
                        SalesItem(recipeId = row.recipeId, itemName = row.itemName, quantitySold = row.quantitySold, unitPrice = row.unitPrice, revenue = row.revenue)
                    },
                )
                val actionName = when (sourceType) {
                    "image" -> "import_image"
                    "csv" -> "import_csv"
                    else -> "import_excel"
                }
                auditRepository.logEvent(
                    AUDIT_SCOPE, actionName,
                    "ثبت فروش شیفت $shiftDate — ${preview.rows.size} آیتم از «${importFileName ?: "نامشخص"}»",
                    Role.MANAGER.value, actorName.ifBlank { null },
                )
                cancelImportPreview()
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در ایمپورت: ${e.message}"
            } finally {
                importing = false
            }
        }
    }
}

private fun todayIso(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
