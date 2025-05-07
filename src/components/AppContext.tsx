// src/AppContext.tsx
import {
  createContext,
  useContext,
  JSX,
  onMount,
  createEffect,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import { AudioFile, CoverData } from "@/types";
import { open } from "@tauri-apps/plugin-dialog";
import { Channel, invoke } from "@tauri-apps/api/core";
import { convertBase64ToBlob } from "@/utils";

interface AppContextValue {
  state: AppState,
  setSelectedCover: (cover: CoverData | null | undefined) => void;
  setAudioFile: (key: string, value: AudioFile | undefined) => void;
  setSelectedFile: (file: string | null) => void;
  addAudioDirectory: (directory?: string) => Promise<void>;
  removeAudioDirectory: (directory: string) => void;
}

type Result<T, E = unknown> = { Ok: T; Err: null } | { Ok: null; Err: E };
const AppContext = createContext<AppContextValue>();

interface AppState {
  audioFiles: Record<string, AudioFile>;
  selectedFile: string | null;
  selectedAudioFile: AudioFile | null;
  audioDirectories: Record<string, string[]>;
  selectedCover: CoverData | null | undefined;
}

interface AudioDirectoryValue {
  scanning: boolean;
  files: string[];
}

export function AppProvider(props: { children: JSX.Element }) {
  // central store
  const [state, setState] = createStore<AppState>({
    audioFiles: {},
    selectedFile: null,
    selectedAudioFile: null,
    audioDirectories: {},
    selectedCover: undefined,
  });

  // on init, rehydrate list of directories from localStorage
  onMount(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("audioDirectories");
        if (!raw) return;
        const dirs: string[] = JSON.parse(raw);
        for (const dir of dirs) {
          await addAudioDirectory(dir);
        }
      } catch (e) {
        console.error("Error loading existing audio directories", e);
      }
    })();
  });

  // persist only the *keys* (the directory paths)
  createEffect(() => {
    localStorage.setItem(
      "audioDirectories",
      JSON.stringify(Object.keys(state.audioDirectories)),
    );
  });

  // when you pick a file, clear cover and update the selected AudioFile
  createEffect(() => {
    const key = state.selectedFile;
    setState(
      produce((s) => {
        s.selectedAudioFile = key ? s.audioFiles[key] : null;
        s.selectedCover = undefined;
      }),
    );
  });

  const setAudioFile = (key: string, value: AudioFile | undefined) => {
    setState(
      produce((s) => {
        if (value) {
          s.audioFiles[key] = value;
        } else {
          delete s.audioFiles[key];
        }
        // if you just deleted the currently‐selected file, clear selection
        if (s.selectedFile === key) {
          s.selectedFile = null;
          s.selectedAudioFile = null;
        }
      }),
    );
  };

  const setSelectedFile = (file: string | null) => {
    setState(
      produce((s) => {
        s.selectedFile = file;
        s.selectedAudioFile = file ? s.audioFiles[file] : null;
      }),
    );
  };

  const setSelectedCover = (cover: CoverData | null | undefined) => {
    setState(
      produce((s) => {
        s.selectedCover = cover;
      }),
    );
  };

  const addAudioDirectory = async (directory?: string) => {
    if (!directory) {
      directory =
        (await open({
          title: "Select your music directory",
          directory: true,
        })) || undefined;
    }
    if (!directory) return;

    // initialize the array for this directory
    setState(
      produce((s) => {
        s.audioDirectories[directory!] = [];
      }),
    );

    // channel callback from your Rust/Tauri side
    const onFileProcessed = new Channel<Result<AudioFile>>((result) => {
      if (result.Ok) {
        const audioFile = result.Ok;
        // wire up cover blob URL
        if (audioFile.cover) {
          audioFile.cover = URL.createObjectURL(
            convertBase64ToBlob(audioFile.cover),
          );
        }
        // stash in flat map
        setAudioFile(audioFile.path, audioFile);
        // *and* track under this directory
        setState(
          produce((s) => {
            s.audioDirectories[directory!].push(audioFile.path);
          }),
        );
      }
    });

    try {
      await invoke("load_audio_dir", { directory, onFileProcessed });
    } catch (e) {
      console.error("Error adding new audio directory", e);
    }
  };

  const removeAudioDirectory = (directory: string) => {
    if (!(directory in state.audioDirectories)) return;

    setState(
      produce((s) => {
        // delete the directory entry
        delete s.audioDirectories[directory];
      }),
    );
  };

  const contextValue: AppContextValue = {
    state,
    setSelectedCover,
    setAudioFile,
    setSelectedFile,
    addAudioDirectory,
    removeAudioDirectory,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {props.children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
