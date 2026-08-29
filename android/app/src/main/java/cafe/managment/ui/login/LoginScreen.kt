package cafe.managment.ui.login

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.settings.Role
import cafe.managment.ui.theme.PenzaBackground
import cafe.managment.ui.theme.PenzaCard
import cafe.managment.ui.theme.PenzaGreen
import cafe.managment.ui.theme.PenzaHero
import cafe.managment.ui.theme.PenzaPill

@Composable
fun LoginScreen(
    settingsRepository: AppSettingsRepository,
    onLoginSuccess: (Role) -> Unit,
    onOpenSettings: () -> Unit,
) {
    val viewModel: LoginViewModel = viewModel(
        factory = viewModelFactory {
            initializer { LoginViewModel(settingsRepository) }
        }
    )

    PenzaBackground {
        Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
            Column(modifier = Modifier.fillMaxWidth()) {
                PenzaHero {
                    PenzaPill(text = "Penza")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "ورود", style = MaterialTheme.typography.headlineMedium)

                    Spacer(modifier = Modifier.height(20.dp))
                    PenzaCard {
                        Column {
                            Text(text = "نام کاربری", style = MaterialTheme.typography.labelMedium)
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = viewModel.username,
                                onValueChange = viewModel::onUsernameChange,
                                shape = MaterialTheme.shapes.medium,
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )

                            Spacer(modifier = Modifier.height(12.dp))
                            Text(text = "رمز عبور", style = MaterialTheme.typography.labelMedium)
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = viewModel.password,
                                onValueChange = viewModel::onPasswordChange,
                                visualTransformation = PasswordVisualTransformation(),
                                shape = MaterialTheme.shapes.medium,
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PenzaGreen),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )

                            viewModel.errorMessage?.let { message ->
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = message,
                                    color = MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { viewModel.login(onLoginSuccess) },
                                shape = MaterialTheme.shapes.medium,
                                colors = ButtonDefaults.buttonColors(containerColor = PenzaGreen),
                                modifier = Modifier.fillMaxWidth().height(50.dp),
                            ) {
                                Text("ورود", style = MaterialTheme.typography.labelLarge)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    TextButton(onClick = onOpenSettings, modifier = Modifier.fillMaxWidth()) {
                        Text("تنظیمات آدرس سرور")
                    }
                }
            }
        }
    }
}
