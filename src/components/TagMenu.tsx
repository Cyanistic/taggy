import { Show } from "solid-js";
import TagEditor from "./TagEditor";
import AudioList from "./AudioList";
import AudioPreview from "./AudioPreview";
import { Button } from "./ui/button";
import { FolderPlus } from "lucide-solid";
import { useAppContext } from "./AppContext";

export function TagMenu() {
  const {
    audioFiles,
    selectedAudioFile,
    selectedFile,
    setSelectedFile,
    audioDirectories,
    addAudioDirectory,
  } = useAppContext();

  return (
    <div class="flex flex-col md:flex-row h-screen">
      {/* Left side - Preview and Tag Editor */}
      <div class="w-full h-screen md:w-1/2 p-4 border-r border-border overflow-y-auto">
        <Show
          when={audioDirectories().size}
          fallback={
            <div class="flex flex-col items-center justify-center h-full gap-4">
              <p class="text-muted-foreground">
                Please add an audio directory to check for audio files
              </p>
              <Button onClick={() => addAudioDirectory()}>
                <FolderPlus class="mr-2" />
                Select Audio Directory
              </Button>
            </div>
          }
        >
          <Show
            when={selectedAudioFile()}
            fallback={
              <div class="flex items-center justify-center h-full">
                <p class="text-muted-foreground">
                  Select an audio file to edit tags
                </p>
              </div>
            }
          >
            <AudioPreview />
            <TagEditor />
          </Show>
        </Show>
      </div>

      {/* Right side - File List */}
      <div class="w-full md:w-1/2 p-4 overflow-y-auto">
        <AudioList
          selectedFile={selectedFile() ?? undefined}
          onSelect={(e: string) => {
            setSelectedFile(e);
          }}
        />
      </div>
    </div>
  );
}
