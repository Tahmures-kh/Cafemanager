"use client";

import { useEffect, useState } from "react";
import { PENZA_ROLE_GUARD_MESSAGE_KEY } from "../lib/role-session";

export function AccessDeniedNotice() {
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const storedMessage = window.localStorage.getItem(PENZA_ROLE_GUARD_MESSAGE_KEY);

        if (searchParams.get("access") === "denied" || storedMessage) {
            setMessage(storedMessage || "لطفا با نقش درست وارد شوید.");
            window.localStorage.removeItem(PENZA_ROLE_GUARD_MESSAGE_KEY);
        }
    }, []);

    if (!message) return null;

    return (
        <div className="mb-4 rounded-[1.25rem] border border-green-900/10 bg-white p-4 text-right shadow-sm">
            <p className="text-sm font-bold text-red-600">{message}</p>
        </div>
    );
}
