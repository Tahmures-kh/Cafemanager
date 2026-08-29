package cafe.managment.data.util

import cafe.managment.data.model.InventoryItem
import cafe.managment.data.model.Product
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.round

/** Kotlin port of staff-management-saas/lib/product-units.ts — keep in sync with that file. */
object ProductUnits {

    private val numberFormat: NumberFormat = NumberFormat.getNumberInstance(Locale.US).apply {
        maximumFractionDigits = 3
        isGroupingUsed = true
    }

    fun stockUnit(product: Product?): String =
        product?.stockUnit?.trim()?.takeIf { it.isNotEmpty() }
            ?: product?.unit?.trim()?.takeIf { it.isNotEmpty() }
            ?: "واحد"

    fun orderUnit(product: Product?): String =
        product?.orderUnit?.trim()?.takeIf { it.isNotEmpty() } ?: stockUnit(product)

    fun orderUnitQuantity(product: Product?): Double {
        val value = product?.orderUnitQuantity ?: 1.0
        return if (value.isFinite() && value > 0) value else 1.0
    }

    fun orderQuantityStep(product: Product?): Double {
        val value = product?.orderQuantityStep ?: 0.001
        return if (value.isFinite() && value > 0) value else 0.001
    }

    fun orderToStockQuantity(product: Product?, orderQuantity: Double): Double {
        val safeQuantity = if (orderQuantity.isFinite()) max(0.0, orderQuantity) else 0.0
        return round(safeQuantity * orderUnitQuantity(product) * 1000) / 1000
    }

    fun stockToOrderQuantity(product: Product?, stockQuantity: Double): Double {
        val safeQuantity = if (stockQuantity.isFinite()) max(0.0, stockQuantity) else 0.0
        val rawOrderQuantity = safeQuantity / orderUnitQuantity(product)
        val step = orderQuantityStep(product)
        return floor(rawOrderQuantity / step) * step
    }

    fun normalizeOrderQuantity(product: Product?, quantity: Double): Double {
        val safeQuantity = if (quantity.isFinite()) max(0.0, quantity) else 0.0
        val step = orderQuantityStep(product)
        val normalized = if (step >= 1) {
            floor(safeQuantity / step) * step
        } else {
            round(safeQuantity / step) * step
        }
        return round(normalized * 1000) / 1000
    }

    fun formatNumber(value: Double): String = numberFormat.format(value)

    fun formatStockQuantity(product: Product?, quantity: Double): String =
        "${formatNumber(quantity)} ${stockUnit(product)}"

    fun formatOrderQuantity(product: Product?, quantity: Double): String =
        "${formatNumber(quantity)} ${orderUnit(product)}"

    fun formatUnitConversion(product: Product?): String {
        val quantity = orderUnitQuantity(product)
        val order = orderUnit(product)
        val stock = stockUnit(product)
        if (order == stock && quantity == 1.0) return stock
        return "1 $order = ${formatNumber(quantity)} $stock"
    }

    fun hasUnitConversion(product: Product?): Boolean =
        orderUnit(product) != stockUnit(product) || orderUnitQuantity(product) != 1.0

    fun getOrderRemainder(product: Product?, stockQuantity: Double): Double {
        val safeQuantity = if (stockQuantity.isFinite()) max(0.0, stockQuantity) else 0.0
        val wholeOrderUnits = stockToOrderQuantity(product, safeQuantity)
        val consumedStock = orderToStockQuantity(product, wholeOrderUnits)
        return max(0.0, round((safeQuantity - consumedStock) * 1000) / 1000)
    }

    fun formatAvailableQuantity(product: Product?, stockQuantity: Double): String {
        val orderQuantity = stockToOrderQuantity(product, stockQuantity)
        val base = formatOrderQuantity(product, orderQuantity)
        if (!hasUnitConversion(product)) return base

        val remainder = getOrderRemainder(product, stockQuantity)
        if (remainder <= 0) return base

        return "$base (${formatStockQuantity(product, remainder)} باقیمانده)"
    }

    enum class StockStatusTier { OUT, CRITICAL, LOW, OK }

    fun getStockStatus(product: Product?, inventoryItem: InventoryItem?): StockStatusTier {
        val quantity = inventoryItem?.currentQuantity ?: 0.0
        val availableOrderQuantity = stockToOrderQuantity(product, quantity)

        return when {
            availableOrderQuantity <= 0 -> StockStatusTier.OUT
            quantity <= (inventoryItem?.criticalQuantity ?: 0.0) -> StockStatusTier.CRITICAL
            quantity <= (inventoryItem?.minimumQuantity ?: 0.0) -> StockStatusTier.LOW
            else -> StockStatusTier.OK
        }
    }

    fun getStockStatusLabel(tier: StockStatusTier): String = when (tier) {
        StockStatusTier.OUT -> "ناموجود"
        StockStatusTier.CRITICAL -> "موجودی بحرانی"
        StockStatusTier.LOW -> "موجودی کم"
        StockStatusTier.OK -> "موجود"
    }
}
