import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useAppContext } from "./AppContext";
import { For } from "solid-js";
import { FolderPlus, FolderX, Plus, RefreshCw } from "lucide-solid";

export default function DirectoryButton() {
  const { state, addAudioDirectory, removeAudioDirectory } = useAppContext();
  return (
    <DropdownMenu placement="bottom">
      <DropdownMenuTrigger>
        <Button
          variant="outline"
          size="icon"
          class="bg-background border-primary/20 hover:bg-accent hover:text-accent-foreground"
        >
          <FolderPlus class="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Audio Directories</DropdownMenuGroupLabel>
          <DropdownMenuSeparator />
          <For
            each={Object.entries(state.audioDirectories)}
            fallback={
              <div class="px-2 py-1.5 text-sm text-muted-foreground">
                No directories added
              </div>
            }
          >
            {([directory, value]) => (
              <DropdownMenuItem class="flex justify-between items-center">
                <span class="truncate max-w-[200px]" title={directory}>
                  {directory}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => addAudioDirectory(directory)}
                  class="h-6 w-6 ml-2"
                  disabled={value.scanning}
                >
                  <RefreshCw
                    class={`h-4 w-4 ${value.scanning ? "animate-spin" : ""}`}
                  />
                  <span class="sr-only">Rescan directory</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAudioDirectory(directory)}
                  class="h-6 w-6 ml-2"
                >
                  <FolderX class="h-3.5 w-3.5" />
                  <span class="sr-only">Remove directory</span>
                </Button>
              </DropdownMenuItem>
            )}
          </For>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="cursor-pointer"
          onClick={() => addAudioDirectory()}
        >
          Add Directory <Plus class="ml-auto pl-2" />
        </DropdownMenuItem>
        <DropdownMenuItem
          class="cursor-pointer"
          onClick={() =>
            Promise.allSettled(
              Object.keys(state.audioDirectories).map(
                async (dir) => await addAudioDirectory(dir),
              ),
            )
          }
          disabled={!Object.keys(state.audioDirectories).length}
        >
          Rescan all directories <RefreshCw class="ml-auto pl-2" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
