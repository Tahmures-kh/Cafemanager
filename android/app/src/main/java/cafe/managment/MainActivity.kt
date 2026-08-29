package cafe.managment

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import cafe.managment.ui.theme.PenzaTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.unit.LayoutDirection
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import cafe.managment.data.catalog.ProductCatalog
import cafe.managment.data.repository.AuditRepository
import cafe.managment.data.repository.InventoryRepository
import cafe.managment.data.repository.OrdersRepository
import cafe.managment.data.repository.PricingRepository
import cafe.managment.data.repository.PurchasesRepository
import cafe.managment.data.repository.RecipesRepository
import cafe.managment.data.repository.SalesRepository
import cafe.managment.data.repository.SuppliersRepository
import cafe.managment.data.settings.AppSettingsRepository
import cafe.managment.data.settings.Role
import cafe.managment.ui.home.HomeScreen
import cafe.managment.ui.inventory.InventoryScreen
import cafe.managment.ui.login.LoginScreen
import cafe.managment.ui.managerdashboard.ManagerDashboardScreen
import cafe.managment.ui.managerinventory.ManagerInventoryScreen
import cafe.managment.ui.managerorders.ManagerOrdersScreen
import cafe.managment.ui.purchases.PurchasesScreen
import cafe.managment.ui.recipes.RecipesScreen
import cafe.managment.ui.report.PeriodReportScreen
import cafe.managment.ui.sales.SalesScreen
import cafe.managment.ui.settings.ServerSettingsScreen
import cafe.managment.ui.stafforders.StaffOrdersScreen
import cafe.managment.ui.staffrequest.StaffRequestScreen
import cafe.managment.ui.storageorders.StorageOrdersScreen
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PenzaTheme {
                CompositionLocalProvider(androidx.compose.ui.platform.LocalLayoutDirection provides LayoutDirection.Rtl) {
                    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                        CafeManagmentApp()
                    }
                }
            }
        }
    }
}

private object Routes {
    const val LOGIN = "login"
    const val HOME = "home/{role}"
    const val SETTINGS = "settings"
    const val PURCHASES = "purchases"
    const val RECIPES = "recipes"
    const val SALES = "sales"
    const val MANAGER_DASHBOARD = "manager/dashboard"
    const val MANAGER_ORDERS = "manager/orders"
    const val MANAGER_INVENTORY = "manager/inventory"
    const val MANAGER_REPORTS = "manager/reports"
    const val STAFF_REQUEST = "staff/request"
    const val STAFF_ORDERS = "staff/orders"
    const val STORAGE_INVENTORY = "storage/inventory"
    const val STORAGE_ORDERS = "storage/orders"
    const val STORAGE_REPORTS = "storage/reports"
    fun home(role: Role) = "home/${role.value}"
}

@Composable
private fun CafeManagmentApp() {
    val context = LocalContext.current
    val settingsRepository = remember { AppSettingsRepository(context) }
    val suppliersRepository = remember { SuppliersRepository(settingsRepository) }
    val purchasesRepository = remember { PurchasesRepository(settingsRepository) }
    val recipesRepository = remember { RecipesRepository(settingsRepository) }
    val salesRepository = remember { SalesRepository(settingsRepository) }
    val auditRepository = remember { AuditRepository(settingsRepository) }
    val pricingRepository = remember { PricingRepository(settingsRepository) }
    val inventoryRepository = remember { InventoryRepository(settingsRepository) }
    val ordersRepository = remember { OrdersRepository(settingsRepository) }
    val productCatalog = remember { ProductCatalog(context) }
    val coroutineScope = rememberCoroutineScope()

    var startDestination by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) {
        val role = settingsRepository.activeRole.first()
        startDestination = if (role != null) Routes.home(role) else Routes.LOGIN
    }

    val destination = startDestination
    if (destination == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = destination) {
        composable(Routes.LOGIN) {
            LoginScreen(
                settingsRepository = settingsRepository,
                onLoginSuccess = { role ->
                    navController.navigate(Routes.home(role)) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
                onOpenSettings = { navController.navigate(Routes.SETTINGS) },
            )
        }
        composable(Routes.SETTINGS) {
            ServerSettingsScreen(
                settingsRepository = settingsRepository,
                onBack = { navController.popBackStack() },
            )
        }
        composable(
            route = Routes.HOME,
            arguments = listOf(navArgument("role") { type = NavType.StringType }),
        ) { backStackEntry ->
            val role = Role.fromValue(backStackEntry.arguments?.getString("role")) ?: Role.STAFF
            HomeScreen(
                role = role,
                onOpenPurchases = { navController.navigate(Routes.PURCHASES) },
                onOpenRecipes = { navController.navigate(Routes.RECIPES) },
                onOpenSales = { navController.navigate(Routes.SALES) },
                onOpenManagerDashboard = { navController.navigate(Routes.MANAGER_DASHBOARD) },
                onOpenManagerOrders = { navController.navigate(Routes.MANAGER_ORDERS) },
                onOpenStaffRequest = { navController.navigate(Routes.STAFF_REQUEST) },
                onOpenStaffOrders = { navController.navigate(Routes.STAFF_ORDERS) },
                onOpenInventory = { navController.navigate(Routes.STORAGE_INVENTORY) },
                onOpenStorageOrders = { navController.navigate(Routes.STORAGE_ORDERS) },
                onOpenManagerReports = { navController.navigate(Routes.MANAGER_REPORTS) },
                onOpenStorageReports = { navController.navigate(Routes.STORAGE_REPORTS) },
                onLogout = {
                    coroutineScope.launch {
                        settingsRepository.setActiveRole(null)
                        navController.navigate(Routes.LOGIN) {
                            popUpTo(navController.graph.id) { inclusive = true }
                        }
                    }
                },
            )
        }
        composable(Routes.PURCHASES) {
            PurchasesScreen(
                repository = purchasesRepository,
                suppliersRepository = suppliersRepository,
                auditRepository = auditRepository,
                settingsRepository = settingsRepository,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.RECIPES) {
            RecipesScreen(
                repository = recipesRepository,
                pricingRepository = pricingRepository,
                auditRepository = auditRepository,
                settingsRepository = settingsRepository,
                productCatalog = productCatalog,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.SALES) {
            SalesScreen(
                repository = salesRepository,
                recipesRepository = recipesRepository,
                auditRepository = auditRepository,
                settingsRepository = settingsRepository,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.MANAGER_DASHBOARD) {
            ManagerDashboardScreen(
                ordersRepository = ordersRepository,
                inventoryRepository = inventoryRepository,
                onOpenOrders = { navController.navigate(Routes.MANAGER_ORDERS) },
                onOpenInventory = { navController.navigate(Routes.MANAGER_INVENTORY) },
                onOpenPurchases = { navController.navigate(Routes.PURCHASES) },
                onOpenRecipes = { navController.navigate(Routes.RECIPES) },
                onOpenSales = { navController.navigate(Routes.SALES) },
                onOpenReports = { navController.navigate(Routes.MANAGER_REPORTS) },
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.MANAGER_ORDERS) {
            ManagerOrdersScreen(
                ordersRepository = ordersRepository,
                inventoryRepository = inventoryRepository,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.MANAGER_INVENTORY) {
            ManagerInventoryScreen(
                inventoryRepository = inventoryRepository,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.MANAGER_REPORTS) {
            PeriodReportScreen(
                role = Role.MANAGER,
                ordersRepository = ordersRepository,
                inventoryRepository = inventoryRepository,
                onOpenOrders = { navController.navigate(Routes.MANAGER_ORDERS) },
                onOpenWorkspace = { navController.navigate(Routes.MANAGER_INVENTORY) },
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.STAFF_REQUEST) {
            StaffRequestScreen(
                inventoryRepository = inventoryRepository,
                ordersRepository = ordersRepository,
                auditRepository = auditRepository,
                settingsRepository = settingsRepository,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.STAFF_ORDERS) {
            StaffOrdersScreen(
                ordersRepository = ordersRepository,
                inventoryRepository = inventoryRepository,
                auditRepository = auditRepository,
                settingsRepository = settingsRepository,
                onOpenRequest = { navController.navigate(Routes.STAFF_REQUEST) },
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.STORAGE_INVENTORY) {
            InventoryScreen(
                repository = inventoryRepository,
                auditRepository = auditRepository,
                settingsRepository = settingsRepository,
                onOpenOrders = { navController.navigate(Routes.STORAGE_ORDERS) },
                onOpenReports = { navController.navigate(Routes.STORAGE_REPORTS) },
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.STORAGE_ORDERS) {
            StorageOrdersScreen(
                ordersRepository = ordersRepository,
                inventoryRepository = inventoryRepository,
                auditRepository = auditRepository,
                settingsRepository = settingsRepository,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.STORAGE_REPORTS) {
            PeriodReportScreen(
                role = Role.STORAGE,
                ordersRepository = ordersRepository,
                inventoryRepository = inventoryRepository,
                onOpenOrders = { navController.navigate(Routes.STORAGE_ORDERS) },
                onOpenWorkspace = { navController.navigate(Routes.STORAGE_INVENTORY) },
                onBack = { navController.popBackStack() },
            )
        }
    }
}
