"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const WALLPAPER_COUNT = 11;

const WALLPAPERS = Array.from(
    { length: WALLPAPER_COUNT },
    (_, index) => `/wallpapers/wallpaper-${String(index + 1).padStart(2, "0")}.webp`
);

export function PageWallpaper() {
    const pathname = usePathname();
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        setSrc(WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)]);
    }, [pathname]);

    if (!src) return null;

    return <div aria-hidden className="penza-wallpaper" style={{ backgroundImage: `url(${src})` }} />;
}
