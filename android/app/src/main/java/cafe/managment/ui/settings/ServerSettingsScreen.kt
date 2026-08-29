package cafe.managment.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.ui.theme.PenzaBackground
import cafe.managment.ui.theme.PenzaCard
import cafe.managment.ui.theme.PenzaGreen
import cafe.managment.ui.theme.PenzaGreenDeep
import cafe.managment.ui.theme.PenzaHero
import cafe.managment.ui.theme.PenzaPill

@Composable
fun ServerSettingsScreen(
    settingsRepository: AppSettingsRepository,
    onBack: () -> Unit,
) {
    val viewModel: ServerSettingsViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ServerSettingsViewModel(settingsRepository) }
        }
    )

    PenzaBackground {
        Column(modifier = Modifier.fillMaxWidth().padding(20.dp)) {
            PenzaHero {
                PenzaPill(text = "Penza · تنظیمات")
                Spacer(modifier = Modifier.height(16.dp))
                Text(text = "آدرس سرور", style = MaterialTheme.typography.headlineMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "چون فعلاً هاست انلاینی وجود ندارد، آدرس سرور محلی (next dev) را اینجا وارد کنید. " +
                        "برای شبیه‌ساز از ۱۰.۰.۲.۲ و برای گوشی واقعی از آی‌پی همان وای‌فای استفاده کنید.",
                    style = MaterialTheme.typography.bodyMedium,
                )

                Spacer(modifier = Modifier.height(20.dp))
                PenzaCard {
                    Column {
                        Text(text = "Base URL", style = MaterialTheme.typography.labelMedium)
                        Spacer(modifier = Modifier.height(6.dp))
                        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                            OutlinedTextField(
                                value = viewModel.urlInput,
                                onValueChange = viewModel::onUrlChange,
                                shape = MaterialTheme.shapes.medium,
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                        }
                        if (viewModel.justSaved) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "ذخیره شد.", color = PenzaGreenDeep, style = MaterialTheme.typography.bodySmall)
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = viewModel::save,
                            shape = MaterialTheme.shapes.medium,
                            colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                            modifier = Modifier.fillMaxWidth().height(50.dp),
                        ) {
                            Text("ذخیره", style = MaterialTheme.typography.labelLarge)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        TextButton(onClick = viewModel::resetToDefault, modifier = Modifier.fillMaxWidth()) {
                            Text("بازگشت به مقدار پیش‌فرض (10.0.2.2)")
                        }
                        TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
                            Text("بازگشت")
                        }
                    }
                }
            }
        }
    }
}
