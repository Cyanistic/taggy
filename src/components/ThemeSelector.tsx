import { Monitor, Moon, Sun } from "lucide-solid";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = createTheme();

  // Determine current theme for visual indication
  const currentTheme = theme() === "system" ? resolvedTheme() : theme();

  return (
    <DropdownMenu placement="bottom-end">
      <DropdownMenuTrigger>
        <Button
          variant="outline"
          size="icon"
          class="bg-background border-primary/20 hover:bg-accent hover:text-accent-foreground"
        >
          <Sun class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
          <Moon class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
          <span class="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="border-primary/20">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          class={`${currentTheme === "light" ? "bg-accent text-accent-foreground" : ""} focus:bg-accent focus:text-accent-foreground`}
        >
          <Sun class="h-4 w-4 mr-2 text-primary" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          class={`${currentTheme === "dark" ? "bg-accent text-accent-foreground" : ""} focus:bg-accent focus:text-accent-foreground`}
        >
          <Moon class="h-4 w-4 mr-2 text-primary" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          class={`${currentTheme === "system" ? "bg-accent text-accent-foreground" : ""} focus:bg-accent focus:text-accent-foreground`}
        >
          <Monitor class="h-4 w-4 mr-2 text-primary" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
