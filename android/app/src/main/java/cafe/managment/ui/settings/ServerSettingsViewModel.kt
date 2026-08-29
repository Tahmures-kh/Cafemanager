package cafe.managment.ui.settings

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cafe.managment.data.settings.AppSettingsRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class ServerSettingsViewModel(private val settingsRepository: AppSettingsRepository) : ViewModel() {

    var urlInput by mutableStateOf("")
        private set

    var justSaved by mutableStateOf(false)
        private set

    init {
        viewModelScope.launch {
            urlInput = settingsRepository.baseUrl.first()
        }
    }

    fun onUrlChange(value: String) {
        urlInput = value
        justSaved = false
    }

    fun save() {
        viewModelScope.launch {
            settingsRepository.setBaseUrl(urlInput)
            justSaved = true
        }
    }

    fun resetToDefault() {
        onUrlChange(AppSettingsRepository.DEFAULT_BASE_URL)
    }
}
