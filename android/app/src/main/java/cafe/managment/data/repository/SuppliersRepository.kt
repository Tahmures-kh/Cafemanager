package cafe.managment.data.repository

import cafe.managment.data.model.Supplier
import cafe.managment.data.network.RetrofitProvider
import cafe.managment.data.network.SupplierRequest
import cafe.managment.data.settings.AppSettingsRepository
import kotlinx.coroutines.flow.first

class SuppliersRepository(private val settingsRepository: AppSettingsRepository) {

    private suspend fun api() = RetrofitProvider.get(settingsRepository.baseUrl.first())

    suspend fun getSuppliers(): List<Supplier> = api().getSuppliers().suppliers

    suspend fun createSupplier(name: String, phone: String, website: String?, notes: String?): Supplier =
        api().createSupplier(SupplierRequest(name = name, phone = phone, website = website, notes = notes)).supplier

    suspend fun updateSupplier(id: String, name: String, phone: String, website: String?, notes: String?): Supplier =
        api().updateSupplier(id, SupplierRequest(name = name, phone = phone, website = website, notes = notes)).supplier

    suspend fun deleteSupplier(id: String) {
        api().deleteSupplier(id)
    }
}
