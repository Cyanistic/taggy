import { AudioFile } from "@/types";
import { createSignal, For, Show } from "solid-js";
import AudioRow from "./AudioRow";
import { Search } from "lucide-solid";
import { TextField, TextFieldRoot } from "./ui/textfield";

interface AudioListProps {
  files?: Record<string, AudioFile>;
  selectedFile?: string;
  onSelect?: (path: string) => void;
}

export default function AudioList(props: AudioListProps) {
  const [searchQuery, setSearchQuery] = createSignal("");

  return (
    <div class="flex flex-col h-full">
      <div class="mb-4">
        <h2 class="text-2xl font-bold mb-4">Audio Files</h2>
        <div class="relative">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <TextFieldRoot>
            <TextField
              class="pl-8"
              id="search"
              name="search"
              placeholder="Search"
              value={searchQuery()}
              type="text"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </TextFieldRoot>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto rounded-2xl">
        <div class="space-y-2">
          <For
            each={props.files && Object.values(props.files)}
            fallback={
              <p class="text-center py-8 text-muted-foreground">
                No audio files found
              </p>
            }
          >
            {(file) => (
              <AudioRow
                file={file}
                selected={file.path === props.selectedFile}
                onSelect={() => props.onSelect?.(file.path)}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
