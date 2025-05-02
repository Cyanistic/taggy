import { AudioFile } from "@/types";
import { createSignal, Show } from "solid-js";
import TagEditor from "./TagEditor";
import AudioList from "./AudioList";
import AudioPreview from "./AudioPreview";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { FolderPlus } from "lucide-solid";

export function TagMenu() {
  const [audioFiles, setAudioFiles] = createSignal<Record<string, AudioFile>>(
    {},
  );
  const [selectedFile, setSelectedFile] = createSignal<string | null>(null);
  const [audioDirectories, setAudioDirectories] = createSignal<string[]>([]);

  const addAudioDirectory = async () => {
    const selected = await open({
      title: "Select your music directory",
      directory: true,
      multiple: false,
    });
    if (!selected) return;
    const newFiles: Record<string, AudioFile> = await invoke("load_audio_dir", {
      directory: selected,
    });
    setAudioFiles({ ...audioFiles(), ...newFiles });
    setAudioDirectories([...audioDirectories(), selected]);
  };

  return (
    <div class="flex flex-col md:flex-row h-screen">
      {/* Left side - Preview and Tag Editor */}
      <div class="w-full md:w-1/2 p-4 border-r border-border overflow-y-auto">
        <Show
          when={audioDirectories().length}
          fallback={
            <div class="flex flex-col items-center justify-center h-full gap-4">
              <p class="text-muted-foreground">
                Please add an audio directory to check for audio files
              </p>
              <Button onClick={addAudioDirectory}>
                <FolderPlus class="mr-2" />
                Select Audio Directory
              </Button>
            </div>
          }
        >
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
        </Show>
      </div>

      {/* Right side - File List */}
      <div class="w-full md:w-1/2 p-4 overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Audio Files</h2>
          <Button onClick={addAudioDirectory}>
            <FolderPlus class="mr-2" />
            Select Audio Directory
          </Button>
        </div>
        <AudioList
          files={audioFiles()}
          selectedFile={selectedFile() ?? undefined}
          onSelect={(e) => {
            console.log(e);
            setSelectedFile(e);
          }}
        />
      </div>
    </div>
  );
}
