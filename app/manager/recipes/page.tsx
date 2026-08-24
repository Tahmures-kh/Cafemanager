"use client";

import { RecipesPanel } from "../../../components/panels/RecipesPanel";
import { RoleGuard } from "../../../components/RoleGuard";
import { MANAGER_NAV_LINKS } from "../../../lib/nav-links";

export default function ManagerRecipesPage() {
    return (
        <RoleGuard role="manager">
            <RecipesPanel navLinks={MANAGER_NAV_LINKS} />
        </RoleGuard>
    );
}
