package cafe.managment.data.settings

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "app_settings")

/**
 * Persists the two bits of local app state: which server to talk to (no real
 * hosting exists yet, so this is user-editable and changes often) and which
 * role is currently active (mirrors the web app's role-session.ts, which uses
 * localStorage instead of a real server session).
 */
class AppSettingsRepository(private val context: Context) {

    private object Keys {
        val BASE_URL = stringPreferencesKey("base_url")
        val ACTIVE_ROLE = stringPreferencesKey("active_role")
        val ACTOR_NAME = stringPreferencesKey("actor_name")
    }

    val baseUrl: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[Keys.BASE_URL] ?: DEFAULT_BASE_URL
    }

    suspend fun setBaseUrl(url: String) {
        context.dataStore.edit { prefs -> prefs[Keys.BASE_URL] = url }
    }

    val activeRole: Flow<Role?> = context.dataStore.data.map { prefs ->
        Role.fromValue(prefs[Keys.ACTIVE_ROLE])
    }

    suspend fun setActiveRole(role: Role?) {
        context.dataStore.edit { prefs ->
            if (role == null) prefs.remove(Keys.ACTIVE_ROLE) else prefs[Keys.ACTIVE_ROLE] = role.value
        }
    }

    /** Mirrors the web's lib/actor-name.ts: a remembered "who is doing this" display name, since there's no real user-account system yet. */
    val actorName: Flow<String?> = context.dataStore.data.map { prefs -> prefs[Keys.ACTOR_NAME] }

    suspend fun setActorName(name: String) {
        val trimmed = name.trim()
        if (trimmed.isEmpty()) return
        context.dataStore.edit { prefs -> prefs[Keys.ACTOR_NAME] = trimmed }
    }

    companion object {
        // Reaches the host machine's `next dev` server from the Android emulator.
        // For a physical phone on the same WiFi, change this to the PC's LAN IP from the Settings screen.
        const val DEFAULT_BASE_URL = "http://10.0.2.2:3000/"
    }
}
