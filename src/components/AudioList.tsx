import { AudioFile } from "@/types";
import { createEffect, For, Show } from "solid-js";
import AudioRow from "./AudioRow";
import { FolderPlus, Search } from "lucide-solid";
import { TextField, TextFieldRoot } from "./ui/textfield";
import { Button } from "./ui/button";
import { useAppContext } from "./AppContext";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { createMemo, createSignal } from "solid-js";
import Fuse from "fuse.js";
import {
  createDebouncedSignal,
  createThrottledSignal,
} from "@tanstack/solid-pacer";
import { FilterField, FilterPopover } from "./FilterPopover";

interface AudioListProps {
  selectedFile?: string;
  onSelect?: (path: string) => void;
}

export default function AudioList(props: AudioListProps) {
  const [searchQuery, setSearchQuery] = createDebouncedSignal("", {
    wait: 300,
  });
  const { addAudioDirectory } = useAppContext();
  const { audioFiles } = useAppContext();

  // Define filter fields based on AudioFile properties
  const [filterFields, setFilterFields] = createSignal<FilterField[]>([
    { key: "title", label: "Title", enabled: true },
    { key: "artist", label: "Artist", enabled: true },
    { key: "albumTitle", label: "Album", enabled: true },
    { key: "albumArtist", label: "Album Artist", enabled: true },
    { key: "genre", label: "Genre", enabled: true },
    { key: "year", label: "Year", enabled: true },
  ]);

  const [filteredFiles, setFilteredFiles] = createThrottledSignal<AudioFile[]>(
    Object.values(audioFiles()),
    {
      wait: 300,
    },
  );

  let fuse: Fuse<AudioFile>;
  createEffect(() => {
    setFilteredFiles(Object.values(audioFiles()));
  });

  // If the list of audio files changes, then reinitialize fuse
  createEffect(() => {
    fuse = new Fuse(Object.values(audioFiles()), {
      keys: ["title", "artist", "albumTitle", "albumArtist", "genre", "year"],
      minMatchCharLength: 1,
      // Add smart case functionality
      isCaseSensitive: searchQuery().toLocaleLowerCase() !== searchQuery(),
    });
  });

  // If the search query changes, then update the filtered files using fuse
  createEffect(() => {
    if (!searchQuery()) {
      setFilteredFiles(Object.values(audioFiles()));
    } else {
      const items = fuse.search(searchQuery());
      setFilteredFiles(items.map(({ item }) => item));
    }
  });

  let listRef!: HTMLDivElement;
  const staticOptions = {
    getScrollElement: () => listRef,
    estimateSize: () => 72,
    gap: 8,
    overscan: 5, // Slightly increased for smoother scrolling
  };

  const listVirtualizer = createMemo(() => {
    return createVirtualizer({
      ...staticOptions,
      count: filteredFiles().length,
    });
  });

  return (
    <div class="flex flex-col h-full">
      <div class="flex flex-col justify-between">
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
          <FilterPopover fields={filterFields()} onChange={setFilterFields} />
        </div>
      </div>
      <div class="flex-1 overflow-y-auto rounded-2xl mt-4" ref={listRef}>
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
            {(virtualRow) => {
              const file = filteredFiles()[virtualRow.index];
              return (
                <AudioRow
                  class="absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  file={file}
                  selected={file.path === props.selectedFile}
                  onSelect={() => props.onSelect?.(file.path)}
                />
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
