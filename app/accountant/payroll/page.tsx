"use client";

import { PayrollPanel } from "../../../components/panels/PayrollPanel";
import { RoleGuard } from "../../../components/RoleGuard";
import { ACCOUNTANT_NAV_LINKS } from "../../../lib/nav-links";

export default function AccountantPayrollPage() {
    return (
        <RoleGuard role="accountant">
            <PayrollPanel navLinks={ACCOUNTANT_NAV_LINKS} />
        </RoleGuard>
    );
}
