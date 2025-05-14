import { Show } from "solid-js";
import TagEditor from "./TagEditor";
import AudioList from "./AudioList";
import AudioPreview from "./AudioPreview";
import { useAppContext } from "./AppContext";
import { DragOverlay } from "./DragOverlay";
import { EmptyStateGuide } from "./EmptySelection";
import { Splitter } from "@ark-ui/solid/splitter";

export function TagMenu() {
  const { state, setSelectedFile } = useAppContext();

  return (
    <div class="md:flex-row h-screen flex flex-col">
      <DragOverlay isVisible={state.dragging} isDraggingDirectory={true} />
      <Splitter.Root
        panels={[
          { id: "left", minSize: 20 },
          { id: "right", minSize: 30, collapsible: true },
        ]}
        class="h-full w-full"
      >
        {/* Left side - Preview and Tag Editor */}
        <Splitter.Panel
          id="left"
          class="w-full md:w-1/2 h-full flex flex-col overflow-hidden"
        >
          <Show when={state.selectedAudioFile} fallback={<EmptyStateGuide />}>
            <Splitter.Root
              panels={[{ id: "preview" }, { id: "editor" }]}
              orientation="vertical"
              class="h-full"
            >
              <Splitter.Panel id="preview">
                <AudioPreview />
              </Splitter.Panel>
              <Splitter.ResizeTrigger
                id="preview:editor"
                aria-label="Resize"
                class="w-full h-1.5 my-2 flex rounded justify-center hover:bg-primary/20 active:bg-primary/30"
              >
                <div class="w-12 h-1.5 bg-secondary rounded" />
              </Splitter.ResizeTrigger>
              <Splitter.Panel id="editor">
                <TagEditor />
              </Splitter.Panel>
            </Splitter.Root>
          </Show>
        </Splitter.Panel>

        <Splitter.ResizeTrigger
          id="left:right"
          aria-label="Resize"
          class="h-full w-1.5 mx-2 flex flex-col rounded justify-center hover:bg-primary/20 active:bg-primary/30"
        >
          <div class="h-12 w-1.5 bg-secondary rounded" />
        </Splitter.ResizeTrigger>
        {/* Right side - File List */}
        <Splitter.Panel
          id="right"
          class="w-full md:w-1/2 p-4 overflow-y-auto border-l"
        >
          <AudioList
            selectedFile={state.selectedFile ?? undefined}
            onSelect={(e: string) => {
              setSelectedFile(e);
            }}
          />
        </Splitter.Panel>
      </Splitter.Root>
    </div>
  );
}
