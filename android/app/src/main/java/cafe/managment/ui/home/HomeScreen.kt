package cafe.managment.ui.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import cafe.managment.data.settings.Role
import cafe.managment.ui.theme.PenzaBackground
import cafe.managment.ui.theme.PenzaBorder
import cafe.managment.ui.theme.PenzaError
import cafe.managment.ui.theme.PenzaGreenDeep
import cafe.managment.ui.theme.PenzaHero
import cafe.managment.ui.theme.PenzaPill

private data class HomeAction(
    val title: String,
    val eyebrow: String,
    val onClick: () -> Unit,
)

@Composable
fun HomeScreen(
    role: Role,
    onOpenPurchases: () -> Unit,
    onOpenRecipes: () -> Unit,
    onOpenSales: () -> Unit,
    onOpenManagerDashboard: () -> Unit,
    onOpenManagerOrders: () -> Unit,
    onOpenStaffRequest: () -> Unit,
    onOpenStaffOrders: () -> Unit,
    onOpenInventory: () -> Unit,
    onOpenStorageOrders: () -> Unit,
    onOpenManagerReports: () -> Unit,
    onOpenStorageReports: () -> Unit,
    onLogout: () -> Unit,
) {
    val actions = buildList {
        if (role == Role.MANAGER) {
            add(HomeAction(title = "داشبورد", eyebrow = "نمای کلی امروز", onClick = onOpenManagerDashboard))
            add(HomeAction(title = "درخواست‌های کافه", eyebrow = "پیگیری درخواست انبار", onClick = onOpenManagerOrders))
            add(HomeAction(title = "خریدهای روزانه", eyebrow = "فروشنده‌ها و سفارش", onClick = onOpenPurchases))
            add(HomeAction(title = "رسپی‌ها", eyebrow = "مواد اولیه و مقدار", onClick = onOpenRecipes))
            add(HomeAction(title = "فروش و تحلیل", eyebrow = "پایان شیفت", onClick = onOpenSales))
            add(HomeAction(title = "گزارش دوره‌ای", eyebrow = "خروجی و خلاصه بازه", onClick = onOpenManagerReports))
        }
        if (role == Role.STAFF) {
            add(HomeAction(title = "ثبت درخواست", eyebrow = "درخواست کالا از انبار", onClick = onOpenStaffRequest))
            add(HomeAction(title = "پیگیری درخواست‌ها", eyebrow = "وضعیت تحویل", onClick = onOpenStaffOrders))
        }
        if (role == Role.STORAGE) {
            add(HomeAction(title = "موجودی انبار", eyebrow = "مدیریت کالا و اصلاح موجودی", onClick = onOpenInventory))
            add(HomeAction(title = "درخواست‌های کافه", eyebrow = "آماده‌سازی و تحویل", onClick = onOpenStorageOrders))
            add(HomeAction(title = "گزارش دوره‌ای", eyebrow = "خروجی و خلاصه بازه", onClick = onOpenStorageReports))
        }
    }

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            item {
                PenzaHero {
                    PenzaPill(text = "Penza · ${role.label}")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "خوش آمدید", style = MaterialTheme.typography.headlineMedium)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "نقش: ${role.label}", style = MaterialTheme.typography.bodyMedium)

                    Spacer(modifier = Modifier.height(20.dp))
                    OutlinedButton(
                        onClick = onLogout,
                        border = BorderStroke(1.dp, PenzaBorder),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = PenzaError),
                    ) {
                        Text("خروج", style = MaterialTheme.typography.labelLarge)
                    }
                }
            }

            items(actions) { action ->
                Card(
                    onClick = action.onClick,
                    shape = MaterialTheme.shapes.large,
                    colors = CardDefaults.cardColors(containerColor = Color.White, contentColor = cafe.managment.ui.theme.PenzaForeground),
                    border = BorderStroke(1.dp, PenzaBorder),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = action.eyebrow,
                            style = MaterialTheme.typography.labelMedium,
                            color = PenzaGreenDeep,
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = action.title, style = MaterialTheme.typography.titleLarge)
                    }
                }
            }
        }
    }
}
