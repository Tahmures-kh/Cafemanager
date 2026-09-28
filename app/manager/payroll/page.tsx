"use client";

import { PayrollPanel } from "../../../components/panels/PayrollPanel";
import { RoleGuard } from "../../../components/RoleGuard";
import { MANAGER_NAV_LINKS } from "../../../lib/nav-links";

export default function ManagerPayrollPage() {
    return (
        <RoleGuard role="manager">
            <PayrollPanel navLinks={MANAGER_NAV_LINKS} />
        </RoleGuard>
    );
}
