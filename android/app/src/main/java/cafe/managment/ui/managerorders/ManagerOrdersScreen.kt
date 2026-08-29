package cafe.managment.ui.managerorders

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
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.repository.OrdersRepository
import cafe.managment.data.util.ProductUnits
import cafe.managment.ui.storageorders.isDeliveredStatus
import cafe.managment.ui.storageorders.orderStatusLabel
import cafe.managment.ui.theme.PenzaBackground
import cafe.managment.ui.theme.PenzaCard
import cafe.managment.ui.theme.PenzaGreen
import cafe.managment.ui.theme.PenzaHero
import cafe.managment.ui.theme.PenzaMuted
import cafe.managment.ui.theme.PenzaPill
import cafe.managment.ui.theme.PenzaProgressBar
import cafe.managment.ui.theme.PenzaStatusBadge
import cafe.managment.ui.theme.PenzaTone

@Composable
fun ManagerOrdersScreen(
    ordersRepository: OrdersRepository,
    inventoryRepository: InventoryRepository,
    onBack: () -> Unit,
) {
    val viewModel: ManagerOrdersViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ManagerOrdersViewModel(ordersRepository, inventoryRepository) }
        }
    )

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                PenzaHero {
                    PenzaPill(text = "Penza · مدیریت درخواست‌ها")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "درخواست‌ها", style = MaterialTheme.typography.headlineMedium)
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
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = viewModel.activeFilter == ManagerOrderFilter.REQUESTED,
                        onClick = { viewModel.onFilterChange(ManagerOrderFilter.REQUESTED) },
                        label = { Text("درخواست کالا") },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                    )
                    FilterChip(
                        selected = viewModel.activeFilter == ManagerOrderFilter.DELIVERED,
                        onClick = { viewModel.onFilterChange(ManagerOrderFilter.DELIVERED) },
                        label = { Text("تحویل درخواست") },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                    )
                }
            }

            val visibleOrders = viewModel.visibleOrders()
            items(visibleOrders, key = { it.id }) { order ->
                val (requested, packed, count) = viewModel.totalsFor(order.id)
                PenzaCard {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "درخواست #${order.id.takeLast(6)}", style = MaterialTheme.typography.titleSmall)
                        PenzaStatusBadge(text = orderStatusLabel(order.status), tone = if (isDeliveredStatus(order.status)) PenzaTone.GREEN else PenzaTone.NEUTRAL)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "$count قلم · درخواستی $requested · آماده $packed", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                    Spacer(modifier = Modifier.height(8.dp))
                    PenzaProgressBar(percent = viewModel.progressPercent(requested, packed))
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedButton(onClick = { viewModel.selectOrder(order.id) }, shape = MaterialTheme.shapes.medium) {
                        Text(if (viewModel.selectedOrder()?.id == order.id) "در حال نمایش" else "نمایش جزئیات")
                    }
                }
            }
            if (visibleOrders.isEmpty() && !viewModel.isLoading) {
                item {
                    PenzaCard { Text(text = "سفارشی در این بخش وجود ندارد.", color = PenzaMuted, style = MaterialTheme.typography.bodyMedium) }
                }
            }

            viewModel.selectedOrder()?.let { order ->
                item {
                    PenzaCard {
                        Text(text = "جزئیات درخواست #${order.id.takeLast(6)}", style = MaterialTheme.typography.titleMedium)
                        Spacer(modifier = Modifier.height(10.dp))
                        viewModel.itemsFor(order.id).forEach { item ->
                            val product = viewModel.productFor(item.productId)
                            val remaining = (item.requestedQuantity - item.packedQuantity).coerceAtLeast(0.0)
                            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                                Text(text = product?.name ?: "کالا", style = MaterialTheme.typography.bodyMedium)
                                Text(
                                    text = "درخواستی: ${ProductUnits.formatOrderQuantity(product, item.requestedQuantity)} · آماده: ${ProductUnits.formatOrderQuantity(product, item.packedQuantity)} · مانده: ${ProductUnits.formatOrderQuantity(product, remaining)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = PenzaMuted,
                                )
                            }
                        }
                        if (!order.note.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "توضیح کافه: ${order.note}", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                        }
                    }
                }
            }
        }
    }
}
