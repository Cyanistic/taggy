import { createEffect, createSignal, JSX, onMount, Show } from "solid-js";
import { Card, CardContent } from "./ui/card";
import {
  Edit,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-solid";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { useAppContext } from "./AppContext";
import { display, fetchResource } from "@/utils";
import { open } from "@tauri-apps/plugin-dialog";
import { AudioTypes, ImageTypes } from "@/types";
import { invoke } from "@tauri-apps/api/core";

export default function AudioPreview() {
  const { selectedAudioFile, selectedCover, setSelectedCover } =
    useAppContext();
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [currentTime, setCurrentTime] = createSignal(0);
  const [volume, setVolume] = createSignal(0.1);
  const [duration, setDuration] = createSignal(100);
  let audioRef!: HTMLAudioElement;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate: JSX.EventHandler<HTMLAudioElement, Event> = (e) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleLoadedMetadata: JSX.EventHandler<HTMLAudioElement, Event> = (
    e,
  ) => {
    setDuration(e.currentTarget.duration);
  };

  const togglePlayback = () => {
    setIsPlaying((prev) => {
      if (prev) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      return !prev;
    });
  };

  const [audioSrc, setAudioSrc] = createSignal<string | null>(null);
  createEffect(() => {
    (async () => {
      setCurrentTime(0);
      setAudioSrc(
        selectedAudioFile()
          ? await fetchResource(selectedAudioFile()!.path)
          : null,
      );
    })();
  });

  // Make sure the volume is actually synced with the audio element
  onMount(() => {
    audioRef.volume = volume();
  });

  const handleImageSelection: JSX.EventHandler<
    unknown,
    MouseEvent
  > = async () => {
    let newCover = await open({
      directory: false,
      multiple: false,
      filters: [
        {
          name: "Images and Audio Covers",
          extensions: [...ImageTypes, ...AudioTypes],
        },
      ],
    });

    if (!newCover) return;
    if (AudioTypes.some((ext) => newCover?.toLowerCase().endsWith(`.${ext}`))) {
      try {
        newCover = await invoke("get_audio_cover", { path: newCover });
        if (!newCover) return;
        setSelectedCover({ type: "audio", data: newCover });
      } catch (e) {
        console.error(e);
      }
    } else {
      setSelectedCover({ type: "image", path: newCover });
    }
  };

  const clearNewCover = (e: MouseEvent) => {
    e.stopPropagation();
    setSelectedCover(undefined);
  };

  const handleRemoveOriginalCover = (e: MouseEvent) => {
    e.stopPropagation();
    setSelectedCover(null);
  };

  return (
    <Card class="mb-6">
      <Show when={selectedAudioFile()}>
        {(file) => (
          <CardContent class="p-6">
            <div class="flex flex-col items-center">
              {/* Album Art */}
              <div class="mb-4 w-48 h-48 relative group">
                <div class="relative w-full h-full rounded-md overflow-hidden">
                  <Show
                    when={file().cover}
                    fallback={
                      <div class="w-full h-full bg-muted rounded-md flex items-center justify-center transition-all duration-300 group-hover:brightness-50">
                        <Music class="h-16 w-16 text-muted-foreground" />
                      </div>
                    }
                  >
                    {(cover) => (
                      <div class="relative w-full h-full">
                        <img
                          src={cover()}
                          alt={`${file().albumTitle} cover`}
                          class="w-full h-full object-cover rounded-md transition-all duration-300 group-hover:brightness-50"
                        />
                        <button
                          onClick={(e) => handleRemoveOriginalCover(e)}
                          class="z-2 absolute top-2 right-2 p-1.5 rounded-full bg-destructive hover:bg-destructive/90 transition-all duration-300 opacity-0 group-hover:opacity-100"
                          aria-label="Remove existing cover"
                        >
                          <X class="h-4 w-4 text-destructive-foreground" />
                        </button>
                      </div>
                    )}
                  </Show>

                  {/* Edit icon overlay */}
                  <div
                    class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={handleImageSelection}
                  >
                    <Button
                      variant="ghost"
                      class="p-2 rounded-full transition-colors duration-300"
                      aria-label="Edit cover image"
                    >
                      <Edit class="h-6 w-6 text-white" />
                    </Button>
                  </div>

                  {/* New cover preview */}
                  <Show when={selectedCover() !== undefined}>
                    <div class="absolute bottom-2 right-2 w-20 h-20">
                      <div class="relative w-full h-full rounded-md overflow-hidden shadow-lg border-2 border-primary">
                        <Show
                          when={selectedCover()}
                          fallback={
                            <div class="w-full h-full bg-muted flex items-center justify-center">
                              <Music class="h-8 w-8 text-muted-foreground" />
                            </div>
                          }
                        >
                          {(newCover) => (
                            <img
                              src={display(newCover())}
                              alt="New cover preview"
                              class="w-full h-full object-cover"
                            />
                          )}
                        </Show>
                        <button
                          onClick={clearNewCover}
                          class="absolute top-1 right-1 p-1 rounded-full bg-destructive hover:bg-destructive/90 transition-colors duration-200"
                          aria-label="Remove new cover"
                        >
                          <X class="h-4 w-4 text-destructive-foreground" />
                        </button>
                      </div>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Track Info */}
              <div class="text-center mb-4 w-full">
                <h3 class="text-xl font-bold truncate">{file().title}</h3>
                <p class="text-muted-foreground truncate">{file().artist}</p>
              </div>

              <audio
                ref={audioRef}
                src={audioSrc() ?? undefined}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                autoplay={isPlaying()}
                class="hidden"
              />

              {/* Playback Controls */}
              <div class="w-full space-y-2">
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime())}</span>
                  <span>{formatTime(duration())}</span>
                </div>
                <Slider
                  value={[currentTime()]}
                  step={1}
                  minValue={0}
                  maxValue={duration()}
                  onChange={(value) => {
                    const val = value[0];
                    audioRef.currentTime = val;
                    setCurrentTime(val);
                  }}
                  class="w-full"
                />
                <div class="flex items-center justify-center gap-4 mt-2">
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <SkipBack class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    class="h-10 w-10 rounded-full"
                    onClick={togglePlayback}
                  >
                    <Show
                      when={isPlaying()}
                      fallback={<Play class="h-5 w-5 ml-0.5" />}
                    >
                      <Pause class="h-5 w-5" />
                    </Show>
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <SkipForward class="h-4 w-4" />
                  </Button>
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <Volume2 class="h-4 w-4 text-muted-foreground" />
                  <Slider
                    defaultValue={[volume()]}
                    minValue={0}
                    maxValue={1}
                    step={0.01}
                    onChange={(value: number[]) => {
                      const val: number = value[0];
                      audioRef.volume = val;
                      setVolume(val);
                    }}
                    class="w-24 mr-1"
                  />
                  <span class="text-xs text-muted-foreground w-8">
                    {Math.round(volume() * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Show>
    </Card>
  );
}
