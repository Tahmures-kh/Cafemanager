package cafe.managment.ui.inventory

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import cafe.managment.data.model.Product
import cafe.managment.data.model.StockMovement
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.util.ProductCategories
import cafe.managment.data.util.ProductUnits
import cafe.managment.ui.theme.PenzaBackground
import cafe.managment.ui.theme.PenzaCard
import cafe.managment.ui.theme.PenzaGreen
import cafe.managment.ui.theme.PenzaGreenDeep
import cafe.managment.ui.theme.PenzaHero
import cafe.managment.ui.theme.PenzaMuted
import cafe.managment.ui.theme.PenzaPill
import cafe.managment.ui.theme.PenzaStatusBadge
import cafe.managment.ui.theme.stockStatusTone

@Composable
fun InventoryScreen(
    repository: InventoryRepository,
    auditRepository: AuditRepository,
    settingsRepository: AppSettingsRepository,
    onOpenOrders: () -> Unit,
    onOpenReports: () -> Unit,
    onBack: () -> Unit,
) {
    val viewModel: InventoryViewModel = viewModel(
        factory = viewModelFactory {
            initializer { InventoryViewModel(repository, auditRepository, settingsRepository) }
        }
    )

    viewModel.pendingDeleteProduct?.let { product ->
        AlertDialog(
            onDismissRequest = viewModel::cancelDelete,
            title = { Text("حذف کالا از انبار؟") },
            text = { Text("«${product.name}» از لیست انبار حذف می‌شود. این کار یک رکورد اصلاح موجودی ثبت می‌کند.") },
            confirmButton = { TextButton(onClick = viewModel::confirmDelete) { Text("حذف", color = MaterialTheme.colorScheme.error) } },
            dismissButton = { TextButton(onClick = viewModel::cancelDelete) { Text("انصراف") } },
        )
    }

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                PenzaHero {
                    PenzaPill(text = "Penza · داشبورد انبار")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "موجودی انبار", style = MaterialTheme.typography.headlineMedium)
                    if (viewModel.isLoading) {
                        Spacer(modifier = Modifier.height(12.dp))
                        CircularProgressIndicator(color = PenzaGreen)
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = viewModel.actorName,
                        onValueChange = viewModel::onActorNameChange,
                        label = { Text("نام انباردار") },
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
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        item { OutlinedButton(onClick = onOpenOrders, shape = MaterialTheme.shapes.medium) { Text("درخواست‌ها") } }
                        item {
                            Button(
                                onClick = onOpenReports,
                                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                                shape = MaterialTheme.shapes.medium,
                            ) { Text("گزارش دوره‌ای") }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = onBack) { Text("بازگشت") }
                }
            }

            item { FiltersCard(viewModel) }

            item { Text(text = "کالاهای انبار", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onBackground) }

            val rows = viewModel.rows()
            items(rows, key = { it.product.id }) { row ->
                InventoryRowCard(
                    row = row,
                    isQuickAdjustOpen = viewModel.quickAdjustProductId == row.product.id,
                    isEditOpen = viewModel.editForm?.productId == row.product.id,
                    viewModel = viewModel,
                )
            }
            if (rows.isEmpty() && !viewModel.isLoading) {
                item {
                    PenzaCard { Text(text = "کالایی با این فیلتر پیدا نشد.", color = PenzaMuted, style = MaterialTheme.typography.bodyMedium) }
                }
            }

            item { AddProductCard(viewModel) }
            item { RecentMovementsCard(viewModel.movements, viewModel.products) }
        }
    }
}

@Composable
private fun FiltersCard(viewModel: InventoryViewModel) {
    PenzaCard {
        OutlinedTextField(
            value = viewModel.searchTerm,
            onValueChange = viewModel::onSearchChange,
            label = { Text("جست‌وجوی کالا، واحد یا دسته...") },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(10.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                FilterChip(
                    selected = viewModel.categoryFilter == null,
                    onClick = { viewModel.onCategoryFilterChange(null) },
                    label = { Text("همه دسته‌ها") },
                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                )
            }
            items(ProductCategories.all) { (id, label) ->
                FilterChip(
                    selected = viewModel.categoryFilter == id,
                    onClick = { viewModel.onCategoryFilterChange(id) },
                    label = { Text(label) },
                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                )
            }
        }
        Spacer(modifier = Modifier.height(10.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            val sortOptions = listOf(
                SortMode.RECENT to "آخرین تغییر",
                SortMode.NAME to "نام کالا",
                SortMode.QUANTITY_HIGH to "موجودی زیاد",
                SortMode.QUANTITY_LOW to "موجودی کم",
            )
            items(sortOptions) { (mode, label) ->
                FilterChip(
                    selected = viewModel.sortMode == mode,
                    onClick = { viewModel.onSortModeChange(mode) },
                    label = { Text(label) },
                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                )
            }
        }
    }
}

@Composable
private fun AddProductCard(viewModel: InventoryViewModel) {
    PenzaCard {
        Text(text = "افزودن کالا", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
            value = viewModel.addForm.name,
            onValueChange = { value -> viewModel.onAddFormChange { it.copy(name = value) } },
            label = { Text("نام کالا") },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(8.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(ProductCategories.all) { (id, label) ->
                FilterChip(
                    selected = viewModel.addForm.category == id,
                    onClick = { viewModel.onAddFormChange { it.copy(category = id) } },
                    label = { Text(label) },
                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = viewModel.addForm.unit,
                onValueChange = { value -> viewModel.onAddFormChange { it.copy(unit = value) } },
                label = { Text("واحد موجودی") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.weight(1f),
            )
            OutlinedTextField(
                value = viewModel.addForm.orderUnit,
                onValueChange = { value -> viewModel.onAddFormChange { it.copy(orderUnit = value) } },
                label = { Text("واحد درخواست (اختیاری)") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = viewModel.addForm.orderUnitQuantity,
                onValueChange = { value -> viewModel.onAddFormChange { it.copy(orderUnitQuantity = value) } },
                label = { Text("هر واحد درخواست =") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.weight(1f),
            )
            OutlinedTextField(
                value = viewModel.addForm.currentQuantity,
                onValueChange = { value -> viewModel.onAddFormChange { it.copy(currentQuantity = value) } },
                label = { Text("موجودی فعلی") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = viewModel::submitAdd,
                enabled = !viewModel.submittingAdd,
                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                shape = MaterialTheme.shapes.medium,
            ) { Text(if (viewModel.submittingAdd) "در حال ثبت..." else "افزودن") }
            OutlinedButton(onClick = viewModel::resetAddForm, shape = MaterialTheme.shapes.medium) { Text("پاک کردن") }
        }
    }
}

@Composable
private fun InventoryRowCard(row: InventoryRow, isQuickAdjustOpen: Boolean, isEditOpen: Boolean, viewModel: InventoryViewModel) {
    val product = row.product
    val tier = ProductUnits.getStockStatus(product, row.inventoryItem)
    val quantity = row.inventoryItem?.currentQuantity ?: 0.0

    PenzaCard {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = product.name, style = MaterialTheme.typography.titleSmall)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${ProductCategories.label(product.category)} · ${ProductUnits.formatStockQuantity(product, quantity)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = PenzaMuted,
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "قابل درخواست: ${ProductUnits.formatAvailableQuantity(product, quantity)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = PenzaMuted,
                )
            }
            PenzaStatusBadge(text = ProductUnits.getStockStatusLabel(tier), tone = stockStatusTone(tier))
        }
        Spacer(modifier = Modifier.height(10.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                OutlinedButton(onClick = { if (isEditOpen) viewModel.resetEdit() else viewModel.openEdit(product) }, shape = MaterialTheme.shapes.medium) {
                    Text("ویرایش")
                }
            }
            item {
                OutlinedButton(onClick = { viewModel.openQuickAdjust(product.id, adding = true) }, shape = MaterialTheme.shapes.medium) {
                    Text("+ موجودی", color = PenzaGreenDeep)
                }
            }
            item {
                OutlinedButton(onClick = { viewModel.openQuickAdjust(product.id, adding = false) }, shape = MaterialTheme.shapes.medium) {
                    Text("- موجودی", color = MaterialTheme.colorScheme.error)
                }
            }
            item {
                TextButton(onClick = { viewModel.requestDelete(product) }) {
                    Text("حذف", color = PenzaMuted)
                }
            }
        }

        if (isQuickAdjustOpen) {
            Spacer(modifier = Modifier.height(10.dp))
            QuickAdjustPanel(viewModel)
        }
        if (isEditOpen) {
            Spacer(modifier = Modifier.height(10.dp))
            EditProductPanel(viewModel)
        }
    }
}

@Composable
private fun QuickAdjustPanel(viewModel: InventoryViewModel) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = viewModel.quickAdjustAmount,
                onValueChange = viewModel::onQuickAdjustAmountChange,
                label = { Text("مقدار") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.weight(1f),
            )
            OutlinedTextField(
                value = viewModel.quickAdjustReason,
                onValueChange = viewModel::onQuickAdjustReasonChange,
                label = { Text("دلیل اصلاح") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.weight(1.4f),
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = viewModel::submitQuickAdjust,
                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                shape = MaterialTheme.shapes.medium,
            ) { Text(if (viewModel.quickAdjustAdding) "ثبت افزایش" else "ثبت کاهش") }
            OutlinedButton(onClick = viewModel::resetQuickAdjust, shape = MaterialTheme.shapes.medium) { Text("لغو") }
        }
    }
}

@Composable
private fun EditProductPanel(viewModel: InventoryViewModel) {
    val form = viewModel.editForm ?: return
    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = form.name,
            onValueChange = { value -> viewModel.onEditFormChange { it.copy(name = value) } },
            label = { Text("نام کالا") },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(8.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(ProductCategories.all) { (id, label) ->
                FilterChip(
                    selected = form.category == id,
                    onClick = { viewModel.onEditFormChange { it.copy(category = id) } },
                    label = { Text(label) },
                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = form.unit,
                onValueChange = { value -> viewModel.onEditFormChange { it.copy(unit = value) } },
                label = { Text("واحد موجودی") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.weight(1f),
            )
            OutlinedTextField(
                value = form.orderUnit,
                onValueChange = { value -> viewModel.onEditFormChange { it.copy(orderUnit = value) } },
                label = { Text("واحد درخواست") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = form.orderUnitQuantity,
                onValueChange = { value -> viewModel.onEditFormChange { it.copy(orderUnitQuantity = value) } },
                label = { Text("هر واحد درخواست =") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.weight(1f),
            )
            OutlinedTextField(
                value = form.currentQuantity,
                onValueChange = { value -> viewModel.onEditFormChange { it.copy(currentQuantity = value) } },
                label = { Text("موجودی فعلی") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = viewModel::submitEdit,
                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                shape = MaterialTheme.shapes.medium,
            ) { Text("ذخیره") }
            OutlinedButton(onClick = viewModel::resetEdit, shape = MaterialTheme.shapes.medium) { Text("لغو") }
        }
    }
}

@Composable
private fun RecentMovementsCard(movements: List<StockMovement>, products: List<Product>) {
    PenzaCard {
        Text(text = "آخرین تغییرات", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(10.dp))
        if (movements.isEmpty()) {
            Text(text = "هنوز تغییری ثبت نشده است.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
        }
        movements.take(6).forEach { movement ->
            val product = products.find { it.id == movement.productId }
            val sign = if (movement.quantity > 0) "+" else ""
            Text(
                text = "${product?.name ?: "کالا حذف‌شده"} · $sign${ProductUnits.formatNumber(movement.quantity)} ${ProductUnits.stockUnit(product)}",
                style = MaterialTheme.typography.bodyMedium,
            )
            Text(text = movement.description, style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}
