"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { setActivePenzaRole, type PenzaRole } from "../lib/role-session";

type RoleEntryLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    penzaRole: PenzaRole;
    children: ReactNode;
};

export function RoleEntryLink({ href, penzaRole, children, onClick, ...props }: RoleEntryLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        setActivePenzaRole(penzaRole);
        onClick?.(event);
    }

    return (
        <Link href={href} onClick={handleClick} {...props}>
            {children}
        </Link>
    );
}
