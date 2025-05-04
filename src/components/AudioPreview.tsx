import { createEffect, createSignal, JSX, onMount, Show } from "solid-js";
import { Card, CardContent } from "./ui/card";
import {
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-solid";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { useAppContext } from "./AppContext";
import { fetchResource } from "@/utils";

export default function AudioPreview() {
  const { selectedAudioFile } = useAppContext();
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

  return (
    <Card class="mb-6">
      <Show when={selectedAudioFile()}>
        {(file) => (
          <CardContent class="p-6">
            <div class="flex flex-col items-center">
              {/* Album Art */}
              <div class="mb-4 w-48 h-48 relative">
                <Show
                  when={file().cover}
                  fallback={
                    <div class="w-full h-full bg-muted rounded-md flex items-center justify-center">
                      <Music class="h-16 w-16 text-muted-foreground" />
                    </div>
                  }
                >
                  <img
                    src={
                      file().cover
                        ? `data:image/jpg;base64,${file().cover}`
                        : "/placeholder.svg"
                    }
                    alt={`${file().albumTitle} cover`}
                    class="w-full h-full object-cover rounded-md"
                  />
                </Show>
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
                onLoadedMetadata={handleLoadedMetadata}
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
                    onChange={(value) => {
                      const val = value[0];
                      audioRef.volume = val;
                      setVolume(val);
                    }}
                    class="w-24"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Show>
    </Card>
  );
}
