import { Show } from "solid-js";
import TagEditor from "./TagEditor";
import AudioList from "./AudioList";
import AudioPreview from "./AudioPreview";
import { useAppContext } from "./AppContext";
import { DragOverlay } from "./DragOverlay";
import { EmptyStateGuide } from "./EmptySelection";

export function TagMenu() {
  const { state, setSelectedFile } = useAppContext();

  return (
    <div class="flex flex-col md:flex-row h-screen">
      <DragOverlay isVisible={state.dragging} isDraggingDirectory={true} />
      {/* Left side - Preview and Tag Editor */}
      <div class="w-full md:w-1/2 p-4 border-r border-border h-full flex flex-col overflow-hidden">
        <Show when={state.selectedAudioFile} fallback={<EmptyStateGuide />}>
          <AudioPreview />
          <TagEditor />
        </Show>
      </div>

      {/* Right side - File List */}
      <div class="w-full md:w-1/2 p-4 overflow-y-auto">
        <AudioList
          selectedFile={state.selectedFile ?? undefined}
          onSelect={(e: string) => {
            setSelectedFile(e);
          }}
        />
      </div>
    </div>
  );
}
