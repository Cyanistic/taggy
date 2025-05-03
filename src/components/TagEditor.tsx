import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music, Save, Upload, X } from "lucide-solid";
import { Button } from "./ui/button";
import { TextField, TextFieldLabel, TextFieldRoot } from "./ui/textfield";
import { createEffect, createSignal, JSX, Show } from "solid-js";
import { useAppContext } from "./AppContext";

export default function TagEditor() {
  const { selectedAudioFile } = useAppContext();
  const [formData, setFormData] = createSignal(selectedAudioFile()!);
  createEffect(() => {
    console.log(selectedAudioFile());
    setFormData(selectedAudioFile()!);
  });

  const handleInputInput: JSX.EventHandler<HTMLInputElement, Event> = (e) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value || undefined }));
  };

  const handleSave: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (
    _e,
  ) => {};

  const removeCoverArt = () => {
    setFormData((prev) => ({ ...prev, coverArt: null }));
  };

  const handleCoverArtUpload = () => {};

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
                value={formData().title}
                onInput={handleInputInput}
                type="text"
              />
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Artist</TextFieldLabel>
              <TextField
                id="artist"
                name="artist"
                value={formData().artist}
                onInput={handleInputInput}
                type="text"
              />
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Album</TextFieldLabel>
              <TextField
                id="albumTitle"
                name="albumTitle"
                value={formData().albumTitle}
                onInput={handleInputInput}
                type="text"
              />
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Album Artist</TextFieldLabel>
              <TextField
                id="albumArtist"
                name="albumArtist"
                value={formData().albumArtist}
                onInput={handleInputInput}
                type="text"
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
                onInput={handleInputInput}
                type="number"
              />
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Genre</TextFieldLabel>
              <TextField
                id="genre"
                name="genre"
                value={formData().genre}
                onInput={handleInputInput}
                type="text"
              />
            </TextFieldRoot>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-4">
              <div class="w-24 h-24 relative border rounded-md overflow-hidden">
                <Show
                  when={formData().cover}
                  fallback={
                    <div class="w-full h-full bg-muted flex items-center justify-center">
                      <Music class="h-8 w-8 text-muted-foreground" />
                    </div>
                  }
                >
                  <>
                    <img
                      src={
                        formData().cover
                          ? `data:image/jpg;base64,${formData().cover}`
                          : "/placeholder.svg"
                      }
                      alt="Album cover"
                      class="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      class="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={removeCoverArt}
                    >
                      <X class="h-3 w-3" />
                    </Button>
                  </>
                </Show>
              </div>
              <Button variant="outline" onClick={handleCoverArtUpload}>
                <Upload class="h-4 w-4 mr-2" />
                Upload Cover
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Show
          when={
            // Only show the save changes button if there are changes to be saved
            JSON.stringify(formData()) !== JSON.stringify(selectedAudioFile())
          }
        >
          <Button class="w-full" onClick={handleSave}>
            <Save class="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </Show>
      </CardFooter>
    </Card>
  );
}
