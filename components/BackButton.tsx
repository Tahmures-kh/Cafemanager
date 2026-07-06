"use client";

import { useRouter } from "next/navigation";

export function BackButton({ className }: { className?: string }) {
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() => router.back()}
            className={className ?? "rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-slate-500 hover:bg-[#f2fff2]"}
        >
            برگشت
        </button>
    );
}
