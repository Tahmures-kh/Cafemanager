import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Penza",
        short_name: "Penza",
        description: "مدیریت سفارش، موجودی، انبار و ارسال کالا بین Penza و انبار",
        start_url: "/",
        display: "standalone",
        background_color: "#f2fff2",
        theme_color: "#00A300",
        icons: [
            { src: "/icon", sizes: "32x32", type: "image/png" },
            { src: "/apple-icon", sizes: "180x180", type: "image/png" },
        ],
    };
}
