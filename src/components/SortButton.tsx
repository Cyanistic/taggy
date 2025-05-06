import {
  GripVertical,
  ArrowDown,
  ArrowUp,
  Plus,
  ArrowUpDown,
  X,
} from "lucide-solid";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/cn";
import { createEffect, createSignal, For, Show } from "solid-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuGroupLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  createSortable,
  closestCenter,
  useDragDropContext,
  transformStyle,
  Id,
} from "@thisbeyond/solid-dnd";
import { DropdownMenu as DropdownMenuPrimitive } from "@kobalte/core/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { JSX } from "solid-js";

export interface SortCriterion {
  label: string;
  field: string;
  direction: "asc" | "desc";
}

export const DEFUALT_SORT_CRITERIA: SortCriterion[] = [
  { label: "Best Match", field: "score", direction: "asc" },
  { label: "Title", field: "title", direction: "asc" },
];

interface SortableCriteriaListProps {
  criteria: SortCriterion[];
  onChange: (newCriteria: SortCriterion[]) => void;
  onRemove?: (field: string) => void;
}

interface SortOption {
  label: string;
  value: string;
}

interface EnhancedSortDropdownProps {
  sortOptions: SortOption[];
  onChange: (criteria: SortCriterion[]) => void;
}

interface SortableProps {
  item: Id;
  children: JSX.Element;
}

function Sortable(props: SortableProps) {
  const sortable = createSortable(props.item);
  const context = useDragDropContext();
  const state = context && context[0];
  return (
    <div
      //@ts-expect-error no types lol
      use:sortable
      ref={sortable.ref}
      style={transformStyle(sortable.transform)}
      class="sortable"
      classList={{
        "opacity-25": sortable.isActiveDraggable,
        "transition-transform": !!state?.active.draggable,
      }}
    >
      {props.children}
    </div>
  );
}

export function SortDropdown(props: EnhancedSortDropdownProps) {
  const [sortCriteria, setSortCriteria] = createSignal<SortCriterion[]>(
    (() => {
      // Try to load from localStorage
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("audioTagger.sortCriteria");
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (e) {
            console.error("Failed to parse saved sort criteria:", e);
          }
        }
      }
      // Default if nothing saved
      return DEFUALT_SORT_CRITERIA;
    })(),
  );

  // Update parent component when criteria changes
  createEffect(() => {
    props.onChange(sortCriteria());
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "audioTagger.sortCriteria",
        JSON.stringify(sortCriteria()),
      );
    }
  });

  const handleAddCriterion = (field: string) => {
    const option = props.sortOptions.find((opt) => opt.value === field);
    if (!option) return;

    // Check if already exists
    if (sortCriteria().some((c) => c.field === field)) {
      return; // Don't add duplicates
    }

    setSortCriteria([
      ...sortCriteria(),
      {
        label: option.label,
        field,
        direction: "asc",
      },
    ]);
  };

  const handleResetCriteria = () => {
    setSortCriteria(DEFUALT_SORT_CRITERIA);
  };

  const handleCriteriaChange = (newCriteria: SortCriterion[]) => {
    setSortCriteria(newCriteria);
  };

  const handleRemoveCriterion = (field: string) => {
    // Don't allow removing the last criterion
    if (sortCriteria().length <= 1) return;
    setSortCriteria(sortCriteria().filter((c) => c.field !== field));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="outline"
          class="flex gap-1.5 items-center hover:border-primary/50 hover:text-primary group"
        >
          <ArrowUpDown class="h-4 w-4" />
          <span class="hidden sm:inline">Sort</span>
          <Show when={sortCriteria().length > 1}>
            <Badge
              variant="secondary"
              class="h-5 ml-1 group-hover:bg-primary/10 bg-accent text-accent-foreground"
            >
              {sortCriteria().length}
            </Badge>
          </Show>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-64 justify-end">
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel title="Order your sorting criteria in priority from highest to lowest">
            Sort criteria
          </DropdownMenuGroupLabel>
          <DropdownMenuSeparator />

          {/* Display sortable list of current criteria */}
          <div class="max-h-[200px] overflow-auto">
            <SortableCriteriaList
              criteria={sortCriteria()}
              onChange={handleCriteriaChange}
              onRemove={handleRemoveCriterion}
            />
          </div>

          <DropdownMenuSeparator />

          {/* Add new criterion */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger class="cursor-pointer focus:bg-primary/10">
              <Plus class="mr-2 h-4 w-4" />
              <span>Add criterion</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPrimitive.Portal>
              <DropdownMenuSubContent class="min-w-[8rem]">
                <For each={props.sortOptions}>
                  {(option) => (
                    <DropdownMenuItem
                      class={
                        sortCriteria().some((c) => c.field === option.value)
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer focus:bg-primary/10"
                      }
                      disabled={sortCriteria().some(
                        (c) => c.field === option.value,
                      )}
                      onClick={() => handleAddCriterion(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  )}
                </For>
              </DropdownMenuSubContent>
            </DropdownMenuPrimitive.Portal>
          </DropdownMenuSub>

          {/* Reset to defaults */}
          <DropdownMenuItem
            onClick={handleResetCriteria}
            class="cursor-pointer focus:bg-primary/10"
          >
            Reset to default
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SortableCriteriaList(props: SortableCriteriaListProps) {
  const [activeItem, setActiveItem] = createSignal<SortCriterion | null>(null);
  const handleDirectionToggle = (index: number) => {
    const newCriteria = [...props.criteria];
    newCriteria[index] = {
      ...newCriteria[index],
      direction: newCriteria[index].direction === "asc" ? "desc" : "asc",
    };
    props.onChange(newCriteria);
  };

  const onDragStart = ({ draggable }: { draggable: { id: string } }) => {
    setActiveItem(props.criteria.find((c) => c.field === draggable.id) ?? null);
  };

  const onDragEnd = ({
    draggable,
    droppable,
  }: {
    draggable: { id: string };
    droppable: { id: string };
  }) => {
    if (draggable && droppable) {
      const fromIndex = props.criteria.findIndex(
        (c) => c.field === draggable.id,
      );
      const toIndex = props.criteria.findIndex((c) => c.field === droppable.id);
      if (fromIndex !== toIndex) {
        const updatedItems = props.criteria.slice();
        updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));
        props.onChange(updatedItems);
      }
      setActiveItem(null);
    }
  };

  return (
    <div class="space-y-1 py-1">
      <Show
        when={props.criteria.length > 0}
        fallback={
          <div class="px-2 py-4 text-center text-sm text-muted-foreground">
            No sorting props.criteria added
          </div>
        }
      >
        <DragDropProvider
          //@ts-expect-error no types lol
          onDragStart={onDragStart}
          //@ts-expect-error no types lol
          onDragEnd={onDragEnd}
          collisionDetector={closestCenter}
        >
          <DragDropSensors />
          <div class="space-y-1">
            <SortableProvider ids={props.criteria.map((c) => c.field)}>
              <For each={props.criteria}>
                {(criterion, index) => (
                  <Sortable item={criterion.field}>
                    <CriterionRow
                      field={criterion.field}
                      label={criterion.label}
                      direction={criterion.direction}
                      showRemove={props.criteria.length > 1 && !activeItem()}
                      onRemove={props.onRemove}
                      onClick={() => handleDirectionToggle(index())}
                    />
                  </Sortable>
                )}
              </For>
            </SortableProvider>
          </div>
          <DragOverlay class="z-50">
            <Show when={activeItem()}>
              {(criterion) => (
                <CriterionRow
                  field={criterion().field}
                  label={criterion().label}
                  direction={criterion().direction}
                  onRemove={props.onRemove}
                />
              )}
            </Show>
          </DragOverlay>
        </DragDropProvider>
      </Show>
    </div>
  );
}

function CriterionRow(
  props: SortCriterion & {
    onClick?: () => void;
    showRemove?: boolean;
    onRemove?: (field: string) => void;
  },
) {
  return (
    <div class="group border border-input rounded-md bg-background flex items-center px-2 py-1.5 cursor-grab active:cursor-grabbing">
      <div class="mr-2 touch-none text-muted-foreground flex-shrink-0">
        <GripVertical class="h-4 w-4" />
      </div>
      <span class="text-sm flex-1 truncate">{props.label}</span>
      <Show when={props.showRemove}>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          onClick={() => props.onRemove?.(props.field)}
          title="Remove props"
        >
          <X class="h-3.5 w-3.5" />
        </Button>
      </Show>
      <Button
        variant="ghost"
        size="icon"
        class={cn(
          "h-6 w-6 ml-2",
          props.direction === "asc" ? "text-primary" : "text-primary/80",
        )}
        onClick={props.onClick}
        title={props.direction === "asc" ? "Ascending" : "Descending"}
      >
        <Show
          when={props.direction === "asc"}
          fallback={<ArrowDown class="h-3.5 w-3.5" />}
        >
          <ArrowUp class="h-3.5 w-3.5" />
        </Show>
      </Button>
    </div>
  );
}
