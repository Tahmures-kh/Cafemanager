export type UserRole = "owner" | "manager" | "cafe_staff" | "storage_staff";

export type UserStatus = "active" | "inactive" | "invited";

export type ProductCategory =
    | "coffee"
    | "dairy"
    | "packaging"
    | "bakery"
    | "syrup"
    | "cleaning"
    | "other";

export type InventoryStatus = "ok" | "low" | "critical";

export type OrderStatus =
    | "pending"
    | "packing"
    | "ready"
    | "sent"
    | "received"
    | "cancelled";

export type StockMovementType =
    | "stock_in"
    | "packed_for_cafe"
    | "sent_to_cafe"
    | "manual_correction"
    | "damaged"
    | "workshop_allocation";

/** The workshop is physically inside storage, so items are allocated
 * directly from inventory to a department — no request/delivery flow. */
export type WorkshopDepartment = "bakery" | "pastry" | "saucier" | "storage_costs";

export type WorkshopAllocation = {
    id: string;
    department: WorkshopDepartment;
    productId: string;
    quantity: number;
    createdBy: string;
    createdAt: string;
};

export type User = {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    status: UserStatus;
    locationName: string;
};

export type Cafe = {
    id: string;
    name: string;
    managerName: string;
    address: string;
};

export type Product = {
    id: string;
    name: string;
    category: ProductCategory;
    /** Stock/base unit used for real inventory and recipe costing. Kept as unit for backward compatibility. */
    unit: string;
    stockUnit?: string;
    /** Ordering/formal unit used by cafe staff, for example shell or package. */
    orderUnit?: string;
    /** How many stock units are consumed by one ordering unit. */
    orderUnitQuantity?: number;
    /** Quantity step for ordering unit. Use 1 when the cafe can only request full shells/packages. */
    orderQuantityStep?: number;
};

export type InventoryItem = {
    id: string;
    productId: string;
    currentQuantity: number;
    minimumQuantity: number;
    criticalQuantity: number;
    /** Reference "full" quantity, set whenever stock is restocked (added
     * to) — used to compute the percent-based low-stock resupply alarm. */
    parQuantity: number;
};

export type CafeOrder = {
    id: string;
    cafeId: string;
    requestedBy: string;
    status: OrderStatus;
    note?: string;
    createdAt: string;
    updatedAt: string;
};

export type OrderItem = {
    id: string;
    orderId: string;
    productId: string;
    requestedQuantity: number;
    packedQuantity: number;
};

export type StockMovement = {
    id: string;
    productId: string;
    type: StockMovementType;
    quantity: number;
    description: string;
    createdBy: string;
    createdAt: string;
};

export type RecipeIngredient = {
    id: string;
    productId: string;
    /** In the product's stockUnit. */
    quantity: number;
};

export type Recipe = {
    id: string;
    name: string;
    category?: string;
    ingredients: RecipeIngredient[];
    createdAt: string;
    updatedAt: string;
};

export type SalesItem = {
    id: string;
    recipeId: string | null;
    itemName: string;
    quantitySold: number;
    unitPrice: number | null;
    revenue: number | null;
};

export type SalesBatch = {
    id: string;
    shiftDate: string;
    shiftLabel?: string;
    sourceType: "excel" | "csv" | "image";
    sourceFileName?: string;
    importedBy?: string;
    createdAt: string;
    items: SalesItem[];
};

export type Supplier = {
    id: string;
    name: string;
    phone: string;
    website?: string;
    notes?: string;
    createdAt: string;
};

export type PurchaseOrderItem = {
    id: string;
    productId?: string;
    productName: string;
    quantity: number;
    stockUnit?: string;
};

export type PurchaseOrder = {
    id: string;
    supplierId: string;
    status: string;
    smsStatus: string;
    createdBy?: string;
    createdAt: string;
    items: PurchaseOrderItem[];
};

export type Employee = {
    id: string;
    fullName: string;
    position?: string;
    baseSalary: number;
    isActive: boolean;
    createdAt: string;
};

export type PayrollRecord = {
    id: string;
    employeeId: string;
    /** "YYYY-MM" */
    month: string;
    baseSalary: number;
    /** Paid at (baseSalary / 30) per day. */
    overtimeDays: number;
    daysWorked: number;
    leaveDays: number;
    /** Added to the total. */
    bonusAmount: number;
    /** Subtracted from the total. */
    penaltyAmount: number;
    /** Paid out mid-month, ahead of the regular payday — subtracted from
     * the end-of-month total since the employee already received it. */
    advanceAmount: number;
    /** Subtracted from the total. */
    loanInstallment: number;
    /** Subtracted from the total. */
    insuranceAmount: number;
    note?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
};

export type AuditLogEntry = {
    id: string;
    scope: string;
    action: string;
    description: string;
    actorRole: string;
    actorName: string;
    ip: string;
    userAgent: string;
    createdAt: string;
};