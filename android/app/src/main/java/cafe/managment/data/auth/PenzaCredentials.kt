package cafe.managment.data.auth

import cafe.managment.data.settings.Role

/**
 * Mirrors staff-management-saas/lib/auth.ts. The web app has no server-side auth
 * endpoint yet (login is a client-side credential check against this same table),
 * so the mobile app checks on-device too, for now.
 */
object PenzaCredentials {

    private data class Credential(val username: String, val password: String)

    private val table: Map<Role, Credential> = mapOf(
        Role.MANAGER to Credential("manager", "manager123"),
        Role.STAFF to Credential("staff", "staff123"),
        Role.STORAGE to Credential("storage", "storage123"),
    )

    fun findRoleByCredentials(username: String, password: String): Role? {
        val normalized = username.trim()
        return table.entries.find { (_, credential) ->
            credential.username == normalized && credential.password == password
        }?.key
    }
}
