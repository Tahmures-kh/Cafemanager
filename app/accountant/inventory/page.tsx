"use client";

import { InventoryPanel } from "../../../components/panels/InventoryPanel";
import { RoleGuard } from "../../../components/RoleGuard";
import { ACCOUNTANT_NAV_LINKS } from "../../../lib/nav-links";

export default function AccountantInventoryPage() {
    return (
        <RoleGuard role="accountant">
            <InventoryPanel navLinks={ACCOUNTANT_NAV_LINKS} />
        </RoleGuard>
    );
}
