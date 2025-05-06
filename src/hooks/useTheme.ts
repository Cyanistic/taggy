import { createSignal, createMemo, onCleanup, onMount } from "solid-js";

type Theme = "light" | "dark" | "system";

export function createTheme(defaultTheme: Theme = "system") {
  const STORAGE_KEY = "theme";

  // theme = what user chose; resolvedTheme = actual applied value
  const [theme, setThemeRaw] = createSignal<Theme>(defaultTheme);
  const resolvedTheme = createMemo<"light" | "dark">(() => {
    const t = theme();
    if (t !== "light" && t !== "dark") {
      return matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return t;
  });

  // mounted flag to avoid hydration mismatch
  const [mounted, setMounted] = createSignal(false);

  // sync with localStorage and listen for system changes
  onMount(() => {
    // init from localStorage if present
    const stored = localStorage.getItem(STORAGE_KEY) as Theme;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeRaw(stored);
    }

    // immediately apply the class
    updateHtmlClass(resolvedTheme());

    // watch OS-level changes
    const mql = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => updateHtmlClass(resolvedTheme());
    mql.addEventListener("change", onChange);

    setMounted(true);

    onCleanup(() => {
      mql.removeEventListener("change", onChange);
    });
  });

  // whenever resolvedTheme flips, update <html>
  createMemo(() => {
    if (mounted()) {
      updateHtmlClass(resolvedTheme());
    }
  });

  // wrapper that also writes to localStorage
  function setTheme(value: Theme) {
    localStorage.setItem(STORAGE_KEY, value);
    setThemeRaw(value);
  }

  return { theme, resolvedTheme, setTheme, mounted };
}

function updateHtmlClass(theme: "light" | "dark") {
  const html = document.documentElement;
  html.classList.toggle("dark", theme === "dark");
}
