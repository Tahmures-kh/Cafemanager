"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type PanelNavLink = {
    href: string;
    label: string;
};

/** Shared header nav-link renderer. Each role's page passes its OWN fixed
 * link list (see lib/nav-links.ts) — this never hardcodes cross-role links,
 * so one role's panel never bleeds into another's. The active tab is derived
 * from the current URL instead of being manually flagged per page, so it can
 * never point at the wrong tab and every page shows links in the same order. */
export function PanelNav({ links, children }: { links: PanelNavLink[]; children?: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={
                            isActive
                                ? "penza-button rounded-2xl px-5 py-3 text-sm font-black"
                                : "rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]"
                        }
                    >
                        {link.label}
                    </Link>
                );
            })}
            {children}
        </div>
    );
}
