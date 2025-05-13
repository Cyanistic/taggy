import { FileAudio, FolderOpen, Upload } from "lucide-solid";
import { Show } from "solid-js";
import { Motion, Presence } from "solid-motionone";

interface DragDropOverlayProps {
  isVisible: boolean;
  isDraggingDirectory: boolean;
}

export function DragOverlay(props: DragDropOverlayProps) {
  return (
    <Presence>
      <Show when={props.isVisible}>
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          class="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none"
        >
          <Motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            class="bg-background/95 border-2 border-dashed border-primary rounded-lg p-8 shadow-lg max-w-md w-full text-center"
          >
            <Show
              when={props.isDraggingDirectory}
              fallback={
                <>
                  <div class="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FileAudio class="h-8 w-8 text-primary" />
                  </div>
                  <h3 class="text-xl font-bold mb-2">Drop Audio Files</h3>
                  <p class="text-muted-foreground mb-4">
                    Drop audio files here to add them to your current collection
                  </p>
                </>
              }
            >
              <div class="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FolderOpen class="h-8 w-8 text-primary" />
              </div>
              <h3 class="text-xl font-bold mb-2">Drop Directory</h3>
              <p class="text-muted-foreground mb-4">
                Drop the directory to add all audio files inside it to your
                collection
              </p>
            </Show>
            <div class="flex items-center justify-center gap-2 text-sm text-primary">
              <Upload class="h-4 w-4" />
              <span>Files will be added to your current session</span>
            </div>
          </Motion.div>
        </Motion.div>
      </Show>
    </Presence>
  );
}
