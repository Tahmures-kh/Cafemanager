package cafe.managment.ui.sales

import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import cafe.managment.data.importer.SpreadsheetReader
import cafe.managment.data.model.SalesBatch
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.RecipesRepository
import cafe.managment.data.repository.SalesRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.ui.theme.PenzaAuditHistory
import cafe.managment.ui.theme.PenzaBackground
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
fun SalesScreen(
    repository: SalesRepository,
    recipesRepository: RecipesRepository,
    auditRepository: AuditRepository,
    settingsRepository: AppSettingsRepository,
    onBack: () -> Unit,
) {
    val viewModel: SalesViewModel = viewModel(
        factory = viewModelFactory {
            initializer { SalesViewModel(repository, recipesRepository, auditRepository, settingsRepository) }
        }
    )

    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val spreadsheetPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            try {
                val (fileName, rows) = withContext(Dispatchers.IO) { readSpreadsheetFile(context, uri) }
                val sourceType = if (fileName.lowercase().endsWith(".csv")) "csv" else "excel"
                viewModel.onSpreadsheetParsed(fileName, sourceType, rows)
            } catch (e: Exception) {
                viewModel.onImportFailed(e.message ?: "خواندن فایل ناموفق بود.")
            }
        }
    }

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        val fileName = queryFileName(context, uri) ?: "photo.jpg"
        viewModel.onImagePicked(fileName)
        scope.launch {
            try {
                val (bytes, mimeType) = withContext(Dispatchers.IO) {
                    val stream = context.contentResolver.openInputStream(uri) ?: throw IllegalStateException("فایل قابل خواندن نیست.")
                    val bytes = stream.use { it.readBytes() }
                    bytes to (context.contentResolver.getType(uri) ?: "image/jpeg")
                }
                val items = repository.extractImage(bytes, fileName, mimeType)
                viewModel.onImageExtracted(items)
            } catch (e: Exception) {
                viewModel.onImportFailed(e.message ?: "خواندن عکس ناموفق بود.")
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
                    PenzaPill(text = "Penza · فروش و تحلیل")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "ثبت فروش شیفت", style = MaterialTheme.typography.headlineMedium)
                    if (viewModel.isLoading) {
                        Spacer(modifier = Modifier.height(12.dp))
                        CircularProgressIndicator(color = PenzaGreen)
                    }

                    Spacer(modifier = Modifier.height(20.dp))
                    PenzaCard {
                        Column {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = viewModel.shiftDate,
                                    onValueChange = viewModel::onShiftDateChange,
                                    label = { Text("تاریخ شیفت (YYYY-MM-DD)") },
                                    singleLine = true,
                                    shape = MaterialTheme.shapes.medium,
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                                    modifier = Modifier.weight(1f),
                                )
                                OutlinedTextField(
                                    value = viewModel.shiftLabel,
                                    onValueChange = viewModel::onShiftLabelChange,
                                    label = { Text("عنوان شیفت (اختیاری)") },
                                    singleLine = true,
                                    shape = MaterialTheme.shapes.medium,
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                                    modifier = Modifier.weight(1f),
                                )
                            }

                            Spacer(modifier = Modifier.height(14.dp))
                            Text(text = "آیتم‌های فروش (ثبت دستی)", style = MaterialTheme.typography.labelMedium)
                            Spacer(modifier = Modifier.height(8.dp))
                            viewModel.manualItems.forEachIndexed { index, draft ->
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                    OutlinedTextField(
                                        value = draft.itemName,
                                        onValueChange = { value -> viewModel.updateManualItem(index) { it.copy(itemName = value) } },
                                        label = { Text("نام آیتم") },
                                        singleLine = true,
                                        shape = MaterialTheme.shapes.medium,
                                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                                        modifier = Modifier.weight(1.3f),
                                    )
                                    OutlinedTextField(
                                        value = draft.quantitySold,
                                        onValueChange = { value -> viewModel.updateManualItem(index) { it.copy(quantitySold = value) } },
                                        label = { Text("تعداد") },
                                        singleLine = true,
                                        shape = MaterialTheme.shapes.medium,
                                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                                        modifier = Modifier.weight(0.7f),
                                    )
                                    OutlinedTextField(
                                        value = draft.unitPrice,
                                        onValueChange = { value -> viewModel.updateManualItem(index) { it.copy(unitPrice = value) } },
                                        label = { Text("قیمت واحد") },
                                        singleLine = true,
                                        shape = MaterialTheme.shapes.medium,
                                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                                        modifier = Modifier.weight(0.9f),
                                    )
                                    if (viewModel.manualItems.size > 1) {
                                        TextButton(onClick = { viewModel.removeManualItemRow(index) }) {
                                            Text("حذف", color = MaterialTheme.colorScheme.error)
                                        }
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                            TextButton(onClick = viewModel::addManualItemRow) { Text("+ افزودن آیتم") }

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

                            viewModel.errorMessage?.let { message ->
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(text = message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                            }
                            viewModel.infoMessage?.let { message ->
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(text = message, color = PenzaGreenDeep, style = MaterialTheme.typography.bodySmall)
                            }

                            Spacer(modifier = Modifier.height(14.dp))
                            Button(
                                onClick = viewModel::submitManual,
                                enabled = !viewModel.submittingManual,
                                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                                shape = MaterialTheme.shapes.medium,
                                modifier = Modifier.fillMaxWidth().height(50.dp),
                            ) {
                                Text(if (viewModel.submittingManual) "در حال ثبت..." else "ثبت فروش دستی", style = MaterialTheme.typography.labelLarge)
                            }

                            Spacer(modifier = Modifier.height(14.dp))
                            Text(text = "یا ایمپورت از فایل / عکس", style = MaterialTheme.typography.labelMedium)
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(onClick = { spreadsheetPicker.launch("*/*") }, shape = MaterialTheme.shapes.medium) {
                                    Text("اکسل / CSV")
                                }
                                OutlinedButton(
                                    onClick = { imagePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                                    shape = MaterialTheme.shapes.medium,
                                ) {
                                    Text("عکس گزارش پایان شیفت")
                                }
                            }
                            if (viewModel.extractingImage) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "در حال خواندن عکس...", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            TextButton(onClick = onBack) { Text("بازگشت") }
                        }
                    }
                }
            }

            if (viewModel.importPreview != null || viewModel.importError != null) {
                item { SalesImportPreviewCard(viewModel) }
            }

            item { Text(text = "شیفت‌های ثبت‌شده", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onBackground) }

            items(viewModel.batches, key = { it.id }) { batch -> SalesBatchRow(batch) }
            if (viewModel.batches.isEmpty() && !viewModel.isLoading) {
                item {
                    PenzaCard { Text(text = "هنوز فروشی ثبت نشده است.", color = PenzaMuted, style = MaterialTheme.typography.bodyMedium) }
                }
            }

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
private fun SalesImportPreviewCard(viewModel: SalesViewModel) {
    PenzaCard {
        Text(text = "پیش‌نمایش ایمپورت", style = MaterialTheme.typography.titleMedium)
        viewModel.importError?.let { error ->
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }
        viewModel.importPreview?.let { preview ->
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "${preview.rows.size} آیتم شناسایی شد · ${preview.matchedCount} مورد با رسپی تطبیق یافت · ${preview.unmatchedCount} مورد ناشناخته",
                style = MaterialTheme.typography.bodySmall,
                color = PenzaMuted,
            )
            Spacer(modifier = Modifier.height(10.dp))
            preview.rows.take(15).forEach { row ->
                Text(text = "${row.itemName} × ${row.quantitySold}", style = MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.height(4.dp))
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = viewModel::confirmImport,
                    enabled = !viewModel.importing,
                    colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                    shape = MaterialTheme.shapes.medium,
                ) { Text(if (viewModel.importing) "در حال ثبت..." else "تایید و ثبت") }
                OutlinedButton(onClick = viewModel::cancelImportPreview, shape = MaterialTheme.shapes.medium) { Text("انصراف") }
            }
        }
    }
}

@Composable
private fun SalesBatchRow(batch: SalesBatch) {
    PenzaCard {
        Text(text = "${batch.shiftDate}${batch.shiftLabel?.let { " · $it" } ?: ""}", style = MaterialTheme.typography.titleSmall)
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "${batch.items.size} آیتم · منبع: ${sourceLabel(batch.sourceType)}",
            style = MaterialTheme.typography.bodySmall,
            color = PenzaMuted,
        )
        Spacer(modifier = Modifier.height(8.dp))
        batch.items.take(5).forEach { item ->
            Text(text = "${item.itemName} × ${item.quantitySold}", style = MaterialTheme.typography.bodySmall)
        }
    }
}

private fun sourceLabel(sourceType: String) = when (sourceType) {
    "manual" -> "ثبت دستی"
    "excel" -> "اکسل"
    "csv" -> "CSV"
    "image" -> "عکس"
    else -> sourceType
}

private fun readSpreadsheetFile(context: android.content.Context, uri: Uri): Pair<String, List<Map<String, String>>> {
    val fileName = queryFileName(context, uri) ?: "file"
    return if (fileName.lowercase().endsWith(".csv")) {
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
