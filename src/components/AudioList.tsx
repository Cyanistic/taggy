import { AudioFile } from "@/types";
import { createEffect, For, onMount, Show } from "solid-js";
import AudioRow from "./AudioRow";
import { RotateCcw, Search, X } from "lucide-solid";
import { TextField, TextFieldRoot } from "./ui/textfield";
import { Button } from "./ui/button";
import { DEFAULT_PREFERENCES, useAppContext } from "./AppContext";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { createMemo } from "solid-js";
import Fuse from "fuse.js";
import { createDebouncedSignal } from "@tanstack/solid-pacer";
import FilterButton from "./FilterButton";
import { SortDropdown } from "./SortButton";
import { Badge } from "./ui/badge";
import { ThemeToggle } from "./ThemeSelector";
import DirectoryButton from "./DirectoryButton";
import { produce } from "solid-js/store";
import { deepGet } from "@/utils";

export interface AudioListRef {
  advance: (num: number) => void;
  length: () => number;
}

interface AudioListProps {
  selectedFile?: string;
  onSelect?: (path: string) => void;
  ref?: (ref: AudioListRef) => void;
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

  // **New**: numeric comparison for actual numbers
  if (typeof a === "number" && typeof b === "number") {
    return direction === "asc" ? a - b : b - a;
  }

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
  const { state, setState, setSelectedFile, audioFiles } = useAppContext();

  // Define filter fields based on AudioFile properties
  // Sort criteria state
  // Sort options that can be added to criteria
  const sortOptions = [
    { label: "Best Match", value: "score" },
    { label: "Title", value: "title" },
    { label: "Artist", value: "artist" },
    { label: "Album", value: "album" },
    { label: "Year", value: "date.year" },
    { label: "Genre", value: "genre" },
    { label: "File Path", value: "path" },
  ];

  const fuse = createMemo<Fuse<AudioFile>>(() => {
    return new Fuse(Object.values(audioFiles()), {
      keys: state.preferences.filterFields,
      minMatchCharLength: 1,
      threshold: 0.4,
      // Add smart case functionality
      isCaseSensitive: searchQuery().toLocaleLowerCase() !== searchQuery(),
      includeScore: true,
    });
  });

  const sortFn = createMemo(() => (a: unknown, b: unknown) => {
    // Handle multi-criteria sorting
    for (const criterion of state.preferences.sortCriteria) {
      const fieldA = deepGet(a, criterion.field);
      const fieldB = deepGet(b, criterion.field);

      const comparison = compareValues(fieldA, fieldB, criterion.direction);

      // If items are equal on this criterion, continue to the next criterion
      if (comparison !== 0) {
        return comparison;
      }
    }

    // If all criteria are equal, maintain original order
    return 0;
  });

  // 2) Reactive filtered + sorted files
  const filteredFiles = createMemo<(AudioFile & { score?: number })[]>(() => {
    const q = searchQuery();
    const list = q
      ? fuse()
          .search(q)
          .map((r) => ({ ...r.item, score: r.score }))
      : Object.values(audioFiles());
    list.sort(sortFn());
    return list;
  });

  let listRef!: HTMLDivElement;
  const listVirtualizer = createVirtualizer({
    get count() {
      return filteredFiles().length;
    },
    getScrollElement: () => listRef,
    estimateSize: () => 108,
    gap: 8,
    overscan: 5,
  });

  createEffect(() => {
    searchQuery();
    listVirtualizer.setOptions({ ...listVirtualizer.options, enabled: false });
    listVirtualizer._willUpdate();
    listVirtualizer.setOptions({
      ...listVirtualizer.options,
      get count() {
        return filteredFiles().length;
      },
      enabled: true,
    });
    listVirtualizer._willUpdate();
  });

  const advance = (amount: number) => {
    console.log("running!", amount);
    if (!filteredFiles().length) return;
    const index = filteredFiles().findIndex(
      (f) => f.path == state.selectedFile,
    );
    let finalIndex;
    if (index) {
      finalIndex =
        (index + amount + filteredFiles().length) % filteredFiles().length;
    } else {
      finalIndex =
        ((amount - 1) / 2 + filteredFiles().length) % filteredFiles().length;
    }
    setSelectedFile(filteredFiles()[finalIndex].path);
    listVirtualizer.scrollToIndex(finalIndex);
  };

  onMount(() => {
    props.ref?.({
      advance,
      length: () => filteredFiles().length,
    });
  });

  return (
    <div class="flex flex-col h-full">
      <div class="flex flex-col justify-between">
        <div class="flex justify-between">
          <div>
            <h2 class="text-2xl font-bold mb-4">Audio Files</h2>
          </div>
          <div class="space-x-2">
            <Show
              when={Object.values(state.preferences.panelSizes)
                .flat()
                .some((p) => p !== 50)}
            >
              <Button
                variant="outline"
                size="icon"
                class="bg-background border-primary/20 hover:bg-accent hover:text-accent-foreground"
                title="Reset UI"
                onClick={() =>
                  setState(
                    produce((s) => {
                      s.preferences.panelSizes = structuredClone(
                        DEFAULT_PREFERENCES.panelSizes,
                      );
                    }),
                  )
                }
              >
                <RotateCcw class="h-[1.2rem] w-[1.2rem] text-primary" />
              </Button>
            </Show>
            <ThemeToggle />
            <DirectoryButton />
          </div>
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
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
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
          <FilterButton
            fields={state.preferences.filterFields}
            onChange={(checked, field) => {
              setState(
                produce((s) => {
                  if (checked) {
                    s.preferences.filterFields = [
                      ...s.preferences.filterFields,
                      field,
                    ];
                  } else {
                    s.preferences.filterFields =
                      s.preferences.filterFields.filter((f) => f !== field);
                  }
                }),
              );
            }}
          />
          <SortDropdown
            sortOptions={sortOptions}
            onChange={(newCriteria) =>
              setState(
                produce((s) => {
                  s.preferences.sortCriteria = newCriteria;
                }),
              )
            }
          />
        </div>
        <div class="flex flex-wrap items-center text-sm text-muted-foreground gap-1 mt-2">
          <span class="mr-1">Sorting by:</span>
          <For each={state.preferences.sortCriteria}>
            {(criterion) => (
              <Badge variant="outline" class="bg-primary/5 border-primary/20">
                {criterion.label} {criterion.direction === "asc" ? "↑" : "↓"}
              </Badge>
            )}
          </For>
          <Badge variant="outline" class="ml-auto">
            {filteredFiles().length} results
          </Badge>
        </div>
        <Show when={searchQuery()}>
          <div class="flex items-center text-sm text-muted-foreground">
            <span>
              Searching in: {state.preferences.filterFields.join(", ")}
            </span>
          </div>
        </Show>
      </div>
      <div class="flex-1 overflow-y-auto rounded-2xl mt-4" ref={listRef}>
        <div
          class="relative w-full"
          style={{ height: `${listVirtualizer.getTotalSize()}px` }}
        >
          <For
            each={listVirtualizer.getVirtualItems()}
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
                    listVirtualizer.measureElement(el);
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
