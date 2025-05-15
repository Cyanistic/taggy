import {
  FileAudio,
  FolderOpen,
  FolderPlus,
  HelpCircle,
  Music,
  Tag,
} from "lucide-solid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Show } from "solid-js";
import { useAppContext } from "./AppContext";

export function EmptyStateGuide() {
  const { state, addAudioDirectory } = useAppContext();

  return (
    <div class="h-full flex flex-col items-center justify-center p-6 border rounded">
      <Show
        when={Object.keys(state.audioDirectories).length}
        fallback={
          <Card class="w-full max-w-md border-primary/20">
            <CardContent class="pt-6">
              <div class="text-center mb-6">
                <div class="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <FolderOpen class="h-8 w-8 text-primary" />
                </div>
                <h2 class="text-2xl font-bold mb-2">No Music Directories</h2>
                <p class="text-muted-foreground">
                  Add a music directory to get started with tagging your audio
                  files.
                </p>
              </div>

              <div class="flex flex-col items-center justify-center h-full gap-4">
                <p class="text-muted-foreground">
                  Please add an audio directory to check for audio files
                </p>
                <Button onClick={() => addAudioDirectory()}>
                  <FolderPlus class="mr-2" />
                  Select Audio Directory
                </Button>
              </div>

              <div class="mt-6 space-y-3">
                <h3 class="text-sm font-medium flex items-center gap-1.5">
                  <HelpCircle class="h-4 w-4 text-primary" />
                  <span>Quick Tips</span>
                </h3>
                <ul class="text-sm text-muted-foreground space-y-2">
                  <li class="flex items-start gap-2">
                    <span class="text-primary mt-0.5">•</span>
                    <span>
                      You can also drag and drop folders directly into the
                      application
                    </span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-primary mt-0.5">•</span>
                    <span>Supported audio formats: MP3, FLAC, MP4, M4A</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-primary mt-0.5">•</span>
                    <span>
                      Your changes are saved automatically to the audio files
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div class="text-center max-w-md">
          <div class="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Music class="h-8 w-8 text-primary" />
          </div>
          <h2 class="text-2xl font-bold mb-3">No File Selected</h2>
          <p class="text-muted-foreground mb-6">
            Select an audio file from the list on the right to view and edit its
            metadata.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <Card class="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent class="p-4 flex items-start gap-3">
                <div class="mt-1 bg-primary/10 p-1.5 rounded-md">
                  <Tag class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-medium mb-1">Edit Tags</h3>
                  <p class="text-sm text-muted-foreground">
                    Modify artist, album, genre and other metadata for your
                    audio files
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card class="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent class="p-4 flex items-start gap-3">
                <div class="mt-1 bg-primary/10 p-1.5 rounded-md">
                  <FileAudio class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-medium mb-1">Preview Audio</h3>
                  <p class="text-sm text-muted-foreground">
                    Listen to your audio files while editing their metadata
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div class="mt-6 text-sm text-muted-foreground">
            <p>
              You can also drag and drop files directly into the application to
              add them to your collection.
            </p>
          </div>
        </div>
      </Show>
    </div>
  );
}
