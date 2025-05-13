import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp, Save, X } from "lucide-solid";
import { Button } from "./ui/button";
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldLabel,
  TextFieldRoot,
} from "./ui/textfield";
import { createEffect, createMemo, createSignal, JSX, Show } from "solid-js";
import { useAppContext } from "./AppContext";
import { invoke } from "@tauri-apps/api/core";
import { display, formatDateTime, getData, parseDateTime } from "@/utils";
import { TagInput } from "./TagInput";
import { produce } from "solid-js/store";
import { TextArea } from "./ui/textarea";
import { NumericPairInput } from "./NumericPairInput";
import { AudioFile } from "@/types";

export default function TagEditor() {
  const { state, audioFiles, setState, setAudioFile, setSelectedCover } =
    useAppContext();
  const [formData, setFormData] = createSignal(state.selectedAudioFile!);
  const [formError, setFormError] = createSignal<{
    [K in keyof AudioFile]?: string;
  }>({});

  const handleReset = () => {
    setFormData(state.selectedAudioFile!);
  };

  const allArtists = createMemo<string[]>(() =>
    Object.values(audioFiles())
      .flatMap((file) => [file.artist ?? "", ...(file.albumArtists ?? [])])
      .filter(Boolean)
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
      if (Object.values(formError()).some(Boolean)) {
        console.error("Cannot save file, there are errors!");
        return;
      }
      const cover = state.selectedCover;
      const tags = {
        ...formData(),
        cover: cover ? getData(cover) : undefined,
      };
      await invoke("save_audio_tags", {
        tags,
        removeCover: state.selectedCover === null,
      });
      tags.cover = cover ? display(cover) : state.selectedAudioFile?.cover;
      setAudioFile(state.selectedFile!, tags);
      setSelectedCover(undefined);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleShowTags = () => {
    setState(
      produce((s) => {
        s.preferences.showExtraTagFields = !s.preferences.showExtraTagFields;
      }),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle class="text-primary">Edit Tags</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel class="text-primary/90 font-bold">
                Title
              </TextFieldLabel>
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
              <TextFieldLabel class="text-primary/90 font-bold">
                Artist
              </TextFieldLabel>
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
              <TextFieldLabel class="text-primary/90 font-bold">
                Album
              </TextFieldLabel>
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
              <TextFieldLabel class="text-primary/90 font-bold">
                Album Artist
              </TextFieldLabel>
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
            <TextFieldRoot
              validationState={formError().date ? "invalid" : "valid"}
            >
              <TextFieldLabel class="text-primary/90 font-bold">
                Date
              </TextFieldLabel>
              <TextField
                id="date"
                name="date"
                placeholder={
                  state.selectedAudioFile?.date
                    ? formatDateTime(state.selectedAudioFile.date!)
                    : "YYYY/MM/dd@hh:mm:ss"
                }
                value={formData().date ? formatDateTime(formData().date!) : ""}
                onInput={(e) => {
                  const input = e.currentTarget.value;
                  try {
                    setFormData((prev) => ({
                      ...prev,
                      date: input ? parseDateTime(input) : null,
                    }));
                    setFormError((prev) => ({
                      ...prev,
                      date: undefined,
                    }));
                  } catch (e) {
                    setFormError((prev) => ({
                      ...prev,
                      date: (e as Error).message,
                    }));
                    console.error(e);
                  }
                }}
                type="text"
              />
              <div class="h-4 text-xs text-destructive font-extrabold">
                {formError().date}
              </div>
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel class="text-primary/90 font-bold">
                Genre
              </TextFieldLabel>
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
        <Show
          when={state.preferences.showExtraTagFields}
          fallback={
            <div class="flex justify-center">
              <Button
                variant="outline"
                onClick={toggleShowTags}
                class="w-full sm:w-auto border-primary/20 hover:bg-primary/10 hover:text-primary"
              >
                <ChevronUp class="h-4 w-4 mr-2" />
                Show less tags
              </Button>
            </div>
          }
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 mt-2 border-t border-border animate-in fade-in-50 duration-300">
            <div class="space-y-2">
              <TextFieldRoot>
                <TextFieldLabel class="text-primary/90 font-bold">
                  Track Number / Total Tracks
                </TextFieldLabel>
                <NumericPairInput
                  firstLabel="Track Number"
                  secondLabel="Total Tracks"
                  firstValue={formData().trackNumber}
                  secondValue={formData().totalTracks}
                  onFirstChange={(val) =>
                    setFormData((prev) => ({ ...prev, trackNumber: val }))
                  }
                  onSecondChange={(val) =>
                    setFormData((prev) => ({ ...prev, totalTracks: val }))
                  }
                />
              </TextFieldRoot>
            </div>

            <div class="space-y-2">
              <TextFieldRoot>
                <TextFieldLabel class="text-primary/90 font-bold">
                  Disc Number / Total Discs
                </TextFieldLabel>
                <NumericPairInput
                  firstLabel="Disc Number"
                  secondLabel="Total Discs"
                  firstValue={formData().discNumber}
                  secondValue={formData().totalDiscs}
                  onFirstChange={(val) =>
                    setFormData((prev) => ({ ...prev, discNumber: val }))
                  }
                  onSecondChange={(val) =>
                    setFormData((prev) => ({ ...prev, totalDiscs: val }))
                  }
                />
              </TextFieldRoot>
            </div>

            <div class="space-y-2">
              <TextFieldRoot>
                <TextFieldLabel class="text-primary/90 font-bold">
                  Composer
                </TextFieldLabel>
                <TagInput
                  input={formData().composer ?? ""}
                  placeholder={state.selectedAudioFile?.composer ?? ""}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      composer: value,
                    }));
                  }}
                  suggestions={allArtists()}
                />
              </TextFieldRoot>
            </div>

            <div class="space-y-2">
              <TextFieldRoot>
                <TextFieldLabel class="text-primary/90 font-bold">
                  Comment
                </TextFieldLabel>
                <TextArea
                  id="comment"
                  name="comment"
                  value={formData().comment || ""}
                  onInput={handleInputInput}
                  rows={3}
                  class="resize-none"
                />
              </TextFieldRoot>
            </div>
          </div>
          <div class="flex justify-center">
            <Button
              variant="outline"
              onClick={toggleShowTags}
              class="w-full sm:w-auto border-primary/20 hover:bg-primary/10 hover:text-primary"
            >
              <ChevronDown class="h-4 w-4 mr-2" />
              Show all tags
            </Button>
          </div>
        </Show>
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
