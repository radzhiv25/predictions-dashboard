"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark" | "system";

const themeOrder: ThemeMode[] = ["light", "system", "dark"];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const currentTheme = (theme as ThemeMode | undefined) ?? "light";

  const cycleTheme = () => {
    const index = themeOrder.indexOf(currentTheme);
    const nextTheme = themeOrder[(index + 1) % themeOrder.length];
    setTheme(nextTheme);
  };

  return (
    <Button size="sm" variant="outline" onClick={cycleTheme} className="gap-2 transition-transform active:scale-95">
      {currentTheme === "dark" ? <Moon className="size-4" /> : null}
      {currentTheme === "system" ? <Laptop className="size-4" /> : null}
      {currentTheme === "light" ? <Sun className="size-4" /> : null}
      {currentTheme[0].toUpperCase() + currentTheme.slice(1)}
    </Button>
  );
}
