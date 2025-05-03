import { createSignal, For } from "solid-js";
import { Checkbox, CheckboxControl, CheckboxLabel } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Funnel } from "lucide-solid";
import { createEffect } from "solid-js";

export interface FilterField {
  key: string;
  label: string;
  enabled: boolean;
}

interface FilterPopoverProps {
  onChange: (fields: FilterField[]) => void;
  fields: FilterField[];
}

export function FilterPopover(props: FilterPopoverProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [localFields, setLocalFields] = createSignal<FilterField[]>(
    props.fields,
  );

  createEffect(() => setLocalFields(props.fields));

  const handleChange = (key: string, enabled: boolean) => {
    const updated = localFields().map((field) =>
      field.key === key ? { ...field, enabled } : field,
    );
    setLocalFields(updated);
    props.onChange(updated);
  };

  const handleSelectAll = () => {
    const allSelected = localFields().every((field) => field.enabled);
    const updated = localFields().map((field) => ({
      ...field,
      enabled: !allSelected,
    }));
    setLocalFields(updated);
    props.onChange(updated);
  };

  return (
    <Popover open={isOpen()} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button
          variant="ghost"
          size="icon"
          class="ml-1 h-9 w-9 border"
          aria-label="Filter search fields"
        >
          <Funnel class="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-4">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium">Search in fields</h4>
            <Button
              variant="ghost"
              size="sm"
              class="text-xs h-auto px-2 py-1"
              onClick={handleSelectAll}
            >
              {localFields().every((field) => field.enabled)
                ? "Unselect All"
                : "Select All"}
            </Button>
          </div>
          <div class="space-y-2">
            <For each={localFields()}>
              {(field) => (
                <div class="flex items-center">
                  <Checkbox
                    checked={field.enabled}
                    onChange={(checked) => handleChange(field.key, checked)}
                    id={`filter-${field.key}`}
                    class="flex items-center space-x-2"
                  >
                    <CheckboxControl />
                    <CheckboxLabel for={`filter-${field.key}`}>
                      {field.label}
                    </CheckboxLabel>
                  </Checkbox>
                </div>
              )}
            </For>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
