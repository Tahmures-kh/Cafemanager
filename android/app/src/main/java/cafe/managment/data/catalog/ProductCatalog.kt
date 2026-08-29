package cafe.managment.data.catalog

import android.content.Context
import cafe.managment.data.model.Product
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json

/**
 * The product catalog has no live API (only a static array in the web's lib/mock-data.ts),
 * so it's bundled here as assets/products.json and loaded once. Used as the picker source
 * for Purchase order items and Recipe ingredients, which both require a real productId.
 */
class ProductCatalog(private val context: Context) {

    private var cached: List<Product>? = null

    suspend fun all(): List<Product> {
        cached?.let { return it }

        return withContext(Dispatchers.IO) {
            val text = context.assets.open("products.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
            val parsed = json.decodeFromString<List<Product>>(text)
            cached = parsed
            parsed
        }
    }

    private companion object {
        val json = Json { ignoreUnknownKeys = true }
    }

    suspend fun findByName(name: String): Product? {
        val normalized = name.trim().lowercase()
        return all().find { it.name.trim().lowercase() == normalized }
    }
}
