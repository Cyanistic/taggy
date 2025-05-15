import { Funnel } from "lucide-solid";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { For } from "solid-js";

export interface FilterField {
  field: string;
  label: string;
}

export interface FilterProps {
  fields: string[];
  onChange?: (checked: boolean, label: string) => void;
}

export const FILTER_FIELDS: FilterField[] = [
  { field: "title", label: "Title" },
  { field: "artist", label: "Artist" },
  { field: "albumTitle", label: "Album" },
  { field: "albumArtists", label: "Album Artist" },
  { field: "genre", label: "Genre" },
  { field: "date.year", label: "Year" },
  { field: "path", label: "File Path" },
];

export const DEFAULT_FILTER_FIELDS: string[] = ["title", "artist"];

export default function FilterButton(props: FilterProps) {
  return (
    <DropdownMenu placement="bottom">
      <DropdownMenuTrigger>
        <Button
          variant="outline"
          size="icon"
          class="hover:border-primary/50 hover:text-primary"
        >
          <Funnel class="h-4 w-4" />
          <span class="sr-only">Filter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-48 justify-end">
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Search in</DropdownMenuGroupLabel>
          <DropdownMenuSeparator />
          <For each={FILTER_FIELDS}>
            {(field) => (
              <DropdownMenuCheckboxItem
                checked={props.fields.includes(field.field)}
                onChange={(checked) => props.onChange?.(checked, field.field)}
                class="focus:bg-primary/10"
              >
                {field.label}
              </DropdownMenuCheckboxItem>
            )}
          </For>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
