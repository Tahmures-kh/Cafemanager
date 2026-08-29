package cafe.managment.data.model

import kotlinx.serialization.Serializable

@Serializable
data class AuditLogEntry(
    val id: String,
    val scope: String,
    val action: String,
    val description: String,
    // These are all optional server-side: the app logs events with a null actor
    // when no actor name is set, and ip/userAgent may be absent. Keep them nullable
    // so one anonymous entry doesn't fail the whole list's deserialization.
    val actorRole: String? = null,
    val actorName: String? = null,
    val ip: String? = null,
    val userAgent: String? = null,
    val createdAt: String,
)
