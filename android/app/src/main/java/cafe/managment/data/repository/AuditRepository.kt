package cafe.managment.data.repository

import cafe.managment.data.model.AuditLogEntry
import cafe.managment.data.network.AuditRequest
import cafe.managment.data.network.RetrofitProvider
import cafe.managment.data.settings.AppSettingsRepository
import kotlinx.coroutines.flow.first

class AuditRepository(private val settingsRepository: AppSettingsRepository) {

    private suspend fun api() = RetrofitProvider.get(settingsRepository.baseUrl.first())

    suspend fun getEntries(scope: String): List<AuditLogEntry> =
        runCatching { api().getAuditEntries(scope).entries }.getOrDefault(emptyList())

    /** Best-effort: mirrors the web's logAuditEvent — a logging failure must never block the caller's real action. */
    suspend fun logEvent(scope: String, action: String, description: String, actorRole: String?, actorName: String?) {
        runCatching {
            api().postAuditEntry(
                AuditRequest(scope = scope, action = action, description = description, actorRole = actorRole, actorName = actorName)
            )
        }
    }
}
