import { AudioFile } from "@/types";
import { createEffect, For, Show } from "solid-js";
import AudioRow from "./AudioRow";
import { FolderPlus, Search, X } from "lucide-solid";
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
import { FilterField } from "./FilterPopover";
import FilterButton from "./FilterButton";
import { SortDropdown as SortDropdown, SortCriterion } from "./SortButton";

interface AudioListProps {
  selectedFile?: string;
  onSelect?: (path: string) => void;
}

// Utils for multi-criteria sorting
function compareValues(
  a: unknown,
  b: unknown,
  direction: "asc" | "desc" = "asc",
): number {
  // Handle null or undefined values
  if (a == null && b == null) return 0;
  if (a == null) return direction === "asc" ? -1 : 1;
  if (b == null) return direction === "asc" ? 1 : -1;

  // Handle numeric values (like year)
  if (
    typeof a === "string" &&
    !isNaN(Number(a)) &&
    typeof b === "string" &&
    !isNaN(Number(b))
  ) {
    const numA = Number(a);
    const numB = Number(b);
    return direction === "asc" ? numA - numB : numB - numA;
  }

  // String comparison
  if (typeof a === "string" && typeof b === "string") {
    const stringA = a.toLowerCase();
    const stringB = b.toLowerCase();
    if (stringA < stringB) return direction === "asc" ? -1 : 1;
    if (stringA > stringB) return direction === "asc" ? 1 : -1;
    return 0;
  }

  // Fallback for other types
  return 0;
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
    { key: "albumArtists", label: "Album Artist", enabled: true },
    { key: "genre", label: "Genre", enabled: true },
    { key: "year", label: "Year", enabled: true },
  ]);

  const [filteredFiles, setFilteredFiles] = createThrottledSignal<AudioFile[]>(
    Object.values(audioFiles()),
    {
      wait: 300,
    },
  );

  // Sort criteria state
  const [sortCriteria, setSortCriteria] = createSignal<SortCriterion[]>([
    { label: "Title", field: "title", direction: "asc" },
  ]);

  const sortFiles = (files: AudioFile[]): AudioFile[] =>
    files
      .filter((file) => {
        if (!searchQuery()) return true;

        return Object.entries(filterFields()).some(([field, enabled]) => {
          if (!enabled) return false;
          //@ts-expect-error we already check this
          return file[field]?.toLowerCase().includes(searchQuery.toLowerCase());
        });
      })
      .sort((a, b) => {
        // Handle multi-criteria sorting
        for (const criterion of sortCriteria()) {
          //@ts-expect-error we already check this
          const fieldA = a[criterion.field] || "";
          //@ts-expect-error we already check this
          const fieldB = b[criterion.field] || "";

          const comparison = compareValues(fieldA, fieldB, criterion.direction);

          // If items are equal on this criterion, continue to the next criterion
          if (comparison !== 0) {
            return comparison;
          }
        }

        // If all criteria are equal, maintain original order
        return 0;
      });

  // Sort options that can be added to criteria
  const sortOptions = [
    { label: "Title", value: "title" },
    { label: "Artist", value: "artist" },
    { label: "Album", value: "album" },
    { label: "Year", value: "year" },
    { label: "Genre", value: "genre" },
  ];

  let fuse: Fuse<AudioFile>;
  createEffect(() => {
    setFilteredFiles(Object.values(audioFiles()));
  });

  // If the list of audio files changes, then reinitialize fuse
  createEffect(() => {
    fuse = new Fuse(Object.values(audioFiles()), {
      keys: ["title", "artist", "albumTitle", "albumArtists", "genre", "year"],
      minMatchCharLength: 1,
      ignoreLocation: true,
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
      setFilteredFiles(sortFiles(items.map(({ item }) => item)));
    }
  });

  let listRef!: HTMLDivElement;
  const staticOptions = {
    getScrollElement: () => listRef,
    estimateSize: () => 108,
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
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <TextFieldRoot>
              <TextField
                class="pl-8 pr-8"
                id="search"
                name="search"
                placeholder="Search"
                value={searchQuery()}
                type="text"
                onInput={(e) => setSearchQuery(e.target.value)}
              />
            </TextFieldRoot>
            <Show when={searchQuery()}>
              <Button
                variant="ghost"
                size="icon"
                class="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X class="h-4 w-4" />
                <span class="sr-only">Clear search</span>
              </Button>
            </Show>
          </div>
          {/* <FilterPopover fields={filterFields()} onChange={setFilterFields} /> */}
          <FilterButton />
          <SortDropdown
            sortOptions={sortOptions}
            onChange={(newCriteria) => setSortCriteria(newCriteria)}
          />
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
                  data-index={virtualRow.index}
                  ref={(el) => {
                    // Fix thanks to this guy: https://github.com/TanStack/virtual/issues/930#issue-2861887686
                    el.dataset.index = virtualRow.index.toString();
                    listVirtualizer().measureElement(el);
                  }}
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
