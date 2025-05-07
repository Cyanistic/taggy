import { AudioFile } from "@/types";
import { Card, CardContent } from "./ui/card";
import { Music } from "lucide-solid";
import { ComponentProps, Show, splitProps } from "solid-js";
import { cn } from "@/libs/cn";

export interface AudioRowProps extends ComponentProps<"div"> {
  file: AudioFile;
  selected?: boolean;
  onSelect?: () => void;
}

export default function AudioRow(props: AudioRowProps) {
  const [_, rest] = splitProps(props, ["file", "selected", "onSelect"]);
  return (
    <Card
      {...rest}
      class={cn(
        `cursor-pointer transition-colors hover:bg-accent ${
          props.selected ? "bg-accent" : ""
        }`,
        rest.class,
      )}
      onClick={() => props.onSelect?.()}
    >
      <CardContent class="p-3 gap-3">
        <div class="flex items-center gap-3 justify-between">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <Show
              when={props.file.cover}
              fallback={
                <div class="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                  <Music class="h-6 w-6 text-muted-foreground" />
                </div>
              }
            >
              {(cover) => (
                <img
                  src={cover()}
                  alt={`${props.file.albumTitle} cover`}
                  class="w-12 h-12 object-cover rounded-md"
                />
              )}
            </Show>
            <div class="overflow-hidden flex-1 min-w-0">
              <Show
                when={props.file.title}
                fallback={
                  <i class="font-medium truncate" title="No title found">
                    No Title
                  </i>
                }
              >
                <p class="font-medium truncate" title={props.file.title}>
                  {props.file.title}
                </p>
              </Show>
              <Show when={props.file.artist || props.file.albumTitle}>
                <p class="text-sm text-muted-foreground truncate">
                  {props.file.artist} • {props.file.albumTitle}
                </p>
              </Show>
              <Show when={props.file.genre}>
                <p class="text-xs text-muted-foreground mt-1 truncate">
                  <span class="font-medium mr-0.5">Genre:</span>{" "}
                  {props.file.genre}
                </p>
              </Show>
              <p class="text-xs text-muted-foreground mt-1 truncate">
                <span class="font-medium mr-0.5">Path:</span> {props.file.path}
              </p>
            </div>
          </div>
          {/* Year displayed on the far right */}
          <div class="text-sm text-muted-foreground whitespace-nowrap pl-3">
            {props.file.year}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
