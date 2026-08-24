"use client";

import { RecipesPanel } from "../../../components/panels/RecipesPanel";
import { RoleGuard } from "../../../components/RoleGuard";
import { ACCOUNTANT_NAV_LINKS } from "../../../lib/nav-links";

export default function AccountantRecipesPage() {
    return (
        <RoleGuard role="accountant">
            <RecipesPanel navLinks={ACCOUNTANT_NAV_LINKS} />
        </RoleGuard>
    );
}
