import { AudioFile } from "@/types";
import { createSignal, Show } from "solid-js";
import TagEditor from "./TagEditor";
import AudioList from "./AudioList";
import AudioPreview from "./AudioPreview";

export function TagMenu() {
  const [audioFiles, setAudioFiles] = createSignal<Record<string, AudioFile>>(
    {},
  );
  const [selectedFile, setSelectedFile] = createSignal<string | null>(null);

  return (
    <div class="flex flex-col md:flex-row h-screen">
      {/* Left side - Preview and Tag Editor */}
      <div class="w-full md:w-1/2 p-4 border-r border-border overflow-y-auto">
        <Show
          when={selectedFile()}
          fallback={
            <div class="flex items-center justify-center h-full">
              <p class="text-muted-foreground">
                Select an audio file to edit tags
              </p>
            </div>
          }
        >
          {(selectedFile) => (
            <>
              <AudioPreview file={audioFiles()[selectedFile()]} />
              <TagEditor
                file={audioFiles()[selectedFile()]}
                // onUpdate={handleTagUpdate}
              />
            </>
          )}
        </Show>
      </div>

      {/* Right side - File List */}
      <div class="w-full md:w-1/2 p-4 overflow-y-auto">
        <AudioList
          files={audioFiles()}
          selectedFile={selectedFile() ?? undefined}
          onSelect={setSelectedFile}
        />
      </div>
    </div>
  );
}
