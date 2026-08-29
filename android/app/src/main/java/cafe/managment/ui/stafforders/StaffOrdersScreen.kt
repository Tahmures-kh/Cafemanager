package cafe.managment.ui.stafforders

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
import cafe.managment.ui.storageorders.isDeliveredStatus
import cafe.managment.ui.storageorders.orderStatusLabel
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
fun StaffOrdersScreen(
    ordersRepository: OrdersRepository,
    inventoryRepository: InventoryRepository,
    auditRepository: AuditRepository,
    settingsRepository: AppSettingsRepository,
    onOpenRequest: () -> Unit,
    onBack: () -> Unit,
) {
    val viewModel: StaffOrdersViewModel = viewModel(
        factory = viewModelFactory {
            initializer { StaffOrdersViewModel(ordersRepository, inventoryRepository, auditRepository, settingsRepository) }
        }
    )

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                PenzaHero {
                    PenzaPill(text = "Penza · پیگیری تحویل")
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
                        label = { Text("نام ثبت‌کننده (برای فیلتر درخواست‌های شما)") },
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
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = onOpenRequest,
                            colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                            shape = MaterialTheme.shapes.medium,
                        ) { Text("ثبت درخواست جدید") }
                        TextButton(onClick = onBack) { Text("بازگشت") }
                    }
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    PenzaStatCard(label = "درخواست کالا", value = viewModel.requestedCount().toString(), hint = "هنوز تحویل نشده‌اند", modifier = Modifier.weight(1f))
                    PenzaStatCard(label = "تحویل درخواست", value = viewModel.deliveredCount().toString(), hint = "از طرف انبار ارسال شده‌اند", modifier = Modifier.weight(1f))
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = viewModel.activeFilter == StaffOrderFilter.REQUESTED,
                        onClick = { viewModel.onFilterChange(StaffOrderFilter.REQUESTED) },
                        label = { Text("درخواست‌ها") },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                    )
                    FilterChip(
                        selected = viewModel.activeFilter == StaffOrderFilter.DELIVERED,
                        onClick = { viewModel.onFilterChange(StaffOrderFilter.DELIVERED) },
                        label = {
                            Text(
                                if (viewModel.pendingConfirmationCount() > 0) "تحویل‌شده (${viewModel.pendingConfirmationCount()} منتظر تایید)" else "تحویل‌شده"
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PenzaGreen),
                    )
                }
            }

            val visibleOrders = viewModel.visibleOrders()
            items(visibleOrders, key = { it.id }) { order ->
                val (requested, packed, count) = viewModel.totalsFor(order.id)
                OrderListCard(
                    orderId = order.id,
                    status = order.status,
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
                    PenzaCard { Text(text = "در این بخش سفارشی وجود ندارد.", color = PenzaMuted, style = MaterialTheme.typography.bodyMedium) }
                }
            }

            viewModel.selectedOrder()?.let { order ->
                item { OrderDetailCard(order.id, order.status, order.note, viewModel) }
            }
        }
    }
}

@Composable
private fun OrderListCard(
    orderId: String,
    status: String,
    lineCount: Int,
    requested: Double,
    packed: Double,
    percent: Int,
    selected: Boolean,
    onSelect: () -> Unit,
) {
    PenzaCard {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = "درخواست #${orderId.takeLast(6)}", style = MaterialTheme.typography.titleSmall)
            PenzaStatusBadge(text = orderStatusLabel(status), tone = if (isDeliveredStatus(status)) PenzaTone.GREEN else PenzaTone.NEUTRAL)
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
private fun OrderDetailCard(orderId: String, status: String, note: String?, viewModel: StaffOrdersViewModel) {
    PenzaCard {
        Text(text = "جزئیات درخواست #${orderId.takeLast(6)}", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(10.dp))

        viewModel.itemsFor(orderId).forEach { item ->
            val product = viewModel.productFor(item.productId)
            val remaining = (item.requestedQuantity - item.packedQuantity).coerceAtLeast(0.0)
            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                Text(text = product?.name ?: "کالا", style = MaterialTheme.typography.bodyMedium)
                Text(
                    text = "درخواستی: ${ProductUnits.formatOrderQuantity(product, item.requestedQuantity)} · آماده: ${ProductUnits.formatOrderQuantity(product, item.packedQuantity)}" +
                        if (remaining > 0) " · مانده: ${ProductUnits.formatOrderQuantity(product, remaining)}" else " · کامل",
                    style = MaterialTheme.typography.bodySmall,
                    color = PenzaMuted,
                )
            }
        }

        if (!note.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = "توضیح: $note", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
        }

        if (status == "sent") {
            Spacer(modifier = Modifier.height(14.dp))
            Button(
                onClick = { viewModel.confirmReceived(orderId) },
                enabled = !viewModel.confirming,
                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                shape = MaterialTheme.shapes.medium,
            ) { Text(if (viewModel.confirming) "در حال ثبت..." else "تحویل گرفتم") }
        }
    }
}
