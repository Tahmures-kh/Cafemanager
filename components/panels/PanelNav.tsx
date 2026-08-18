"use client";

import Link from "next/link";

export type PanelNavLink = {
    href: string;
    label: string;
    primary?: boolean;
};

/** Shared header nav-link renderer. Each role's page passes its OWN link
 * list — this never hardcodes cross-role links, so one role's panel never
 * bleeds into another's. */
export function PanelNav({ links }: { links: PanelNavLink[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={
                        link.primary
                            ? "penza-button rounded-2xl px-5 py-3 text-sm font-black"
                            : "rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]"
                    }
                >
                    {link.label}
                </Link>
            ))}
        </div>
    );
}
