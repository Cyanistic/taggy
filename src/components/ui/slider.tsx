import { cn } from "@/libs/cn";
import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";
import {
  Slider as SliderPrimitive,
  SliderRootProps,
} from "@kobalte/core/slider";
import { PolymorphicProps } from "@kobalte/core";

type sliderProps<T extends ValidComponent = "slider"> = SliderRootProps<T> & {
  class?: string;
};

export const Slider = <T extends ValidComponent = "slider">(
  props: PolymorphicProps<T, sliderProps<T>>,
) => {
  const [local, rest] = splitProps(props as sliderProps, ["class"]);

  return (
    <SliderPrimitive
      class={cn(
        "relative flex w-full touch-none select-none items-center",
        local.class,
      )}
      {...rest}
    >
      <SliderPrimitive.Track>
        <SliderPrimitive.Fill class="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb class="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive>
  );
};
