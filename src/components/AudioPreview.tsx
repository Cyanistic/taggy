import { createEffect, JSX, onMount, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
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
import { useToast } from "./ToastProvider";

export default function AudioPreview() {
  const { state, setState, setSelectedCover } = useAppContext();

  // consolidate state into a store
  const [audioState, setAudioState] = createStore({
    isPlaying: false,
    currentTime: 0,
    duration: 100,
    audioSrc: null as string | null,
  });
  let audioRef!: HTMLAudioElement;
  const { showError } = useToast();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate: JSX.EventHandler<HTMLAudioElement, Event> = (e) => {
    const t = e.currentTarget.currentTime;
    setAudioState(
      produce((s) => {
        s.currentTime = t;
      }),
    );
  };

  const handleLoadedMetadata: JSX.EventHandler<HTMLAudioElement, Event> = (
    e,
  ) => {
    const d = e.currentTarget.duration;
    setAudioState(
      produce((s) => {
        s.duration = d;
      }),
    );
  };

  const togglePlayback = () => {
    setAudioState(
      produce((s) => {
        if (s.isPlaying) {
          audioRef.pause();
        } else {
          audioRef.play();
        }
        s.isPlaying = !s.isPlaying;
      }),
    );
  };

  // update audio source and reset time when selected file changes
  createEffect(() => {
    (async () => {
      const file = state.selectedAudioFile;
      setAudioState(
        produce((s) => {
          s.currentTime = 0;
          s.duration = 0;
        }),
      );
      const src = file ? await fetchResource(file.path) : null;
      setAudioState(
        produce((s) => {
          s.audioSrc = src;
        }),
      );
    })();
  });

  onMount(() => {
    audioRef.volume = state.preferences.volume;
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
        showError("Error retrieving audio cover", (e as Error).message, e);
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
    <Card class="mb-6 h-full">
      <Show when={state.selectedAudioFile}>
        {(file) => (
          <CardContent class="p-6 h-full w-full overflow-visible">
            <div class="flex flex-col items-center min-h-0 flex-1 w-full h-full">
              {/* Album Art */}
              <div class="mb-4 max-w-full max-h-full min-h-0 min-w-0 relative aspect-square flex-1 flex justify-center items-center">
                <div class="relative w-full rounded-md aspect-square overflow-hidden group">
                  <Show
                    when={file().cover}
                    fallback={
                      <div class="w-full bg-muted rounded-md flex items-center justify-center aspect-square transition-all duration-300 group-hover:brightness-50">
                        <Music class="h-16 w-16 text-muted-foreground" />
                      </div>
                    }
                  >
                    {(cover) => (
                      <>
                        <img
                          src={cover()}
                          alt={`${file().albumTitle} cover`}
                          class="w-full object-contain rounded-md transition-all duration-300 group-hover:brightness-50"
                        />
                        <button
                          onClick={handleRemoveOriginalCover}
                          class="z-2 absolute top-2 right-2 p-1.5 rounded-full bg-destructive hover:bg-destructive/90 transition-all duration-300 opacity-0 group-hover:opacity-100"
                          aria-label="Remove existing cover"
                        >
                          <X class="h-4 w-4 text-destructive-foreground" />
                        </button>
                      </>
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
                  <Show when={state.selectedCover !== undefined}>
                    <div class="absolute bottom-2 right-2 w-20 h-20">
                      <div class="relative w-full h-full rounded-md overflow-hidden shadow-lg border-2 border-primary">
                        <Show
                          when={state.selectedCover}
                          fallback={
                            <div class="w-full h-full bg-muted flex items-center justify-center">
                              <Music class="h-8 w-8 text-muted-foreground" />
                            </div>
                          }
                        >
                          {(newCover) => (
                            <img
                              src={display(newCover()!)}
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
                src={audioState.audioSrc ?? undefined}
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onLoadedData={handleLoadedMetadata}
                onEnded={() =>
                  setAudioState(
                    produce((s) => {
                      s.isPlaying = false;
                    }),
                  )
                }
                autoplay={audioState.isPlaying}
                class="hidden"
                controls
              />

              {/* Playback Controls */}
              <div class="w-full space-y-2">
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatTime(audioState.currentTime)}</span>
                  <span>{formatTime(audioState.duration)}</span>
                </div>
                <Slider
                  value={[audioState.currentTime]}
                  step={1}
                  minValue={0}
                  maxValue={audioState.duration}
                  onChange={(value) => {
                    const val = value[0];
                    audioRef.currentTime = val;
                    setAudioState(
                      produce((s) => {
                        s.currentTime = val;
                      }),
                    );
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
                      when={audioState.isPlaying}
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
                    value={[state.preferences.volume]}
                    minValue={0}
                    maxValue={1}
                    step={0.01}
                    onChange={(value: number[]) => {
                      const val: number = value[0];
                      audioRef.volume = val;
                      setState(
                        produce((s) => {
                          s.preferences.volume = val;
                        }),
                      );
                    }}
                    class="w-24 mr-1"
                  />
                  <span class="text-xs text-muted-foreground w-8">
                    {Math.round(state.preferences.volume * 100)}%
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
