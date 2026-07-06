"use client";

const ACTOR_NAME_KEY = "penza-actor-name";

export function getActorName(): string | null {
    if (typeof window === "undefined") return null;

    const value = window.localStorage.getItem(ACTOR_NAME_KEY)?.trim();
    return value || null;
}

export function setActorName(name: string) {
    if (typeof window === "undefined") return;

    const trimmed = name.trim();
    if (!trimmed) return;

    window.localStorage.setItem(ACTOR_NAME_KEY, trimmed);
}
