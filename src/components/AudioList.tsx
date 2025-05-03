import { AudioFile } from "@/types";
import { createEffect, createSignal, For } from "solid-js";
import AudioRow from "./AudioRow";
import { FolderPlus, Search } from "lucide-solid";
import { TextField, TextFieldRoot } from "./ui/textfield";
import { Button } from "./ui/button";
import { useAppContext } from "./AppContext";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { createMemo } from "solid-js";
import { createThrottledValue } from "@tanstack/solid-pacer/throttler";

interface AudioListProps {
  selectedFile?: string;
  onSelect?: (path: string) => void;
}

export default function AudioList(props: AudioListProps) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const { addAudioDirectory } = useAppContext();
  const { audioFiles } = useAppContext();
  const [filteredFiles, setFilteredFiles] = createSignal<AudioFile[]>(
    Object.values(audioFiles()),
  );

  createEffect(() => {
    setFilteredFiles(Object.values(audioFiles()));
  });

  let listRef!: HTMLDivElement;
  const staticOptions = {
    getScrollElement: () => listRef,
    estimateSize: () => 72,
    gap: 8,
    overscan: 4,
  };

  const [throttled] = createThrottledValue(
    () =>
      createVirtualizer({
        ...staticOptions,
        count: filteredFiles().length,
      }),
    { wait: 500 },
  );

  const listVirtualizer = createMemo(() => throttled());

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
      <div class="flex-1 overflow-y-auto rounded-2xl" ref={listRef}>
        <div
          class="relative w-full"
          style={{ height: `${listVirtualizer().getTotalSize()}px` }}
        >
          <For
            each={listVirtualizer().getVirtualItems()}
            fallback={
              <p class="text-center py-8 text-muted-foreground">
                No audio files found
              </p>
            }
          >
            {(file) => (
              <AudioRow
                class="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${file.start}px)` }}
                file={filteredFiles()[file.index]}
                selected={
                  filteredFiles()[file.index].path === props.selectedFile
                }
                onSelect={() =>
                  props.onSelect?.(filteredFiles()[file.index].path)
                }
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
