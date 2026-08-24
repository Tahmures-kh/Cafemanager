"use client";

import { InventoryPanel } from "../../../components/panels/InventoryPanel";
import { RoleGuard } from "../../../components/RoleGuard";
import { MANAGER_NAV_LINKS } from "../../../lib/nav-links";

export default function ManagerInventoryPage() {
    return (
        <RoleGuard role="manager">
            <InventoryPanel navLinks={MANAGER_NAV_LINKS} />
        </RoleGuard>
    );
}
