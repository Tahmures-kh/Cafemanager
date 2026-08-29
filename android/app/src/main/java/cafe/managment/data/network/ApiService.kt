package cafe.managment.data.network

import okhttp3.MultipartBody
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Mirrors the routes under staff-management-saas's app/api directory.
 * Base URL is runtime-configurable — see [RetrofitProvider].
 */
interface ApiService {

    // Purchases
    @GET("api/purchases")
    suspend fun getPurchases(): PurchasesResponse

    @POST("api/purchases")
    suspend fun createPurchase(@Body body: CreatePurchaseRequest): PurchaseResponse

    @PATCH("api/purchases/{id}")
    suspend fun updatePurchase(@Path("id") id: String, @Body body: UpdatePurchaseRequest): PurchaseResponse

    @DELETE("api/purchases/{id}")
    suspend fun deletePurchase(@Path("id") id: String): SuccessResponse

    // Suppliers
    @GET("api/suppliers")
    suspend fun getSuppliers(): SuppliersResponse

    @POST("api/suppliers")
    suspend fun createSupplier(@Body body: SupplierRequest): SupplierResponse

    @PATCH("api/suppliers/{id}")
    suspend fun updateSupplier(@Path("id") id: String, @Body body: SupplierRequest): SupplierResponse

    @DELETE("api/suppliers/{id}")
    suspend fun deleteSupplier(@Path("id") id: String): SuccessResponse

    // Recipes
    @GET("api/recipes")
    suspend fun getRecipes(): RecipesResponse

    @POST("api/recipes")
    suspend fun createRecipe(@Body body: RecipeRequest): RecipeResponse

    @PATCH("api/recipes/{id}")
    suspend fun updateRecipe(@Path("id") id: String, @Body body: RecipeRequest): RecipeResponse

    @DELETE("api/recipes/{id}")
    suspend fun deleteRecipe(@Path("id") id: String): SuccessResponse

    @POST("api/recipes/import")
    suspend fun importRecipes(@Body body: ImportRecipesRequest): RecipesResponse

    // Sales
    @GET("api/sales")
    suspend fun getSales(@Query("from") from: String? = null, @Query("to") to: String? = null): SalesBatchesResponse

    @POST("api/sales")
    suspend fun createSalesBatch(@Body body: CreateSalesBatchRequest): SalesBatchResponse

    @Multipart
    @POST("api/sales/extract-image")
    suspend fun extractSalesImage(@Part file: MultipartBody.Part): SalesImageExtractionResponse

    // Exchange rates
    @GET("api/exchange-rates")
    suspend fun getExchangeRates(): ExchangeRatesResponse

    // Ingredient prices
    @GET("api/ingredient-prices")
    suspend fun getIngredientPrices(): IngredientPricesResponse

    @PUT("api/ingredient-prices")
    suspend fun putIngredientPrice(@Body body: IngredientPriceRequest): SuccessResponse

    // Audit
    @GET("api/audit")
    suspend fun getAuditEntries(@Query("scope") scope: String? = null): AuditEntriesResponse

    @POST("api/audit")
    suspend fun postAuditEntry(@Body body: AuditRequest): AuditEntryResponse

    // Inventory
    @GET("api/inventory")
    suspend fun getInventory(@Query("limit") limit: Int? = null): InventoryResponse

    @POST("api/inventory")
    suspend fun createInventoryProduct(@Body body: InventoryProductRequest): InventoryProductResponse

    @PATCH("api/inventory/{productId}")
    suspend fun updateInventoryProduct(@Path("productId") productId: String, @Body body: InventoryProductRequest): InventoryProductResponse

    @DELETE("api/inventory/{productId}")
    suspend fun deleteInventoryProduct(@Path("productId") productId: String): SuccessResponse

    @POST("api/inventory/{productId}/adjust")
    suspend fun adjustInventoryProduct(@Path("productId") productId: String, @Body body: AdjustInventoryRequest): InventoryAdjustResponse

    // Orders
    @GET("api/orders")
    suspend fun getOrders(): OrdersResponse

    @POST("api/orders")
    suspend fun createOrder(@Body body: CreateOrderRequest): OrderResponse

    @PATCH("api/orders/{id}")
    suspend fun updateOrder(@Path("id") id: String, @Body body: UpdateOrderRequest): OrderResponse

    @PATCH("api/orders/{id}/items/{itemId}")
    suspend fun updatePackedQuantity(
        @Path("id") id: String,
        @Path("itemId") itemId: String,
        @Body body: UpdatePackedQuantityRequest,
    ): OrderItemResponse
}
