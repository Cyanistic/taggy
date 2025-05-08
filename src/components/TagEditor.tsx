import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, X } from "lucide-solid";
import { Button } from "./ui/button";
import { TextField, TextFieldLabel, TextFieldRoot } from "./ui/textfield";
import { createEffect, createMemo, createSignal, JSX, Show } from "solid-js";
import { useAppContext } from "./AppContext";
import { invoke } from "@tauri-apps/api/core";
import { display, getData } from "@/utils";
import { TagInput } from "./TagInput";

export default function TagEditor() {
  const { state, audioFiles, setAudioFile, setSelectedCover } = useAppContext();
  const [formData, setFormData] = createSignal(state.selectedAudioFile!);

  const handleReset = () => {
    setFormData(state.selectedAudioFile!);
  };

  const allArtists = createMemo(() =>
    Object.values(audioFiles())
      .filter((file) => file.artist)
      .map((file) => file.artist!)
      .filter((artist, index, self) => self.indexOf(artist) === index),
  );

  const allAlbums = createMemo(() =>
    Object.values(audioFiles())
      .filter((file) => file.albumTitle)
      .map((file) => file.albumTitle!)
      .filter((album, index, self) => self.indexOf(album) === index),
  );

  const allGenres = createMemo(() =>
    Object.values(audioFiles())
      .filter((file) => file.genre)
      .map((file) => file.genre!)
      .filter((genre, index, self) => self.indexOf(genre) === index),
  );

  createEffect(() => {
    handleReset();
  });

  const handleInputInput: JSX.EventHandler<HTMLInputElement, Event> = (e) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value || undefined }));
  };

  const handleSave: JSX.EventHandler<
    HTMLButtonElement,
    MouseEvent
  > = async () => {
    try {
      const cover = state.selectedCover;
      const tags = {
        ...formData(),
        cover: cover ? getData(cover) : undefined,
      };
      await invoke("save_audio_tags", {
        tags,
        removeCover: state.selectedCover === null,
      });
      tags.cover = cover ? display(cover) : undefined;
      setAudioFile(state.selectedFile!, tags);
      setSelectedCover(undefined);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Tags</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Title</TextFieldLabel>
              <TextField
                id="title"
                name="title"
                value={formData().title || ""}
                placeholder={state.selectedAudioFile?.title}
                onInput={handleInputInput}
                type="text"
              />
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Artist</TextFieldLabel>
              <TagInput
                input={formData().artist ?? ""}
                placeholder={state.selectedAudioFile?.artist ?? ""}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    artist: value,
                  }));
                }}
                suggestions={allArtists()}
              />
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Album</TextFieldLabel>
              <TagInput
                input={formData().albumTitle ?? ""}
                placeholder={state.selectedAudioFile?.albumTitle ?? ""}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    albumTitle: value,
                  }));
                }}
                suggestions={allAlbums()}
              />
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Album Artist</TextFieldLabel>
              <TagInput
                input={formData().albumArtists ?? []}
                placeholder="Search artists..."
                onSelect={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    albumArtists: Array.isArray(value) ? value : [value],
                  }));
                }}
                suggestions={allArtists()}
              />
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Year</TextFieldLabel>
              <TextField
                id="year"
                name="year"
                value={formData().year}
                placeholder={state.selectedAudioFile?.year}
                onInput={handleInputInput}
                type="number"
              />
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Genre</TextFieldLabel>
              <TagInput
                input={formData().genre ?? ""}
                placeholder={state.selectedAudioFile?.genre ?? ""}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    genre: value,
                  }));
                }}
                suggestions={allGenres()}
              />
            </TextFieldRoot>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Show
          when={
            // Only show the save changes button if there are changes to be saved
            JSON.stringify(formData()) !==
              JSON.stringify(state.selectedAudioFile) ||
            state.selectedCover !== undefined
          }
        >
          <div class="flex w-full space-x-4">
            <Button class="w-full" onClick={handleSave}>
              <Save class="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="secondary" class="w-full" onClick={handleReset}>
              <X class="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </Show>
      </CardFooter>
    </Card>
  );
}
