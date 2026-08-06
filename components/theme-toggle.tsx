"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-full bg-transparent shrink-0" />;
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer h-9 w-9 p-0 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all duration-200 flex items-center justify-center shrink-0"
      aria-label="Toggle theme"
    >
      {currentTheme === "light" ? (
        <Sun className="size-4.5 transition-all duration-300 hover:scale-110 hover:rotate-45" />
      ) : (
        <Moon className="size-4.5 transition-all duration-300 hover:scale-110 hover:-rotate-12" />
      )}
    </Button>
  );
}
