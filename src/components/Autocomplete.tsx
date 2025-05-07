import { createSignal, createEffect, Show, For } from "solid-js";
import { Search } from "lucide-solid";
import { TextField, TextFieldRoot } from "./ui/textfield";
import { cn } from "@/libs/cn";
import { useAppContext } from "./AppContext";

interface CommandInputProps {
  placeholder?: string;
  items: string[];
  onChange?: (value: string) => void;
  onSelect?: (item: string) => void;
  keepOpen?: boolean;
  initialValue?: string;
}

export default function Autocomplete(props: CommandInputProps) {
  const { state } = useAppContext();
  const [inputValue, setInputValue] = createSignal(props.initialValue || "");
  const [suggestions, setSuggestions] = createSignal<string[]>([]);
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedIndex, setSelectedIndex] = createSignal(-1);
  let inputRef!: HTMLInputElement;
  let suggestionsRef!: HTMLDivElement;

  // Filter suggestions based on input
  createEffect(() => {
    if (inputValue().trim() === "") {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const filtered = props.items.filter((item) =>
      item.toLowerCase().includes(inputValue().toLowerCase()),
    );

    setSuggestions(filtered);
    // Don't automatically open the dropdown here
    // We'll control it only in the input handler
    setSelectedIndex(-1);
  });

  createEffect(() => {
    // @ts-expect-error Add this to force clear input
    // when changing songs
    const _ = state.selectedFile;
    setInputValue(props.initialValue || "");
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen() && !inputValue().trim()) return;

    // Arrow down
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions().length - 1 ? prev + 1 : prev,
      );
    }

    // Arrow up
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }

    // Enter
    else if (e.key === "Enter") {
      if (selectedIndex() >= 0) {
        selectItem(suggestions()[selectedIndex()]);
      } else {
        // Allow submitting custom values when there are no matching suggestions
        selectItem(inputValue());
      }
    }

    // Escape
    else if (e.key === "Escape") {
      setIsOpen(false);
      setInputValue("");
      props.onChange?.("");
    }
  };

  // Handle selection
  const selectItem = (item: string) => {
    setInputValue("");
    props.onSelect?.(item);
    props.onChange?.(item);
    if (!props.keepOpen) {
      setIsOpen(false);
      inputRef?.blur();
    }
  };

  // Close suggestions when clicking outside
  createEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef &&
        !suggestionsRef.contains(e.target as Node) &&
        inputRef &&
        !inputRef.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  // Scroll selected item into view
  createEffect(() => {
    if (selectedIndex() >= 0 && suggestionsRef) {
      const selectedElement = suggestionsRef.children[
        selectedIndex()
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  });

  return (
    <div class="relative w-full">
      <div class="relative">
        <TextFieldRoot>
          <TextField
            ref={inputRef}
            type="text"
            placeholder={props.placeholder}
            value={inputValue()}
            onInput={(e) => {
              setInputValue(e.currentTarget.value);
              props.onChange?.(e.currentTarget.value);
              // Show suggestions only when typing and there are matches
              setIsOpen(
                e.currentTarget.value.trim() !== "" && suggestions().length > 0,
              );
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              // Don't show suggestions on initial focus, only when typing
              if (document.activeElement === inputRef) {
                setIsOpen(false);
              }
            }}
            onBlur={() => {
              // Keep the dropdown open a bit longer to allow clicking on suggestions
              setTimeout(() => setIsOpen(false), 150);
            }}
            class={props.initialValue !== undefined ? undefined : "pl-10"}
            aria-autocomplete="list"
            aria-controls="suggestions-list"
            aria-expanded={isOpen()}
            aria-activedescendant={
              selectedIndex() >= 0 ? `suggestion-${selectedIndex()}` : undefined
            }
          />
          <Show when={props.initialValue === undefined}>
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </Show>
        </TextFieldRoot>
      </div>

      <Show when={isOpen() && suggestions().length > 0}>
        <div
          ref={suggestionsRef}
          id="suggestions-list"
          class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-lg"
          role="listbox"
        >
          <For each={suggestions()}>
            {(suggestion, index) => (
              <div
                id={`suggestion-${index()}`}
                class={cn(
                  "cursor-pointer px-4 py-2 text-sm",
                  selectedIndex() === index() ? "bg-muted" : "hover:bg-muted",
                )}
                onClick={() => selectItem(suggestion)}
                role="option"
                aria-selected={selectedIndex() === index()}
              >
                {suggestion}
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
