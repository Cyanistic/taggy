import { createEffect, createSignal } from "solid-js";

export function useMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = createSignal(false);

  createEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Initial check
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);

    // Clean up
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  });

  return isMobile();
}
