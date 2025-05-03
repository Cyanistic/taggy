import { AudioFile } from "@/types";
import { createSignal, Show } from "solid-js";
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

interface AudioPreviewProps {
  file: AudioFile;
}

interface AudioData {
  duration: number;
}

export default function AudioPreview(props: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [currentTime, setCurrentTime] = createSignal(0);
  const duration = 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlayback = () => {};

  return (
    <Card class="mb-6">
      <CardContent class="p-6">
        <div class="flex flex-col items-center">
          {/* Album Art */}
          <div class="mb-4 w-48 h-48 relative">
            <Show
              when={props.file.cover}
              fallback={
                <div class="w-full h-full bg-muted rounded-md flex items-center justify-center">
                  <Music class="h-16 w-16 text-muted-foreground" />
                </div>
              }
            >
              <img
                src={
                  props.file.cover
                    ? `data:image/jpg;base64,${props.file.cover}`
                    : "/placeholder.svg"
                }
                alt={`${props.file.albumTitle} cover`}
                class="w-full h-full object-cover rounded-md"
              />
            </Show>
          </div>

          {/* Track Info */}
          <div class="text-center mb-4 w-full">
            <h3 class="text-xl font-bold truncate">{props.file.title}</h3>
            <p class="text-muted-foreground truncate">{props.file.artist}</p>
          </div>

          {/* Playback Controls */}
          <div class="w-full space-y-2">
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime())}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Slider
              value={[currentTime()]}
              step={1}
              minValue={1}
              maxValue={duration}
              onChange={(value) => setCurrentTime(value[0])}
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
                defaultValue={[80]}
                minValue={0}
                maxValue={100}
                step={1}
                class="w-24"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
