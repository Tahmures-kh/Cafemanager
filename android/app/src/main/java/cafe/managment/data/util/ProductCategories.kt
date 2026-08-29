package cafe.managment.data.util

/** Mirrors staff-management-saas's categoryOptions (used on both storage/dashboard and staff/request). */
object ProductCategories {
    val all: List<Pair<String, String>> = listOf(
        "coffee" to "قهوه",
        "dairy" to "لبنیات",
        "packaging" to "بسته‌بندی",
        "bakery" to "نان و شیرینی",
        "syrup" to "سیروپ",
        "cleaning" to "نظافت",
        "other" to "متفرقه",
    )

    fun label(category: String): String = all.find { it.first == category }?.second ?: "متفرقه"
}
