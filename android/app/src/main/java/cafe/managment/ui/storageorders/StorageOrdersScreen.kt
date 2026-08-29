package cafe.managment.ui.storageorders

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
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.repository.OrdersRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.util.ProductUnits
import cafe.managment.ui.theme.PenzaBackground
import cafe.managment.ui.theme.PenzaCard
import cafe.managment.ui.theme.PenzaGreen
import cafe.managment.ui.theme.PenzaGreenDeep
import cafe.managment.ui.theme.PenzaHero
import cafe.managment.ui.theme.PenzaMuted
import cafe.managment.ui.theme.PenzaPill
import cafe.managment.ui.theme.PenzaProgressBar
import cafe.managment.ui.theme.PenzaStatCard
import cafe.managment.ui.theme.PenzaStatusBadge
import cafe.managment.ui.theme.PenzaTone

@Composable
fun StorageOrdersScreen(
    ordersRepository: OrdersRepository,
    inventoryRepository: InventoryRepository,
    auditRepository: AuditRepository,
    settingsRepository: AppSettingsRepository,
    onBack: () -> Unit,
) {
    val viewModel: StorageOrdersViewModel = viewModel(
        factory = viewModelFactory {
            initializer { StorageOrdersViewModel(ordersRepository, inventoryRepository, auditRepository, settingsRepository) }
        }
    )

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                PenzaHero {
                    PenzaPill(text = "Penza · انبار")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "درخواست‌ها", style = MaterialTheme.typography.headlineMedium)
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
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = onBack) { Text("بازگشت") }
                }
            }

            item {
                PenzaStatCard(
                    label = "منتظر آماده‌سازی",
                    value = viewModel.notStartedCount().toString(),
                    hint = "درخواست‌هایی که هنوز هیچ آماده‌سازی برایشان ثبت نشده",
                )
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = viewModel.activeFilter == StorageOrderFilter.REQUESTED,
                        onClick = { viewModel.onFilterChange(StorageOrderFilter.REQUESTED) },
                        label = { Text("درخواست کالا") },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                    )
                    FilterChip(
                        selected = viewModel.activeFilter == StorageOrderFilter.DELIVERED,
                        onClick = { viewModel.onFilterChange(StorageOrderFilter.DELIVERED) },
                        label = { Text("تحویل درخواست") },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                    )
                }
            }

            item { AggregatedItemsCard(viewModel) }

            item { Text(text = "لیست درخواست‌ها", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onBackground) }

            val visibleOrders = viewModel.visibleOrders()
            items(visibleOrders, key = { it.id }) { order ->
                val (requested, packed, count) = viewModel.totalsFor(order.id)
                OrderListCard(
                    orderId = order.id,
                    status = order.status,
                    requestedBy = order.requestedBy,
                    lineCount = count,
                    requested = requested,
                    packed = packed,
                    percent = viewModel.progressPercent(requested, packed),
                    selected = viewModel.selectedOrder()?.id == order.id,
                    onSelect = { viewModel.selectOrder(order.id) },
                )
            }
            if (visibleOrders.isEmpty() && !viewModel.isLoading) {
                item {
                    PenzaCard { Text(text = "سفارشی در این بخش وجود ندارد.", color = PenzaMuted, style = MaterialTheme.typography.bodyMedium) }
                }
            }

            viewModel.selectedOrder()?.let { order ->
                item { OrderDetailCard(order.id, order.status, order.note, viewModel) }
            }
        }
    }
}

@Composable
private fun AggregatedItemsCard(viewModel: StorageOrdersViewModel) {
    PenzaCard {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = "کالاهای درخواستی", style = MaterialTheme.typography.titleMedium)
        }
        Spacer(modifier = Modifier.height(10.dp))
        val items = viewModel.aggregatedItems()
        if (items.isEmpty()) {
            Text(text = "کالایی برای نمایش وجود ندارد.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
        }
        items.take(10).forEach { item ->
            val product = viewModel.productFor(item.productId)
            val remaining = (item.requested - item.packed).coerceAtLeast(0.0)
            Text(text = product?.name ?: "کالا", style = MaterialTheme.typography.bodyMedium)
            Text(
                text = "درخواستی: ${ProductUnits.formatOrderQuantity(product, item.requested)} · آماده: ${ProductUnits.formatOrderQuantity(product, item.packed)} · مانده: ${ProductUnits.formatOrderQuantity(product, remaining)}",
                style = MaterialTheme.typography.bodySmall,
                color = PenzaMuted,
            )
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun OrderListCard(
    orderId: String,
    status: String,
    requestedBy: String,
    lineCount: Int,
    requested: Double,
    packed: Double,
    percent: Int,
    selected: Boolean,
    onSelect: () -> Unit,
) {
    PenzaCard(
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text(text = "درخواست #${orderId.takeLast(6)}", style = MaterialTheme.typography.titleSmall)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = requestedBy, style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
            }
            PenzaStatusBadge(
                text = orderStatusLabel(status),
                tone = if (isDeliveredStatus(status)) PenzaTone.GREEN else PenzaTone.NEUTRAL,
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = "$lineCount قلم · درخواستی $requested · آماده $packed", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
        Spacer(modifier = Modifier.height(8.dp))
        PenzaProgressBar(percent = percent)
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedButton(onClick = onSelect, shape = MaterialTheme.shapes.medium) {
            Text(if (selected) "در حال نمایش" else "نمایش جزئیات")
        }
    }
}

@Composable
private fun OrderDetailCard(orderId: String, status: String, note: String?, viewModel: StorageOrdersViewModel) {
    val isDelivered = isDeliveredStatus(status)
    val busy = viewModel.busyOrderId == orderId

    PenzaCard {
        Text(text = "جزئیات درخواست #${orderId.takeLast(6)}", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(10.dp))

        if (!isDelivered) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { viewModel.fillRequested(orderId) }, enabled = !busy, shape = MaterialTheme.shapes.medium) {
                    Text("آماده‌سازی طبق موجودی")
                }
                Button(
                    onClick = { viewModel.deliverOrder(orderId) },
                    enabled = !busy,
                    colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                    shape = MaterialTheme.shapes.medium,
                ) { Text("تحویل درخواست") }
            }
            Spacer(modifier = Modifier.height(12.dp))
        }

        viewModel.itemsFor(orderId).forEach { item ->
            val product = viewModel.productFor(item.productId)
            val inventoryItem = viewModel.inventoryFor(item.productId)
            val currentQuantity = inventoryItem?.currentQuantity ?: 0.0
            val remaining = (item.requestedQuantity - item.packedQuantity).coerceAtLeast(0.0)

            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                Text(text = product?.name ?: "کالا", style = MaterialTheme.typography.bodyMedium)
                Text(
                    text = "درخواستی: ${ProductUnits.formatOrderQuantity(product, item.requestedQuantity)} · موجودی: ${ProductUnits.formatStockQuantity(product, currentQuantity)} · مانده: ${ProductUnits.formatOrderQuantity(product, remaining)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = PenzaMuted,
                )
                if (!isDelivered) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = viewModel.packedInputs[item.id].orEmpty(),
                            onValueChange = { value -> viewModel.onPackedInputChange(item.id, value) },
                            label = { Text("آماده‌شده") },
                            singleLine = true,
                            shape = MaterialTheme.shapes.medium,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                            modifier = Modifier.weight(1f),
                        )
                        TextButton(onClick = { viewModel.submitPackedQuantity(orderId, item.id) }) { Text("ثبت", color = PenzaGreenDeep) }
                    }
                } else {
                    Text(
                        text = "آماده‌شده: ${ProductUnits.formatOrderQuantity(product, item.packedQuantity)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = PenzaGreenDeep,
                    )
                }
            }
        }

        if (!note.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(10.dp))
            Text(text = "توضیح کافه: $note", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
        }
    }
}
