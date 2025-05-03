import { AudioFile } from "@/types";
import { createSignal, For } from "solid-js";
import AudioRow from "./AudioRow";
import { FolderPlus, Search } from "lucide-solid";
import { TextField, TextFieldRoot } from "./ui/textfield";
import { Button } from "./ui/button";
import { useAppContext } from "./AppContext";

interface AudioListProps {
  files?: Record<string, AudioFile>;
  selectedFile?: string;
  onSelect?: (path: string) => void;
}

export default function AudioList(props: AudioListProps) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const { addAudioDirectory } = useAppContext();

  return (
    <div class="flex flex-col h-full">
      <div class="mb-4 flex flex-col justify-between">
        <div class="flex justify-between">
          <h2 class="text-2xl font-bold mb-4">Audio Files</h2>
          <Button onClick={addAudioDirectory}>
            <FolderPlus class="-mx-2" />
          </Button>
        </div>
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
