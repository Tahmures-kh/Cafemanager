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
    | "damaged";

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