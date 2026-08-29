package cafe.managment.ui.recipes

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.catalog.ProductCatalog
import cafe.managment.data.importer.RecipeExcelParseResult
import cafe.managment.data.importer.RecipeExcelParser
import cafe.managment.data.model.AuditLogEntry
import cafe.managment.data.model.ExchangeRateValues
import cafe.managment.data.model.IngredientPrice
import cafe.managment.data.model.Product
import cafe.managment.data.model.Recipe
import cafe.managment.data.model.RecipeIngredient
import cafe.managment.data.network.RecipeRequest
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.PricingRepository
import cafe.managment.data.repository.RecipesRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.settings.Role
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

private const val AUDIT_SCOPE = "recipes"
const val NEW_RECIPE_ID = "new"

data class IngredientDraft(val productId: String? = null, val quantity: String = "")

class RecipesViewModel(
    private val repository: RecipesRepository,
    private val pricingRepository: PricingRepository,
    private val auditRepository: AuditRepository,
    private val settingsRepository: AppSettingsRepository,
    private val productCatalog: ProductCatalog,
) : ViewModel() {

    var recipes by mutableStateOf<List<Recipe>>(emptyList()); private set
    var products by mutableStateOf<List<Product>>(emptyList()); private set
    var ingredientPrices by mutableStateOf<List<IngredientPrice>>(emptyList()); private set
    var exchangeRates by mutableStateOf<ExchangeRateValues?>(null); private set
    var exchangeRatesConfigured by mutableStateOf(false); private set
    var auditEntries by mutableStateOf<List<AuditLogEntry>>(emptyList()); private set
    var isLoading by mutableStateOf(false); private set
    var errorMessage by mutableStateOf<String?>(null); private set
    var actorName by mutableStateOf(""); private set

    var editingRecipeId by mutableStateOf<String?>(null); private set
    var formName by mutableStateOf(""); private set
    var formCategory by mutableStateOf(""); private set
    var formIngredients by mutableStateOf(listOf(IngredientDraft())); private set

    var importPreview by mutableStateOf<RecipeExcelParseResult?>(null); private set
    var importFileName by mutableStateOf<String?>(null); private set
    var importError by mutableStateOf<String?>(null); private set
    var importing by mutableStateOf(false); private set

    var priceInputs by mutableStateOf<Map<String, String>>(emptyMap()); private set

    init {
        viewModelScope.launch { actorName = settingsRepository.actorName.first().orEmpty() }
        load()
    }

    fun load() {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            try {
                recipes = repository.getRecipes()
                products = productCatalog.all()
                ingredientPrices = pricingRepository.getIngredientPrices()
                val rates = pricingRepository.getExchangeRates()
                exchangeRatesConfigured = rates.configured
                exchangeRates = rates.rates
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

    fun startCreate() {
        editingRecipeId = NEW_RECIPE_ID
        formName = ""
        formCategory = ""
        formIngredients = listOf(IngredientDraft())
    }

    fun startEdit(recipe: Recipe) {
        editingRecipeId = recipe.id
        formName = recipe.name
        formCategory = recipe.category.orEmpty()
        formIngredients = recipe.ingredients
            .map { IngredientDraft(productId = it.productId, quantity = formatQuantity(it.quantity)) }
            .ifEmpty { listOf(IngredientDraft()) }
    }

    fun cancelForm() {
        editingRecipeId = null
    }

    fun onFormNameChange(value: String) { formName = value }
    fun onFormCategoryChange(value: String) { formCategory = value }

    fun addIngredientRow() {
        formIngredients = formIngredients + IngredientDraft()
    }

    fun removeIngredientRow(index: Int) {
        if (formIngredients.size <= 1) return
        formIngredients = formIngredients.filterIndexed { i, _ -> i != index }
    }

    fun updateIngredientProduct(index: Int, productId: String) {
        formIngredients = formIngredients.mapIndexed { i, draft -> if (i == index) draft.copy(productId = productId) else draft }
    }

    fun updateIngredientQuantity(index: Int, value: String) {
        formIngredients = formIngredients.mapIndexed { i, draft -> if (i == index) draft.copy(quantity = value) else draft }
    }

    fun saveRecipe() {
        val name = formName.trim()
        if (name.isEmpty()) {
            errorMessage = "نام رسپی الزامی است."
            return
        }
        val ingredients = formIngredients.mapNotNull { draft ->
            val productId = draft.productId ?: return@mapNotNull null
            val product = products.find { it.id == productId }
            val quantity = draft.quantity.trim().toDoubleOrNull() ?: 0.0
            RecipeIngredient(productId = productId, quantity = quantity, productName = product?.name, stockUnit = product?.stockUnit ?: product?.unit)
        }
        if (ingredients.isEmpty()) {
            errorMessage = "حداقل یک ماده اولیه معتبر لازم است."
            return
        }

        val currentEditingId = editingRecipeId
        viewModelScope.launch {
            errorMessage = null
            try {
                if (currentEditingId == NEW_RECIPE_ID) {
                    repository.createRecipe(name, formCategory.ifBlank { null }, ingredients)
                    auditRepository.logEvent(AUDIT_SCOPE, "create_recipe", "ایجاد رسپی «$name»", Role.MANAGER.value, actorName.ifBlank { null })
                } else if (currentEditingId != null) {
                    repository.updateRecipe(currentEditingId, name, formCategory.ifBlank { null }, ingredients)
                    auditRepository.logEvent(AUDIT_SCOPE, "update_recipe", "ویرایش رسپی «$name»", Role.MANAGER.value, actorName.ifBlank { null })
                }
                editingRecipeId = null
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در ذخیره رسپی: ${e.message}"
            }
        }
    }

    fun deleteRecipe(recipe: Recipe) {
        viewModelScope.launch {
            try {
                repository.deleteRecipe(recipe.id)
                auditRepository.logEvent(AUDIT_SCOPE, "delete_recipe", "حذف رسپی «${recipe.name}»", Role.MANAGER.value, actorName.ifBlank { null })
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در حذف رسپی: ${e.message}"
            }
        }
    }

    fun onFileParsed(fileName: String, rows: List<Map<String, String>>) {
        importFileName = fileName
        importError = null
        try {
            importPreview = RecipeExcelParser.parse(rows, products)
        } catch (e: Exception) {
            importError = e.message
            importPreview = null
        }
    }

    fun onFileParseFailed(message: String) {
        importError = message
        importPreview = null
    }

    fun cancelImportPreview() {
        importPreview = null
        importFileName = null
        importError = null
    }

    fun confirmImport() {
        val preview = importPreview ?: return
        val requests = preview.recipes
            .map { recipePreview ->
                RecipeRequest(
                    name = recipePreview.name,
                    ingredients = recipePreview.rows
                        .filter { it.productId != null }
                        .map { row -> RecipeIngredient(productId = row.productId!!, quantity = row.quantity, productName = row.ingredientName, stockUnit = row.stockUnit) },
                )
            }
            .filter { it.ingredients.isNotEmpty() }

        if (requests.isEmpty()) {
            importError = "هیچ رسپی معتبری (با ماده اولیه شناسایی‌شده) برای ایمپورت پیدا نشد."
            return
        }

        viewModelScope.launch {
            importing = true
            try {
                val imported = repository.importRecipes(requests)
                auditRepository.logEvent(
                    AUDIT_SCOPE, "import_excel",
                    "ایمپورت ${imported.size} رسپی از فایل «${importFileName ?: "نامشخص"}»",
                    Role.MANAGER.value, actorName.ifBlank { null },
                )
                importPreview = null
                importFileName = null
                load()
            } catch (e: Exception) {
                errorMessage = "خطا در ایمپورت: ${e.message}"
            } finally {
                importing = false
            }
        }
    }

    fun onPriceInputChange(productId: String, value: String) {
        priceInputs = priceInputs + (productId to value)
    }

    fun savePrice(product: Product) {
        val raw = priceInputs[product.id] ?: priceFor(product.id)?.unitPrice?.toString() ?: return
        val unitPrice = raw.trim().toDoubleOrNull() ?: return
        viewModelScope.launch {
            try {
                pricingRepository.saveIngredientPrice(product.id, product.name, unitPrice, product.stockUnit ?: product.unit)
                ingredientPrices = pricingRepository.getIngredientPrices()
                auditRepository.logEvent(
                    AUDIT_SCOPE, "update_ingredient_price",
                    "قیمت «${product.name}» به ${unitPrice} تومان به‌ازای هر ${product.stockUnit ?: product.unit} تنظیم شد",
                    Role.MANAGER.value, actorName.ifBlank { null },
                )
            } catch (e: Exception) {
                errorMessage = "خطا در ذخیره قیمت: ${e.message}"
            }
        }
    }

    fun priceFor(productId: String): IngredientPrice? = ingredientPrices.find { it.productId == productId }

    /** Products actually used as ingredients across existing recipes — mirrors the web's priceableProducts. */
    fun priceableProducts(): List<Product> {
        val usedIds = recipes.flatMap { it.ingredients }.map { it.productId }.distinct().toSet()
        return products.filter { it.id in usedIds }.sortedBy { it.name }
    }

    fun recipeCostToman(recipe: Recipe): Double =
        recipe.ingredients.sumOf { ingredient -> (priceFor(ingredient.productId)?.unitPrice ?: 0.0) * ingredient.quantity }

    fun productName(productId: String?): String = products.find { it.id == productId }?.name ?: "انتخاب کالا"
}

private fun formatQuantity(value: Double): String = if (value == value.toLong().toDouble()) value.toLong().toString() else value.toString()
