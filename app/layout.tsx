import type { Metadata } from "next";
import "./globals.css";
import { AppearanceProvider } from "./theme";
export const metadata: Metadata = {
  title: "qiyi71w · 代码、棋局与日常",
  description: "qiyi71w 的个人主页。LizzieYzy Next 项目、Steam 在线动态与个人服务状态。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" suppressHydrationWarning><body className="antialiased"><AppearanceProvider>{children}</AppearanceProvider></body></html>;
}
