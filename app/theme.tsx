"use client";

import { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="system" enableSystem enableColorScheme storageKey="qiyi-appearance">{children}</ThemeProvider>;
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  const action = dark ? "切换为浅色模式" : "切换为深色模式";
  return <Button className="theme-toggle" variant="outline" onClick={() => setTheme(dark ? "light" : "dark")} disabled={!mounted} aria-label={action} title={action}>
    <span className="theme-symbol" key={mounted ? resolvedTheme : "initial"}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</span>
    <span className="theme-toggle-text">{mounted ? dark ? "浅色" : "深色" : "主题"}</span>
  </Button>;
}
