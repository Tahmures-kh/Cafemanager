package cafe.managment.ui.purchases

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import cafe.managment.data.model.Supplier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import cafe.managment.data.model.PurchaseOrder
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.PurchasesRepository
import cafe.managment.data.repository.SuppliersRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.ui.theme.PenzaAuditHistory
import cafe.managment.ui.theme.PenzaBackground
import cafe.managment.ui.theme.PenzaBorder
import cafe.managment.ui.theme.PenzaCard
import cafe.managment.ui.theme.PenzaGreen
import cafe.managment.ui.theme.PenzaGreenDeep
import cafe.managment.ui.theme.PenzaHero
import cafe.managment.ui.theme.PenzaMuted
import cafe.managment.ui.theme.PenzaPill
import cafe.managment.ui.theme.PenzaStatusBadge
import cafe.managment.ui.theme.PenzaTone

@Composable
fun PurchasesScreen(
    repository: PurchasesRepository,
    suppliersRepository: SuppliersRepository,
    auditRepository: AuditRepository,
    settingsRepository: AppSettingsRepository,
    onBack: () -> Unit,
) {
    val viewModel: PurchasesViewModel = viewModel(
        factory = viewModelFactory {
            initializer { PurchasesViewModel(repository, suppliersRepository, auditRepository, settingsRepository) }
        }
    )

    viewModel.pendingDeleteSupplier?.let { supplier ->
        AlertDialog(
            onDismissRequest = viewModel::cancelDeleteSupplier,
            title = { Text("حذف فروشنده؟") },
            text = { Text("«${supplier.name}» از لیست فروشنده‌ها حذف می‌شود.") },
            confirmButton = { TextButton(onClick = viewModel::confirmDeleteSupplier) { Text("حذف", color = MaterialTheme.colorScheme.error) } },
            dismissButton = { TextButton(onClick = viewModel::cancelDeleteSupplier) { Text("انصراف") } },
        )
    }

    PenzaBackground {
        LazyColumn(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item { SuppliersPanel(viewModel) }

            item {
                PenzaHero {
                    PenzaPill(text = "Penza · خریدهای روزانه")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "سفارش خرید جدید", style = MaterialTheme.typography.headlineMedium)

                    if (viewModel.isLoading) {
                        Spacer(modifier = Modifier.height(12.dp))
                        CircularProgressIndicator(color = PenzaGreen)
                    }

                    Spacer(modifier = Modifier.height(20.dp))
                    PenzaCard {
                        Column {
                            Text(text = "فروشنده", style = MaterialTheme.typography.labelMedium)
                            Spacer(modifier = Modifier.height(6.dp))
                            SupplierPicker(
                                suppliers = viewModel.suppliers,
                                selectedId = viewModel.selectedSupplierId,
                                onSelect = viewModel::selectSupplier,
                            )

                            Spacer(modifier = Modifier.height(16.dp))
                            Text(text = "اقلام سفارش", style = MaterialTheme.typography.labelMedium)
                            Spacer(modifier = Modifier.height(8.dp))
                            viewModel.items.forEachIndexed { index, draft ->
                                OrderItemRow(
                                    draft = draft,
                                    onProductNameChange = { value -> viewModel.updateItem(index) { it.copy(productName = value) } },
                                    onQuantityChange = { value -> viewModel.updateItem(index) { it.copy(quantity = value) } },
                                    onStockUnitChange = { value -> viewModel.updateItem(index) { it.copy(stockUnit = value) } },
                                    onRemove = { viewModel.removeItemRow(index) },
                                    canRemove = viewModel.items.size > 1,
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                            TextButton(onClick = viewModel::addItemRow) {
                                Text("+ افزودن ردیف کالا")
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "نام ثبت‌کننده", style = MaterialTheme.typography.labelMedium)
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = viewModel.actorName,
                                onValueChange = viewModel::onActorNameChange,
                                shape = MaterialTheme.shapes.medium,
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                                singleLine = true,
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

                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = viewModel::submitOrder,
                                enabled = !viewModel.submitting,
                                shape = MaterialTheme.shapes.medium,
                                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                                modifier = Modifier.fillMaxWidth().height(50.dp),
                            ) {
                                Text(if (viewModel.submitting) "در حال ثبت..." else "ثبت سفارش", style = MaterialTheme.typography.labelLarge)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
                                Text("بازگشت")
                            }
                        }
                    }
                }
            }

            item {
                Text(text = "سفارش‌های ثبت‌شده", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onBackground)
            }

            items(viewModel.orders, key = { it.id }) { order ->
                OrderRow(
                    order = order,
                    supplierName = viewModel.supplierName(order.supplierId),
                    onResendSms = { viewModel.resendSms(order) },
                )
            }

            if (viewModel.orders.isEmpty() && !viewModel.isLoading) {
                item {
                    PenzaCard {
                        Text(text = "هنوز سفارشی ثبت نشده است.", style = MaterialTheme.typography.bodyMedium, color = PenzaMuted)
                    }
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
private fun SuppliersPanel(viewModel: PurchasesViewModel) {
    PenzaCard {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = "فروشنده‌ها (${viewModel.suppliers.size})", style = MaterialTheme.typography.titleMedium)
            TextButton(onClick = viewModel::openNewSupplierForm) { Text("+ فروشنده جدید") }
        }

        Spacer(modifier = Modifier.height(10.dp))
        if (viewModel.suppliers.isEmpty()) {
            Text(text = "هنوز فروشنده‌ای ثبت نشده است.", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
        }
        viewModel.suppliers.forEach { supplier ->
            SupplierRow(
                supplier = supplier,
                onEdit = { viewModel.openEditSupplierForm(supplier) },
                onDelete = { viewModel.requestDeleteSupplier(supplier) },
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        if (viewModel.editingSupplierId != null) {
            Spacer(modifier = Modifier.height(8.dp))
            SupplierForm(viewModel)
        }
    }
}

@Composable
private fun SupplierRow(supplier: Supplier, onEdit: () -> Unit, onDelete: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, PenzaBorder, MaterialTheme.shapes.medium)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = supplier.name, style = MaterialTheme.typography.titleSmall)
            Text(text = supplier.phone, style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
            supplier.website?.takeIf { it.isNotBlank() }?.let {
                Text(text = it, style = MaterialTheme.typography.bodySmall, color = PenzaGreenDeep)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            TextButton(onClick = onEdit) { Text("ویرایش") }
            TextButton(onClick = onDelete) { Text("حذف", color = MaterialTheme.colorScheme.error) }
        }
    }
}

@Composable
private fun SupplierForm(viewModel: PurchasesViewModel) {
    val form = viewModel.supplierForm
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, PenzaBorder, MaterialTheme.shapes.medium)
            .padding(16.dp),
    ) {
        Text(
            text = if (viewModel.editingSupplierId == "new") "فروشنده جدید" else "ویرایش فروشنده",
            style = MaterialTheme.typography.titleSmall,
        )
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
            value = form.name,
            onValueChange = { value -> viewModel.onSupplierFormChange { it.copy(name = value) } },
            label = { Text("نام فروشنده") },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(8.dp))
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
            OutlinedTextField(
                value = form.phone,
                onValueChange = { value -> viewModel.onSupplierFormChange { it.copy(phone = value) } },
                label = { Text("شماره تماس") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
            OutlinedTextField(
                value = form.website,
                onValueChange = { value -> viewModel.onSupplierFormChange { it.copy(website = value) } },
                label = { Text("وبسایت (اختیاری)") },
                singleLine = true,
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = form.notes,
            onValueChange = { value -> viewModel.onSupplierFormChange { it.copy(notes = value) } },
            label = { Text("یادداشت (اختیاری)") },
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = viewModel::saveSupplier,
                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                shape = MaterialTheme.shapes.medium,
            ) { Text("ذخیره") }
            OutlinedButton(onClick = viewModel::cancelSupplierForm, shape = MaterialTheme.shapes.medium) { Text("انصراف") }
        }
    }
}

@Composable
private fun SupplierPicker(
    suppliers: List<cafe.managment.data.model.Supplier>,
    selectedId: String?,
    onSelect: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedLabel = suppliers.find { it.id == selectedId }?.name ?: "انتخاب فروشنده"

    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, PenzaBorder, MaterialTheme.shapes.medium)
                .clickable { expanded = true }
                .padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(text = selectedLabel, style = MaterialTheme.typography.bodyMedium)
            Text(text = "▾", color = PenzaGreenDeep)
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            if (suppliers.isEmpty()) {
                DropdownMenuItem(text = { Text("فروشنده‌ای ثبت نشده است") }, onClick = { expanded = false })
            }
            suppliers.forEach { supplier ->
                DropdownMenuItem(
                    text = { Text(supplier.name) },
                    onClick = {
                        onSelect(supplier.id)
                        expanded = false
                    },
                )
            }
        }
    }
}

@Composable
private fun OrderItemRow(
    draft: PurchaseItemDraft,
    onProductNameChange: (String) -> Unit,
    onQuantityChange: (String) -> Unit,
    onStockUnitChange: (String) -> Unit,
    onRemove: () -> Unit,
    canRemove: Boolean,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        OutlinedTextField(
            value = draft.productName,
            onValueChange = onProductNameChange,
            label = { Text("نام کالا") },
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            singleLine = true,
            modifier = Modifier.weight(1.4f),
        )
        OutlinedTextField(
            value = draft.quantity,
            onValueChange = onQuantityChange,
            label = { Text("مقدار") },
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            singleLine = true,
            modifier = Modifier.weight(0.8f),
        )
        OutlinedTextField(
            value = draft.stockUnit,
            onValueChange = onStockUnitChange,
            label = { Text("واحد") },
            shape = MaterialTheme.shapes.medium,
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
            singleLine = true,
            modifier = Modifier.weight(0.8f),
        )
        if (canRemove) {
            TextButton(onClick = onRemove) {
                Text("حذف", color = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
private fun OrderRow(order: PurchaseOrder, supplierName: String, onResendSms: () -> Unit) {
    PenzaCard {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text(text = "#${order.id.takeLast(6)} · $supplierName", style = MaterialTheme.typography.titleSmall)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "${order.items.size} قلم کالا · ${order.createdAt.take(10)}", style = MaterialTheme.typography.bodySmall, color = PenzaMuted)
            }
            Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
                PenzaStatusBadge(text = statusLabel(order.status), tone = statusTone(order.status))
                Spacer(modifier = Modifier.height(6.dp))
                PenzaStatusBadge(text = smsStatusLabel(order.smsStatus), tone = smsTone(order.smsStatus))
            }
        }
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedButton(onClick = onResendSms, modifier = Modifier.fillMaxWidth()) {
            Text("ارسال مجدد پیامک")
        }
    }
}

private fun statusLabel(status: String) = when (status) {
    "pending" -> "در انتظار"
    "sent" -> "ارسال شده"
    "received" -> "تحویل شد"
    "cancelled" -> "لغو شده"
    else -> status
}

private fun statusTone(status: String) = when (status) {
    "received" -> PenzaTone.GREEN
    "cancelled" -> PenzaTone.RED
    else -> PenzaTone.NEUTRAL
}

private fun smsStatusLabel(status: String) = when (status) {
    "pending" -> "در حال ارسال پیامک"
    "sent" -> "پیامک ارسال شد"
    "error" -> "خطای پیامک"
    "not_configured" -> "پیامک پیکربندی نشده"
    else -> status
}

private fun smsTone(status: String) = when (status) {
    "sent" -> PenzaTone.GREEN
    "error" -> PenzaTone.RED
    else -> PenzaTone.NEUTRAL
}
