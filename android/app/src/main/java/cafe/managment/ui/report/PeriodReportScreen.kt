package cafe.managment.ui.report

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.repository.OrdersRepository
import cafe.managment.data.settings.Role
import cafe.managment.data.util.ProductUnits
import cafe.managment.ui.storageorders.isDeliveredStatus
import cafe.managment.ui.theme.PenzaBackground
import cafe.managment.ui.theme.PenzaCard
import cafe.managment.ui.theme.PenzaGreen
import cafe.managment.ui.theme.PenzaHero
import cafe.managment.ui.theme.PenzaMuted
import cafe.managment.ui.theme.PenzaPill
import cafe.managment.ui.theme.PenzaStatCard
import cafe.managment.ui.theme.PenzaStatusBadge
import cafe.managment.ui.theme.PenzaTone

/** Mirrors staff-management-saas/components/PeriodReport.tsx, reused by both manager/reports and storage/reports on the web. */
@Composable
fun PeriodReportScreen(
    role: Role,
    ordersRepository: OrdersRepository,
    inventoryRepository: InventoryRepository,
    onOpenOrders: () -> Unit,
    onOpenWorkspace: () -> Unit,
    onBack: () -> Unit,
) {
    val viewModel: PeriodReportViewModel = viewModel(
        factory = viewModelFactory {
            initializer { PeriodReportViewModel(role, ordersRepository, inventoryRepository) }
        }
    )
    val clipboardManager = LocalClipboardManager.current
    var copied by remember { mutableStateOf(false) }

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                PenzaHero {
                    PenzaPill(text = "Penza · گزارش دوره‌ای")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "گزارش", style = MaterialTheme.typography.headlineMedium)
                    if (viewModel.isLoading) {
                        Spacer(modifier = Modifier.height(12.dp))
                        CircularProgressIndicator(color = PenzaGreen)
                    }
                    viewModel.errorMessage?.let { message ->
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(text = message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        item {
                            OutlinedButton(onClick = onOpenOrders, shape = MaterialTheme.shapes.medium) { Text("درخواست‌ها") }
                        }
                        item {
                            OutlinedButton(onClick = onOpenWorkspace, shape = MaterialTheme.shapes.medium) {
                                Text(if (role == Role.MANAGER) "موجودی انبار" else "داشبورد انبار")
                            }
                        }
                        item {
                            Button(
                                onClick = {
                                    clipboardManager.setText(AnnotatedString(viewModel.summaryText()))
                                    copied = true
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                                shape = MaterialTheme.shapes.medium,
                            ) { Text(if (copied) "کپی شد" else "کپی خلاصه") }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = onBack) { Text("بازگشت") }
                }
            }

            item {
                PenzaCard {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = viewModel.startDate,
                            onValueChange = viewModel::onStartDateChange,
                            label = { Text("از تاریخ") },
                            singleLine = true,
                            shape = MaterialTheme.shapes.medium,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                            modifier = Modifier.weight(1f),
                        )
                        OutlinedTextField(
                            value = viewModel.endDate,
                            onValueChange = viewModel::onEndDateChange,
                            label = { Text("تا تاریخ") },
                            singleLine = true,
                            shape = MaterialTheme.shapes.medium,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = { viewModel.applyPreset(ReportPreset.TODAY) }, shape = MaterialTheme.shapes.medium) { Text("امروز") }
                        OutlinedButton(onClick = { viewModel.applyPreset(ReportPreset.WEEK) }, shape = MaterialTheme.shapes.medium) { Text("۷ روز اخیر") }
                        OutlinedButton(onClick = { viewModel.applyPreset(ReportPreset.MONTH) }, shape = MaterialTheme.shapes.medium) { Text("ماه جاری") }
                    }
                }
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    viewModel.summaryCards().chunked(2).forEach { pair ->
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            pair.forEach { card ->
                                PenzaStatCard(label = card.title, value = card.value, hint = card.hint, modifier = Modifier.weight(1f))
                            }
                            if (pair.size == 1) Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }

            item {
                PenzaCard {
                    Text(text = "بیشترین کالاهای تحویل‌شده", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(10.dp))
                    val topProducts = viewModel.topDeliveredProducts()
                    if (topProducts.isEmpty()) {
                        Text(text = "هنوز تحویلی در این بازه ثبت نشده است.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                    }
                    topProducts.forEach { entry ->
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text(text = entry.product.name, style = MaterialTheme.typography.bodyMedium)
                                Text(
                                    text = "واحد درخواست: ${ProductUnits.orderUnit(entry.product)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = PenzaMuted,
                                )
                            }
                            Text(text = ProductUnits.formatOrderQuantity(entry.product, entry.quantity), style = MaterialTheme.typography.titleMedium, color = PenzaGreen)
                        }
                    }
                }
            }

            item {
                PenzaCard {
                    Text(text = "درخواست‌ها", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(10.dp))
                    val filteredOrders = viewModel.filteredOrders()
                    if (filteredOrders.isEmpty()) {
                        Text(text = "درخواستی در این بازه وجود ندارد.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                    }
                    filteredOrders.forEach { order ->
                        val requestedQuantity = viewModel.itemsFor(order.id).sumOf { it.requestedQuantity }
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = "#${order.id.takeLast(6)} · ${order.requestedBy}", style = MaterialTheme.typography.bodyMedium)
                                Text(text = order.createdAt, style = MaterialTheme.typography.labelSmall, color = PenzaMuted)
                            }
                            Text(text = ProductUnits.formatNumber(requestedQuantity), style = MaterialTheme.typography.bodyMedium, modifier = Modifier.width(56.dp))
                            PenzaStatusBadge(
                                text = reportOrderStatusLabel(order.status),
                                tone = if (isDeliveredStatus(order.status)) PenzaTone.GREEN else PenzaTone.NEUTRAL,
                            )
                        }
                    }
                }
            }

            item {
                PenzaCard {
                    Text(text = "گردش موجودی", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(10.dp))
                    val filteredMovements = viewModel.filteredMovements()
                    if (filteredMovements.isEmpty()) {
                        Text(text = "گردش موجودی در این بازه وجود ندارد.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                    }
                    filteredMovements.forEach { movement ->
                        val product = viewModel.productFor(movement.productId)
                        val sign = if (movement.quantity > 0) "+" else ""
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = product?.name ?: "کالای حذف‌شده", style = MaterialTheme.typography.bodyMedium)
                                Text(text = "${movement.createdAt} · ${reportMovementLabel(movement.type)}", style = MaterialTheme.typography.labelSmall, color = PenzaMuted)
                                if (movement.description.isNotBlank()) {
                                    Text(text = movement.description, style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                                }
                            }
                            Text(
                                text = "$sign${ProductUnits.formatStockQuantity(product, movement.quantity)}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = PenzaGreen,
                            )
                        }
                    }
                }
            }
        }
    }
}
