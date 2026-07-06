"use client";

import { useEffect } from "react";

type SuccessNoticeProps = {
    message: string;
    onDismiss: () => void;
    durationMs?: number;
};

export function SuccessNotice({ message, onDismiss, durationMs = 4000 }: SuccessNoticeProps) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, durationMs);
        return () => clearTimeout(timer);
    }, [message, onDismiss, durationMs]);

    return (
        <div className="rounded-2xl border border-green-900/10 bg-[#f2fff2] p-4 text-sm font-black leading-7 text-[#0B2F0B]">
            {message}
        </div>
    );
}
