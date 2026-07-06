"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessDeniedNotice } from "../components/AccessDeniedNotice";
import { findRoleByCredentials } from "../lib/auth";
import { setActivePenzaRole } from "../lib/role-session";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const role = findRoleByCredentials(username, password);

        if (!role) {
            setError("نام کاربری یا رمز عبور اشتباه است.");
            return;
        }

        setActivePenzaRole(role);
        router.push(`/${role}`);
    }

    return (
        <main className="penza-page relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -right-16 h-[26rem] w-[26rem] rounded-full bg-[#00A300]/25 blur-3xl" />
            <div className="pointer-events-none absolute top-1/3 -left-24 h-[22rem] w-[22rem] rounded-full bg-[#9ee89e]/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-[#00A300]/15 blur-3xl" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center p-5 lg:p-6">
                <div className="w-full max-w-md">
                    <AccessDeniedNotice />

                    <section className="penza-hero p-8 lg:p-10">
                        <div className="relative z-10">
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                <span className="penza-live-dot" />
                                Penza
                            </p>

                            <h1 className="mt-4 text-2xl font-black text-[#0B2F0B]">ورود</h1>

                            <div className="penza-card mt-6 rounded-[1.5rem] p-6">
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-black text-[#0B2F0B]">نام کاربری</label>
                                        <input
                                            value={username}
                                            onChange={(event) => setUsername(event.target.value)}
                                            className="mt-2 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                            autoComplete="username"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black text-[#0B2F0B]">رمز عبور</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            className="mt-2 h-12 w-full rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] focus:ring-4 focus:ring-green-100"
                                            autoComplete="current-password"
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-sm font-bold text-red-600">{error}</p>
                                    )}

                                    <button type="submit" className="penza-button w-full rounded-2xl px-5 py-3 text-sm font-black">
                                        ورود
                                    </button>
                                </form>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
