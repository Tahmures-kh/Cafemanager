package cafe.managment.ui.managerdashboard

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
import androidx.compose.material3.CircularProgressIndicator
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
import cafe.managment.ui.theme.PenzaStatCard
import cafe.managment.ui.theme.PenzaStatusBadge
import cafe.managment.ui.theme.PenzaTone
import cafe.managment.ui.theme.stockStatusTone

@Composable
fun ManagerDashboardScreen(
    ordersRepository: OrdersRepository,
    inventoryRepository: InventoryRepository,
    onOpenOrders: () -> Unit,
    onOpenInventory: () -> Unit,
    onOpenPurchases: () -> Unit,
    onOpenRecipes: () -> Unit,
    onOpenSales: () -> Unit,
    onOpenReports: () -> Unit,
    onBack: () -> Unit,
) {
    val viewModel: ManagerDashboardViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ManagerDashboardViewModel(ordersRepository, inventoryRepository) }
        }
    )

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                PenzaHero {
                    PenzaPill(text = "Penza · مدیریت")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "داشبورد", style = MaterialTheme.typography.headlineMedium)
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
                        item { OutlinedButton(onClick = onOpenOrders, shape = MaterialTheme.shapes.medium) { Text("درخواست‌های کافه") } }
                        item { OutlinedButton(onClick = onOpenInventory, shape = MaterialTheme.shapes.medium) { Text("موجودی انبار") } }
                        item { OutlinedButton(onClick = onOpenReports, shape = MaterialTheme.shapes.medium) { Text("گزارش دوره‌ای") } }
                        item { OutlinedButton(onClick = onOpenRecipes, shape = MaterialTheme.shapes.medium) { Text("رسپی‌ها") } }
                        item { OutlinedButton(onClick = onOpenSales, shape = MaterialTheme.shapes.medium) { Text("فروش و تحلیل") } }
                        item { OutlinedButton(onClick = onOpenPurchases, shape = MaterialTheme.shapes.medium) { Text("خریدهای روزانه") } }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = onBack) { Text("بازگشت") }
                }
            }

            item {
                Text(text = "امروز", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onBackground)
            }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        PenzaStatCard(label = "درخواست‌های امروز", value = viewModel.todayNewOrdersCount().toString(), hint = "درخواست کالای ثبت‌شده امروز", modifier = Modifier.weight(1f))
                        PenzaStatCard(label = "تحویل‌های امروز", value = viewModel.todayDeliveredOrdersCount().toString(), hint = "ارسال یا تایید شده امروز", modifier = Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        PenzaStatCard(label = "گردش کالای امروز", value = viewModel.todayMovementsCount().toString(), hint = "ثبت ورود/خروج/اصلاح امروز", modifier = Modifier.weight(1f))
                        PenzaStatCard(label = "کالای کم‌موجود", value = viewModel.lowStockRows().size.toString(), hint = "زیر حد مجاز تعریف‌شده در انبار", modifier = Modifier.weight(1f))
                    }
                }
            }

            item {
                PenzaCard {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "آخرین درخواست‌ها", style = MaterialTheme.typography.titleMedium)
                        TextButton(onClick = onOpenOrders) { Text("جزئیات") }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    val recentOrders = viewModel.recentOrders()
                    if (recentOrders.isEmpty()) {
                        Text(text = "هنوز درخواستی ثبت نشده است.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                    }
                    recentOrders.forEach { order ->
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(text = "#${order.id.takeLast(6)} · ${order.requestedBy}", style = MaterialTheme.typography.bodyMedium)
                            PenzaStatusBadge(text = orderStatusLabel(order.status), tone = if (isDeliveredStatus(order.status)) PenzaTone.GREEN else PenzaTone.NEUTRAL)
                        }
                    }
                }
            }

            item {
                PenzaCard {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "کالاهای کم‌موجود", style = MaterialTheme.typography.titleMedium)
                        TextButton(onClick = onOpenInventory) { Text("موجودی انبار") }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    val lowStock = viewModel.lowStockRows().take(6)
                    if (lowStock.isEmpty()) {
                        Text(text = "همه کالاها در سطح موجودی مناسب هستند.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                    }
                    lowStock.forEach { row ->
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text(text = row.product.name, style = MaterialTheme.typography.bodyMedium)
                                Text(
                                    text = ProductUnits.formatStockQuantity(row.product, row.inventoryItem?.currentQuantity ?: 0.0),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = PenzaMuted,
                                )
                            }
                            PenzaStatusBadge(text = ProductUnits.getStockStatusLabel(row.tier), tone = stockStatusTone(row.tier))
                        }
                    }
                }
            }

            item {
                PenzaCard {
                    Text(text = "آخرین گردش کالا", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(10.dp))
                    val recentMovements = viewModel.recentMovements()
                    if (recentMovements.isEmpty()) {
                        Text(text = "هنوز تغییری ثبت نشده است.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
                    }
                    recentMovements.forEach { movement ->
                        val product = viewModel.products.find { it.id == movement.productId }
                        val sign = if (movement.quantity > 0) "+" else ""
                        Text(text = product?.name ?: "کالا", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            text = "$sign${ProductUnits.formatNumber(movement.quantity)} ${ProductUnits.stockUnit(product)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = PenzaMuted,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}
