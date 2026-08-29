package cafe.managment.ui.staffrequest

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import cafe.managment.data.model.Product
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.repository.OrdersRepository
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
fun StaffRequestScreen(
    inventoryRepository: InventoryRepository,
    ordersRepository: OrdersRepository,
    auditRepository: AuditRepository,
    settingsRepository: AppSettingsRepository,
    onBack: () -> Unit,
) {
    val viewModel: StaffRequestViewModel = viewModel(
        factory = viewModelFactory {
            initializer { StaffRequestViewModel(inventoryRepository, ordersRepository, auditRepository, settingsRepository) }
        }
    )

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                PenzaHero {
                    PenzaPill(text = "Penza · درخواست کالا")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "ثبت درخواست", style = MaterialTheme.typography.headlineMedium)
                    if (viewModel.isLoading) {
                        Spacer(modifier = Modifier.height(12.dp))
                        CircularProgressIndicator(color = PenzaGreen)
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    val selected = viewModel.selectedItems()
                    Text(
                        text = "${selected.size} قلم کالا · مجموع تعداد ${selected.sumOf { it.second }.let { if (it == it.toLong().toDouble()) it.toLong().toString() else it.toString() }}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = PenzaGreenDeep,
                    )
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
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = onBack) { Text("بازگشت") }
                }
            }

            item { CartCard(viewModel) }

            item {
                PenzaCard {
                    OutlinedTextField(
                        value = viewModel.searchTerm,
                        onValueChange = viewModel::onSearchChange,
                        label = { Text("جست‌وجوی کالا...") },
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
                                label = { Text("همه") },
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
                }
            }

            val filtered = viewModel.filteredProducts()
            items(filtered, key = { it.id }) { product ->
                ProductCard(product = product, viewModel = viewModel)
            }
            if (filtered.isEmpty() && !viewModel.isLoading) {
                item {
                    PenzaCard { Text(text = "کالایی پیدا نشد.", color = PenzaMuted, style = MaterialTheme.typography.bodyMedium) }
                }
            }
        }
    }
}

@Composable
private fun CartCard(viewModel: StaffRequestViewModel) {
    PenzaCard {
        Text(text = "سبد درخواست", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(10.dp))
        val selected = viewModel.selectedItems()
        if (selected.isEmpty()) {
            Text(text = "هنوز کالایی به سبد اضافه نشده است.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
        }
        selected.forEach { (product, quantity) ->
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(text = "${product.name} × ${ProductUnits.formatOrderQuantity(product, quantity)}", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                TextButton(onClick = { viewModel.removeItem(product.id) }) { Text("حذف", color = MaterialTheme.colorScheme.error) }
            }
        }
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
            value = viewModel.note,
            onValueChange = viewModel::onNoteChange,
            label = { Text("توضیح (اختیاری)") },
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(10.dp))
        Button(
            onClick = viewModel::submit,
            enabled = !viewModel.submitting && selected.isNotEmpty(),
            colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier.fillMaxWidth().height(50.dp),
        ) {
            Text(if (viewModel.submitting) "در حال ثبت..." else "ثبت درخواست", style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
private fun ProductCard(product: Product, viewModel: StaffRequestViewModel) {
    val inventoryItem = viewModel.inventoryFor(product.id)
    val tier = ProductUnits.getStockStatus(product, inventoryItem)
    val quantity = viewModel.quantityFor(product.id)

    PenzaCard {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = ProductCategories.label(product.category), style = MaterialTheme.typography.labelSmall, color = PenzaGreenDeep)
                Spacer(modifier = Modifier.height(2.dp))
                Text(text = product.name, style = MaterialTheme.typography.titleSmall)
                Spacer(modifier = Modifier.height(2.dp))
                Text(text = "واحد درخواست: ${ProductUnits.orderUnit(product)}", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                if (ProductUnits.hasUnitConversion(product)) {
                    Text(text = ProductUnits.formatUnitConversion(product), style = MaterialTheme.typography.labelSmall, color = PenzaMuted)
                }
                Spacer(modifier = Modifier.height(4.dp))
                PenzaStatusBadge(text = ProductUnits.getStockStatusLabel(tier), tone = stockStatusTone(tier))
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = "تعداد", style = MaterialTheme.typography.labelSmall, color = PenzaMuted)
                Text(text = ProductUnits.formatNumber(quantity), style = MaterialTheme.typography.titleLarge, color = if (quantity > 0) PenzaGreenDeep else PenzaMuted)
            }
        }
        Spacer(modifier = Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            QUICK_AMOUNTS.forEach { amount ->
                OutlinedButton(onClick = { viewModel.addQuantity(product.id, amount) }, shape = MaterialTheme.shapes.medium) {
                    Text("+${ProductUnits.formatNumber(amount)}")
                }
            }
            if (quantity > 0) {
                TextButton(onClick = { viewModel.removeItem(product.id) }) { Text("پاک کردن", color = MaterialTheme.colorScheme.error) }
            }
        }
    }
}
