import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AccountMenu } from "../components/AccountMenu";
import { PageWallpaper } from "../components/PageWallpaper";
import "./globals.css";

export const metadata: Metadata = {
  title: "سامانه مدیریت Penza و انبار",
  description: "مدیریت سفارش، موجودی، انبار و ارسال کالا بین Penza و انبار",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Penza",
  },
};

export const viewport: Viewport = {
  themeColor: "#00A300",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <PageWallpaper />
        <div className="relative z-10">
          <AccountMenu />
          {children}
        </div>
      </body>
    </html>
  );
}