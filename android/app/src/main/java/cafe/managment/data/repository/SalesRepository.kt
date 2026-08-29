package cafe.managment.data.repository

import cafe.managment.data.model.SalesBatch
import cafe.managment.data.model.SalesItem
import cafe.managment.data.network.CreateSalesBatchRequest
import cafe.managment.data.network.RetrofitProvider
import cafe.managment.data.settings.AppSettingsRepository
import kotlinx.coroutines.flow.first
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class SalesRepository(private val settingsRepository: AppSettingsRepository) {

    private suspend fun api() = RetrofitProvider.get(settingsRepository.baseUrl.first())

    suspend fun getSales(from: String? = null, to: String? = null): List<SalesBatch> =
        api().getSales(from, to).batches

    suspend fun createSalesBatch(
        shiftDate: String,
        shiftLabel: String?,
        sourceType: String,
        sourceFileName: String?,
        importedBy: String?,
        items: List<SalesItem>,
    ): SalesBatch = api().createSalesBatch(
        CreateSalesBatchRequest(
            shiftDate = shiftDate,
            shiftLabel = shiftLabel,
            sourceType = sourceType,
            sourceFileName = sourceFileName,
            importedBy = importedBy,
            items = items,
        )
    ).batch

    /** Returns the extracted items, or throws with the server's Persian error message on failure. */
    suspend fun extractImage(bytes: ByteArray, fileName: String, mimeType: String): List<SalesItem> {
        val body = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
        val part = MultipartBody.Part.createFormData("file", fileName, body)
        val response = api().extractSalesImage(part)
        if (response.error != null) error(response.error)
        return response.items
    }
}
