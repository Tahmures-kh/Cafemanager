package cafe.managment.data.network

import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory

/**
 * Builds (and caches) an [ApiService] pointed at a runtime-supplied base URL.
 *
 * There's no hosting yet — the user runs the Next.js backend locally and enters
 * whatever address reaches it (emulator loopback or LAN IP) via the settings screen.
 * Once real hosting exists, only the stored base URL needs to change.
 */
object RetrofitProvider {

    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    @Volatile
    private var cachedBaseUrl: String? = null

    @Volatile
    private var cachedService: ApiService? = null

    fun get(baseUrl: String): ApiService {
        val normalized = normalize(baseUrl)
        cachedService?.let { if (cachedBaseUrl == normalized) return it }

        synchronized(this) {
            cachedService?.let { if (cachedBaseUrl == normalized) return it }

            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
            val client = OkHttpClient.Builder()
                .addInterceptor(logging)
                .build()

            val retrofit = Retrofit.Builder()
                .baseUrl(normalized)
                .client(client)
                .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
                .build()

            val service = retrofit.create(ApiService::class.java)
            cachedBaseUrl = normalized
            cachedService = service
            return service
        }
    }

    private fun normalize(url: String): String {
        val trimmed = url.trim()
        return if (trimmed.endsWith("/")) trimmed else "$trimmed/"
    }
}
