package cafe.managment.ui.managerinventory

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.util.ProductCategories
import cafe.managment.data.util.ProductUnits
import cafe.managment.ui.theme.PenzaBackground
import cafe.managment.ui.theme.PenzaCard
import cafe.managment.ui.theme.PenzaGreen
import cafe.managment.ui.theme.PenzaHero
import cafe.managment.ui.theme.PenzaMuted
import cafe.managment.ui.theme.PenzaPill
import cafe.managment.ui.theme.PenzaStatCard
import cafe.managment.ui.theme.PenzaStatusBadge
import cafe.managment.ui.theme.PenzaTone
import cafe.managment.ui.theme.stockStatusTone

/**
 * Manager's read-only inventory report, mirroring /manager/inventory on the web (KPI cards plus a
 * read-only table and movement history) — deliberately not [cafe.managment.ui.inventory.InventoryScreen],
 * which is the storage team's add/edit/adjust/delete tool and stays storage-only.
 */
@Composable
fun ManagerInventoryScreen(
    inventoryRepository: InventoryRepository,
    onBack: () -> Unit,
) {
    val viewModel: ManagerInventoryViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ManagerInventoryViewModel(inventoryRepository) }
        }
    )

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                PenzaHero {
                    PenzaPill(text = "Penza · موجودی مدیریت")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "موجودی انبار", style = MaterialTheme.typography.headlineMedium)
                    if (viewModel.isLoading) {
                        Spacer(modifier = Modifier.height(12.dp))
                        CircularProgressIndicator(color = PenzaGreen)
                    }
                    viewModel.errorMessage?.let { message ->
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(text = message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = onBack) { Text("بازگشت") }
                }
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    viewModel.cards().chunked(2).forEach { pair ->
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            pair.forEach { card ->
                                PenzaStatCard(label = card.title, value = card.value, hint = card.description, modifier = Modifier.weight(1f))
                            }
                            if (pair.size == 1) Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }

            item {
                OutlinedTextField(
                    value = viewModel.searchTerm,
                    onValueChange = viewModel::onSearchChange,
                    label = { Text("جست‌وجوی کالا، واحد یا دسته...") },
                    singleLine = true,
                    shape = MaterialTheme.shapes.medium,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            item { Text(text = "موجودی", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onBackground) }

            val rows = viewModel.rows()
            items(rows, key = { it.product.id }) { row ->
                val tier = ProductUnits.getStockStatus(row.product, row.inventoryItem)
                val quantity = row.inventoryItem?.currentQuantity ?: 0.0
                PenzaCard {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = row.product.name, style = MaterialTheme.typography.titleSmall)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${ProductCategories.label(row.product.category)} · ${ProductUnits.formatStockQuantity(row.product, quantity)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = PenzaMuted,
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "قابل درخواست: ${ProductUnits.formatAvailableQuantity(row.product, quantity)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = PenzaMuted,
                            )
                        }
                        PenzaStatusBadge(text = ProductUnits.getStockStatusLabel(tier), tone = stockStatusTone(tier))
                    }
                }
            }
            if (rows.isEmpty() && !viewModel.isLoading) {
                item {
                    PenzaCard { Text(text = "کالایی با این جست‌وجو پیدا نشد.", color = PenzaMuted, style = MaterialTheme.typography.bodyMedium) }
                }
            }

            item {
                PenzaCard {
                    Text(text = "گردش کالا", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(10.dp))
                    val recentMovements = viewModel.recentMovements()
                    if (recentMovements.isEmpty()) {
                        Text(text = "هنوز رویدادی ثبت نشده است.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                    }
                    recentMovements.forEach { movement ->
                        val product = viewModel.products.find { it.id == movement.productId }
                        val sign = if (movement.quantity > 0) "+" else ""
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = product?.name ?: "کالا", style = MaterialTheme.typography.bodyMedium)
                                Text(text = "${movement.createdAt} · ${movement.createdBy}", style = MaterialTheme.typography.labelSmall, color = PenzaMuted)
                                Text(
                                    text = "تعداد: $sign${ProductUnits.formatStockQuantity(product, movement.quantity)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = PenzaMuted,
                                )
                                if (movement.description.isNotBlank()) {
                                    Text(text = movement.description, style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                                }
                            }
                            PenzaStatusBadge(
                                text = movementTypeLabel(movement.type),
                                tone = if (movement.type == "stock_in" || movement.type == "sent_to_cafe") PenzaTone.GREEN else PenzaTone.NEUTRAL,
                            )
                        }
                    }
                }
            }
        }
    }
}
