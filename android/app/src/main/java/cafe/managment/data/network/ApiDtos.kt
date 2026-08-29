package cafe.managment.data.network

import cafe.managment.data.model.AuditLogEntry
import cafe.managment.data.model.CafeOrder
import cafe.managment.data.model.ExchangeRateValues
import cafe.managment.data.model.IngredientPrice
import cafe.managment.data.model.InventoryItem
import cafe.managment.data.model.OrderItem
import cafe.managment.data.model.Product
import cafe.managment.data.model.PurchaseOrder
import cafe.managment.data.model.PurchaseOrderItem
import cafe.managment.data.model.Recipe
import cafe.managment.data.model.RecipeIngredient
import cafe.managment.data.model.SalesBatch
import cafe.managment.data.model.SalesItem
import cafe.managment.data.model.StockMovement
import cafe.managment.data.model.Supplier
import kotlinx.serialization.Serializable

// ---- Response envelopes (mirror the { key: ... } shape every route returns) ----

@Serializable
data class PurchasesResponse(val orders: List<PurchaseOrder> = emptyList())

@Serializable
data class PurchaseResponse(val order: PurchaseOrder, val smsError: String? = null)

@Serializable
data class SuppliersResponse(val suppliers: List<Supplier> = emptyList())

@Serializable
data class SupplierResponse(val supplier: Supplier)

@Serializable
data class RecipesResponse(val recipes: List<Recipe> = emptyList())

@Serializable
data class RecipeResponse(val recipe: Recipe)

@Serializable
data class SalesBatchesResponse(val batches: List<SalesBatch> = emptyList())

@Serializable
data class SalesBatchResponse(val batch: SalesBatch)

@Serializable
data class SalesImageExtractionResponse(val items: List<SalesItem> = emptyList(), val error: String? = null)

@Serializable
data class ExchangeRatesResponse(
    val configured: Boolean,
    val rates: ExchangeRateValues? = null,
    val fetchedAt: String? = null,
)

@Serializable
data class IngredientPricesResponse(val prices: List<IngredientPrice> = emptyList())

@Serializable
data class AuditEntriesResponse(val entries: List<AuditLogEntry> = emptyList())

@Serializable
data class AuditEntryResponse(val entry: AuditLogEntry)

@Serializable
data class SuccessResponse(val success: Boolean = true)

@Serializable
data class ErrorResponse(val error: String? = null)

// ---- Request bodies ----

@Serializable
data class SupplierRequest(
    val name: String,
    val phone: String,
    val website: String? = null,
    val notes: String? = null,
)

@Serializable
data class CreatePurchaseRequest(
    val supplierId: String,
    val items: List<PurchaseOrderItem>,
    val createdBy: String? = null,
)

@Serializable
data class UpdatePurchaseRequest(
    val status: String? = null,
    val resendSms: Boolean? = null,
)

@Serializable
data class RecipeRequest(
    val name: String,
    val category: String? = null,
    val ingredients: List<RecipeIngredient>,
)

@Serializable
data class ImportRecipesRequest(val recipes: List<RecipeRequest>)

@Serializable
data class CreateSalesBatchRequest(
    val shiftDate: String,
    val shiftLabel: String? = null,
    val sourceType: String,
    val sourceFileName: String? = null,
    val importedBy: String? = null,
    val items: List<SalesItem>,
)

@Serializable
data class IngredientPriceRequest(
    val productId: String,
    val unitPrice: Double,
    val productName: String? = null,
    val stockUnit: String? = null,
)

@Serializable
data class AuditRequest(
    val scope: String,
    val action: String,
    val description: String? = null,
    val actorRole: String? = null,
    val actorName: String? = null,
)

// ---- Inventory ----

@Serializable
data class InventoryResponse(
    val products: List<Product> = emptyList(),
    val inventoryItems: List<InventoryItem> = emptyList(),
    val movements: List<StockMovement> = emptyList(),
)

@Serializable
data class InventoryProductResponse(val product: Product, val inventoryItem: InventoryItem)

@Serializable
data class InventoryAdjustResponse(val inventoryItem: InventoryItem, val movement: StockMovement)

@Serializable
data class InventoryProductRequest(
    val name: String,
    val category: String,
    val unit: String,
    val stockUnit: String? = null,
    val orderUnit: String? = null,
    val orderUnitQuantity: Double? = null,
    val orderQuantityStep: Double? = null,
    val currentQuantity: Double = 0.0,
    val minimumQuantity: Double? = null,
    val criticalQuantity: Double? = null,
    val correctionReason: String? = null,
    val createdBy: String? = null,
)

@Serializable
data class AdjustInventoryRequest(
    val deltaQuantity: Double,
    val reason: String? = null,
    val createdBy: String? = null,
)

// ---- Orders ----

@Serializable
data class OrdersResponse(val orders: List<CafeOrder> = emptyList(), val items: List<OrderItem> = emptyList())

@Serializable
data class OrderResponse(val order: CafeOrder, val items: List<OrderItem> = emptyList())

@Serializable
data class OrderItemResponse(val item: OrderItem)

@Serializable
data class CreateOrderItemRequest(val productId: String, val requestedQuantity: Double)

@Serializable
data class CreateOrderRequest(
    val requestedBy: String,
    val note: String? = null,
    val items: List<CreateOrderItemRequest>,
)

@Serializable
data class UpdateOrderRequest(
    val status: String? = null,
    val createdBy: String? = null,
    val fillRequested: Boolean? = null,
)

@Serializable
data class UpdatePackedQuantityRequest(val packedQuantity: Double)
