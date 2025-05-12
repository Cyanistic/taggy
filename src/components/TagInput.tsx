import { X } from "lucide-solid";
import { createMemo, For, Show } from "solid-js";
import { Badge } from "./ui/badge";
import Autocomplete from "./Autocomplete";

interface TagInputProps {
  input: string | string[];
  onSelect?: (value: string | string[]) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  suggestions: string[];
}

export function TagInput(props: TagInputProps) {
  const isArray = createMemo(() => {
    return Array.isArray(props.input);
  });

  // Get unique artists from the allArtists array
  const uniqueArtists = createMemo(() => new Set(props.suggestions));

  // Filter suggestions to exclude already selected artists
  const filteredSuggestions = createMemo(() =>
    uniqueArtists()
      // @ts-expect-error difference between string and string[]
      .difference(new Set(props.input)),
  );

  const addValue = (value: string) => {
    const val = value.trim();
    if (isArray()) {
      const newArtists = [...props.input, val];
      props.onSelect?.(newArtists);
    } else {
      props.onSelect?.(val);
    }
  };

  const removeValue = (valueToRemove: string) => {
    if (!isArray()) return;
    const newArtists = (props.input as string[]).filter(
      (value) => value !== valueToRemove,
    );
    props.onSelect?.(newArtists);
  };

  return (
    <div class="flex flex-col gap-1.5">
      <Show when={isArray() && (props.input as string[]).length}>
        <div class="flex min-h-0 w-full px-3 py-2 text-sm">
          <div class="flex flex-wrap gap-1.5 min-h-0">
            <For each={isArray() && (props.input as string[])}>
              {(artist) => (
                <Badge variant="secondary" class="flex items-center gap-1">
                  {artist}
                  <button
                    type="button"
                    class="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeValue(artist);
                    }}
                  >
                    <X class="h-3 w-3" />
                    <span class="sr-only">Remove {artist}</span>
                  </button>
                </Badge>
              )}
            </For>
          </div>
        </div>
      </Show>
      <Autocomplete
        items={[...filteredSuggestions()]}
        placeholder={props.placeholder}
        keepOpen={isArray()}
        onSelect={addValue}
        onChange={props.onChange}
        initialValue={!isArray() ? (props.input as string) : undefined}
      />
    </div>
  );
}
