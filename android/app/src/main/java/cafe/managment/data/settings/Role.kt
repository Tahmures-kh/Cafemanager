package cafe.managment.data.settings

/** Mirrors PenzaRole / getRoleLabel in staff-management-saas/lib/role-session.ts */
enum class Role(val value: String, val label: String) {
    MANAGER("manager", "مدیر"),
    STAFF("staff", "کاربر کافه"),
    STORAGE("storage", "انباردار");

    companion object {
        fun fromValue(value: String?): Role? = entries.find { it.value == value }
    }
}
