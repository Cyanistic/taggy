import {
  createContext,
  createSignal,
  useContext,
  JSX,
  Accessor,
  onMount,
  createEffect,
  Setter,
} from "solid-js";
import { AudioFile, CoverData } from "@/types";
import { open } from "@tauri-apps/plugin-dialog";
import { Channel, invoke } from "@tauri-apps/api/core";
import { convertBase64ToBlob } from "@/utils";

interface AppContextValue {
  audioFiles: Accessor<Record<string, AudioFile>>;
  selectedFile: Accessor<string | null>;
  selectedAudioFile: Accessor<AudioFile | null>;
  audioDirectories: Accessor<Set<string>>;
  selectedCover: Accessor<CoverData | null | undefined>;
  setSelectedCover: Setter<CoverData | null | undefined>;
  setAudioFile: (key: string, value: AudioFile | undefined) => void;
  setSelectedFile: (file: string | null) => void;
  addAudioDirectory: (directory?: string) => Promise<void>;
  removeAudioDirectory: (directory: string) => void;
}

type Result<T, E = unknown> = { Ok: T; Err: null } | { Ok: null; Err: E };
const AppContext = createContext<AppContextValue>();

export function AppProvider(props: { children: JSX.Element }) {
  const [audioFiles, setAudioFiles] = createSignal<Record<string, AudioFile>>(
    {},
  );
  const [selectedFile, updateSelectedFile] = createSignal<string | null>(null);
  // Use undefined to indicate unchanged and null to indicate cover removed
  const [selectedCover, setSelectedCover] = createSignal<
    CoverData | null | undefined
  >(undefined);
  const [selectedAudioFile, updateSelectedAudioFile] =
    createSignal<AudioFile | null>(null);
  const [audioDirectories, setAudioDirectories] = createSignal<Set<string>>(
    new Set(),
  );
  onMount(() => {
    (async () => {
      try {
        const dirs = localStorage.getItem("audioDirectories");
        if (!dirs) return;
        const audioDirectories = JSON.parse(dirs);
        if (!Array.isArray(audioDirectories)) return;
        const results = await Promise.allSettled(
          (audioDirectories as string[]).map(
            async (dir) => await addAudioDirectory(dir),
          ),
        );
        console.log(results);
      } catch (e) {
        console.error("Error loading existing audio directories", e);
      }
    })();
  });

  createEffect(() => {
    selectedFile();
    setSelectedCover(undefined);
  });

  createEffect(() => {
    const selected = selectedFile();
    updateSelectedAudioFile(selected ? audioFiles()[selected] : null);
  });

  createEffect(() => {
    localStorage.setItem(
      "audioDirectories",
      JSON.stringify([...audioDirectories()]),
    );
  });

  const setSelectedFile = (file: string | null) => {
    updateSelectedFile(file);
    updateSelectedAudioFile(file ? audioFiles()[file] : null);
  };

  const setAudioFile = (key: string, value: AudioFile | undefined) => {
    setAudioFiles((prev) => {
      if (!value) {
        const temp = { ...prev };
        delete temp[key];
        return temp;
      } else {
        return { ...prev, [key]: value };
      }
    });
  };

  // Can be used to add or refresh a directory
  const addAudioDirectory = async (directory?: string) => {
    if (!directory) {
      directory =
        (await open({
          title: "Select your music directory",
          directory: true,
          multiple: false,
        })) ?? undefined;
    }
    if (!directory) return;

    const onFileProcessed = new Channel<Result<AudioFile>>((result) => {
      if (result.Ok) {
        const audioFile = result.Ok;
        if (audioFile.cover) {
          audioFile.cover = URL.createObjectURL(
            convertBase64ToBlob(audioFile.cover),
          );
        }
        setAudioFiles((prev) => ({
          ...prev,
          [audioFile.path]: audioFile,
        }));
      } else {
        console.error(result.Err);
      }
    });
    try {
      await invoke("load_audio_dir", {
        directory,
        onFileProcessed,
      });
      setAudioDirectories((prev) => {
        // if it’s already in there, no-op
        if (prev.has(directory)) return prev;
        const next = new Set(prev);
        next.add(directory);
        return next;
      });
    } catch (e) {
      console.error("Error adding new audio directory", e);
    }
  };

  const removeAudioDirectory = (directory: string) => {
    if (!audioDirectories().has(directory)) return;
    setAudioDirectories((prev) => {
      const next = new Set(prev);
      next.delete(directory);
      for (const dir of next) {
        // The removed directory is a child of the others
        // so there are no audio files to remove
        if (directory.startsWith(dir)) {
          return next;
        }
      }
      setAudioFiles((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([path]) => {
            // The path starts with the directory so we need
            // to remove it if there are no child paths that also
            // start with it.
            if (path.startsWith(directory)) {
              for (const dir of next) {
                if (path.startsWith(dir)) {
                  return false;
                }
              }
            }
            return true;
          }),
        ),
      );
      return next;
    });
  };

  const value: AppContextValue = {
    audioFiles,
    selectedFile,
    setSelectedFile,
    selectedAudioFile,
    audioDirectories,
    addAudioDirectory,
    selectedCover,
    setSelectedCover,
    setAudioFile,
    removeAudioDirectory,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
