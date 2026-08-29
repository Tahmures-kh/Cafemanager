package cafe.managment.ui.login

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.auth.PenzaCredentials
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.settings.Role
import kotlinx.coroutines.launch

class LoginViewModel(private val settingsRepository: AppSettingsRepository) : ViewModel() {

    var username by mutableStateOf("")
        private set

    var password by mutableStateOf("")
        private set

    var errorMessage by mutableStateOf<String?>(null)
        private set

    fun onUsernameChange(value: String) {
        username = value
        errorMessage = null
    }

    fun onPasswordChange(value: String) {
        password = value
        errorMessage = null
    }

    fun login(onSuccess: (Role) -> Unit) {
        val role = PenzaCredentials.findRoleByCredentials(username, password)
        if (role == null) {
            errorMessage = "نام کاربری یا رمز عبور اشتباه است."
            return
        }
        viewModelScope.launch {
            settingsRepository.setActiveRole(role)
            onSuccess(role)
        }
    }
}
