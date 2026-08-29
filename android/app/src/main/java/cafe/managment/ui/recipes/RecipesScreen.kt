package cafe.managment.ui.recipes

import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import cafe.managment.data.catalog.ProductCatalog
import cafe.managment.data.importer.SpreadsheetReader
import cafe.managment.data.model.Product
import cafe.managment.data.model.Recipe
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.PricingRepository
import cafe.managment.data.repository.RecipesRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.ui.theme.PenzaAuditHistory
import cafe.managment.ui.theme.PenzaBackground
import cafe.managment.ui.theme.PenzaBorder
import cafe.managment.ui.theme.PenzaCard
import cafe.managment.ui.theme.PenzaGreen
import cafe.managment.ui.theme.PenzaGreenDeep
import cafe.managment.ui.theme.PenzaHero
import cafe.managment.ui.theme.PenzaMuted
import cafe.managment.ui.theme.PenzaPill
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun RecipesScreen(
    repository: RecipesRepository,
    pricingRepository: PricingRepository,
    auditRepository: AuditRepository,
    settingsRepository: AppSettingsRepository,
    productCatalog: ProductCatalog,
    onBack: () -> Unit,
) {
    val viewModel: RecipesViewModel = viewModel(
        factory = viewModelFactory {
            initializer { RecipesViewModel(repository, pricingRepository, auditRepository, settingsRepository, productCatalog) }
        }
    )

    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val filePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            try {
                val (fileName, rows) = withContext(Dispatchers.IO) { readSpreadsheet(context, uri) }
                viewModel.onFileParsed(fileName, rows)
            } catch (e: Exception) {
                viewModel.onFileParseFailed(e.message ?: "خواندن فایل ناموفق بود.")
            }
        }
    }

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                PenzaHero {
                    PenzaPill(text = "Penza · رسپی‌ها")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "رسپی‌ها", style = MaterialTheme.typography.headlineMedium)
                    if (viewModel.isLoading) {
                        Spacer(modifier = Modifier.height(12.dp))
                        CircularProgressIndicator(color = PenzaGreen)
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = viewModel::startCreate,
                            colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                            shape = MaterialTheme.shapes.medium,
                        ) {
                            Text("+ رسپی جدید")
                        }
                        OutlinedButton(onClick = { filePicker.launch("*/*") }, shape = MaterialTheme.shapes.medium) {
                            Text("ایمپورت از اکسل/CSV")
                        }
                    }
                    viewModel.errorMessage?.let { message ->
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(text = message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = onBack) { Text("بازگشت") }
                }
            }

            if (viewModel.editingRecipeId != null) {
                item { RecipeFormCard(viewModel) }
            }

            if (viewModel.importPreview != null || viewModel.importError != null) {
                item { ImportPreviewCard(viewModel) }
            }

            item { Text(text = "رسپی‌های ثبت‌شده", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onBackground) }

            items(viewModel.recipes, key = { it.id }) { recipe ->
                RecipeRow(
                    recipe = recipe,
                    costToman = viewModel.recipeCostToman(recipe),
                    onEdit = { viewModel.startEdit(recipe) },
                    onDelete = { viewModel.deleteRecipe(recipe) },
                )
            }
            if (viewModel.recipes.isEmpty() && !viewModel.isLoading) {
                item {
                    PenzaCard { Text(text = "هنوز رسپی‌ای ثبت نشده است.", color = PenzaMuted, style = MaterialTheme.typography.bodyMedium) }
                }
            }

            item { PricingCard(viewModel) }

            item {
                PenzaCard {
                    Text(text = "تاریخچه", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(10.dp))
                    PenzaAuditHistory(entries = viewModel.auditEntries)
                }
            }
        }
    }
}

@Composable
private fun RecipeFormCard(viewModel: RecipesViewModel) {
    PenzaCard {
        Text(
            text = if (viewModel.editingRecipeId == NEW_RECIPE_ID) "رسپی جدید" else "ویرایش رسپی",
            style = MaterialTheme.typography.titleMedium,
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = viewModel.formName,
            onValueChange = viewModel::onFormNameChange,
            label = { Text("نام رسپی") },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
            value = viewModel.formCategory,
            onValueChange = viewModel::onFormCategoryChange,
            label = { Text("دسته‌بندی (اختیاری)") },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(modifier = Modifier.height(14.dp))
        Text(text = "مواد اولیه", style = MaterialTheme.typography.labelMedium)
        Spacer(modifier = Modifier.height(8.dp))
        viewModel.formIngredients.forEachIndexed { index, draft ->
            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.weight(1.6f)) {
                    ProductPicker(
                        products = viewModel.products,
                        selectedProductId = draft.productId,
                        onSelect = { productId -> viewModel.updateIngredientProduct(index, productId) },
                    )
                }
                OutlinedTextField(
                    value = draft.quantity,
                    onValueChange = { viewModel.updateIngredientQuantity(index, it) },
                    label = { Text("مقدار") },
                    singleLine = true,
                    shape = MaterialTheme.shapes.medium,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                    modifier = Modifier.weight(0.9f),
                )
                if (viewModel.formIngredients.size > 1) {
                    TextButton(onClick = { viewModel.removeIngredientRow(index) }) {
                        Text("حذف", color = MaterialTheme.colorScheme.error)
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        }
        TextButton(onClick = viewModel::addIngredientRow) { Text("+ افزودن ماده اولیه") }

        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
            value = viewModel.actorName,
            onValueChange = viewModel::onActorNameChange,
            label = { Text("نام ثبت‌کننده") },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(modifier = Modifier.height(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = viewModel::saveRecipe,
                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                shape = MaterialTheme.shapes.medium,
            ) { Text("ذخیره") }
            OutlinedButton(onClick = viewModel::cancelForm, shape = MaterialTheme.shapes.medium) { Text("انصراف") }
        }
    }
}

@Composable
private fun ImportPreviewCard(viewModel: RecipesViewModel) {
    PenzaCard {
        Text(text = "پیش‌نمایش ایمپورت", style = MaterialTheme.typography.titleMedium)
        viewModel.importError?.let { error ->
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }
        viewModel.importPreview?.let { preview ->
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "${preview.recipes.size} رسپی شناسایی شد · ${preview.matchedCount} ماده اولیه تطبیق یافت · ${preview.unmatchedCount} مورد ناشناخته",
                style = MaterialTheme.typography.bodySmall,
                color = PenzaMuted,
            )
            Spacer(modifier = Modifier.height(10.dp))
            preview.recipes.take(10).forEach { recipePreview ->
                Text(text = "${recipePreview.name} (${recipePreview.rows.size} قلم)", style = MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.height(4.dp))
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = viewModel::confirmImport,
                    enabled = !viewModel.importing,
                    colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                    shape = MaterialTheme.shapes.medium,
                ) { Text(if (viewModel.importing) "در حال ایمپورت..." else "تایید ایمپورت") }
                OutlinedButton(onClick = viewModel::cancelImportPreview, shape = MaterialTheme.shapes.medium) { Text("انصراف") }
            }
        }
    }
}

@Composable
private fun RecipeRow(recipe: Recipe, costToman: Double, onEdit: () -> Unit, onDelete: () -> Unit) {
    PenzaCard {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text(text = recipe.name, style = MaterialTheme.typography.titleSmall)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${recipe.ingredients.size} ماده اولیه · هزینه تقریبی ${costToman.toLong()} تومان",
                    style = MaterialTheme.typography.bodySmall,
                    color = PenzaMuted,
                )
            }
        }
        Spacer(modifier = Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onEdit, shape = MaterialTheme.shapes.medium) { Text("ویرایش") }
            TextButton(onClick = onDelete) { Text("حذف", color = MaterialTheme.colorScheme.error) }
        }
    }
}

@Composable
private fun PricingCard(viewModel: RecipesViewModel) {
    PenzaCard {
        Text(text = "قیمت مواد اولیه", style = MaterialTheme.typography.titleMedium)
        if (viewModel.exchangeRatesConfigured && viewModel.exchangeRates != null) {
            Spacer(modifier = Modifier.height(6.dp))
            val rates = viewModel.exchangeRates!!
            Text(
                text = "نرخ ارز: $ ${rates.usd} · € ${rates.eur} · ₺ ${rates.tryLira}",
                style = MaterialTheme.typography.bodySmall,
                color = PenzaMuted,
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        val priceable = viewModel.priceableProducts()
        if (priceable.isEmpty()) {
            Text(text = "پس از ثبت رسپی، مواد اولیه آن اینجا قابل قیمت‌گذاری خواهند بود.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
        }
        priceable.forEach { product ->
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                Text(text = product.name, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                OutlinedTextField(
                    value = viewModel.priceInputs[product.id] ?: viewModel.priceFor(product.id)?.unitPrice?.toString().orEmpty(),
                    onValueChange = { viewModel.onPriceInputChange(product.id, it) },
                    label = { Text("قیمت (تومان)") },
                    singleLine = true,
                    shape = MaterialTheme.shapes.medium,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                    modifier = Modifier.weight(1f),
                )
                TextButton(onClick = { viewModel.savePrice(product) }) { Text("ذخیره", color = PenzaGreenDeep) }
            }
        }
    }
}

@Composable
private fun ProductPicker(products: List<Product>, selectedProductId: String?, onSelect: (String) -> Unit) {
    var query by remember(selectedProductId) { mutableStateOf(products.find { it.id == selectedProductId }?.name.orEmpty()) }
    var expanded by remember { mutableStateOf(false) }

    Column {
        OutlinedTextField(
            value = query,
            onValueChange = {
                query = it
                expanded = true
            },
            label = { Text("جستجوی کالا") },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            modifier = Modifier.fillMaxWidth(),
        )
        if (expanded && query.isNotBlank()) {
            val matches = products.filter { it.name.contains(query, ignoreCase = true) }.take(20)
            if (matches.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 220.dp)
                        .verticalScroll(rememberScrollState())
                        .border(1.dp, PenzaBorder, MaterialTheme.shapes.medium),
                ) {
                    matches.forEach { product ->
                        Text(
                            text = product.name,
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    onSelect(product.id)
                                    query = product.name
                                    expanded = false
                                }
                                .padding(12.dp),
                        )
                    }
                }
            }
        }
    }
}

private fun readSpreadsheet(context: android.content.Context, uri: Uri): Pair<String, List<Map<String, String>>> {
    val fileName = queryFileName(context, uri) ?: "file"
    val lowerName = fileName.lowercase()
    return if (lowerName.endsWith(".csv")) {
        val text = context.contentResolver.openInputStream(uri)?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }
            ?: throw IllegalStateException("فایل قابل خواندن نیست.")
        fileName to SpreadsheetReader.readCsv(text)
    } else {
        val input = context.contentResolver.openInputStream(uri) ?: throw IllegalStateException("فایل قابل خواندن نیست.")
        fileName to input.use { SpreadsheetReader.readXlsx(it) }
    }
}

private fun queryFileName(context: android.content.Context, uri: Uri): String? {
    val cursor = context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null) ?: return null
    return cursor.use {
        if (it.moveToFirst()) {
            val index = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (index >= 0) it.getString(index) else null
        } else {
            null
        }
    }
}
