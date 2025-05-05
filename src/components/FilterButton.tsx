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
import { createSignal } from "solid-js";

export default function FilterButton() {
  const [searchFields, setSearchFields] = createSignal({
    title: true,
    artist: true,
    album: true,
    genre: false,
  });
  return (
    <DropdownMenu>
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
          <DropdownMenuCheckboxItem
            checked={searchFields().title}
            onChange={(checked) =>
              setSearchFields((prev) => ({ ...prev, title: checked }))
            }
            class="focus:bg-primary/10"
          >
            Title
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={searchFields().artist}
            onChange={(checked) =>
              setSearchFields((prev) => ({ ...prev, artist: checked }))
            }
            class="focus:bg-primary/10"
          >
            Artist
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={searchFields().album}
            onChange={(checked) =>
              setSearchFields((prev) => ({ ...prev, album: checked }))
            }
            class="focus:bg-primary/10"
          >
            Album
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={searchFields().genre}
            onChange={(checked) =>
              setSearchFields((prev) => ({ ...prev, genre: checked }))
            }
            class="focus:bg-primary/10"
          >
            Genre
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
