import { AudioFile } from "@/types";
import { Card, CardContent } from "./ui/card";
import { Music } from "lucide-solid";
import { Show } from "solid-js";

export interface AudioRowProps {
  file: AudioFile;
  selected?: boolean;
  onSelect?: () => void;
}

export default function AudioRow(props: AudioRowProps) {
  return (
    <Card
      class={`cursor-pointer transition-colors hover:bg-accent ${
        props.selected ? "bg-accent" : ""
      }`}
      onClick={() => props.onSelect?.()}
    >
      <CardContent class="p-3 flex items-center gap-3">
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
              src={cover() || "/placeholder.svg"}
              alt={`${props.file.albumTitle} cover`}
              class="w-12 h-12 object-cover rounded-md"
            />
          )}
        </Show>
        <div class="overflow-hidden">
          <p class="font-medium truncate">{props.file.title}</p>
          <p class="text-sm text-muted-foreground truncate">
            {props.file.artist} • {props.file.albumTitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
