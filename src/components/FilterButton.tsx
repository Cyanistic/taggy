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
  enabled: boolean;
}

export interface FilterProps {
  fields: FilterField[];
  onChange?: (checked: boolean, index: number) => void;
}

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
          <For each={props.fields}>
            {(field, index) => (
              <DropdownMenuCheckboxItem
                checked={field.enabled}
                onChange={(checked) => props.onChange?.(checked, index())}
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
