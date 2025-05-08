// src/AppContext.tsx
import {
  createContext,
  useContext,
  JSX,
  onMount,
  createEffect,
  createMemo,
  Accessor,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import { AudioFile, CoverData } from "@/types";
import { open } from "@tauri-apps/plugin-dialog";
import { Channel, invoke } from "@tauri-apps/api/core";
import { convertBase64ToBlob } from "@/utils";

interface AppContextValue {
  audioFiles: Accessor<Record<string, AudioFile>>;
  state: AppState;
  setSelectedCover: (cover: CoverData | null | undefined) => void;
  setAudioFile: (key: string, value: AudioFile | undefined) => void;
  setSelectedFile: (file: string | null) => void;
  addAudioDirectory: (directory?: string) => Promise<void>;
  removeAudioDirectory: (directory: string) => void;
}

type Result<T, E = unknown> = { Ok: T; Err: null } | { Ok: null; Err: E };
type LoadAudioDirValue =
  | { type: "finshed" }
  | { type: "audioFile"; content: Result<AudioFile> };
const AppContext = createContext<AppContextValue>();

interface AppState {
  rawAudioFiles: Record<string, AudioFile>;
  selectedFile: string | null;
  selectedAudioFile: AudioFile | null;
  audioDirectories: Record<string, AudioDirectoryValue>;
  selectedCover: CoverData | null | undefined;
}

interface AudioDirectoryValue {
  scanning: boolean;
  files: string[];
}

export function AppProvider(props: { children: JSX.Element }) {
  // central store
  const [state, setState] = createStore<AppState>({
    rawAudioFiles: {},
    selectedFile: null,
    selectedAudioFile: null,
    audioDirectories: {},
    selectedCover: undefined,
  });

  // derive audioFiles: only those paths tracked in directories
  const audioFilesMemo = createMemo(() => {
    const result: Record<string, AudioFile> = {};
    const dirs = state.audioDirectories;
    for (const dir in dirs) {
      for (const path of dirs[dir].files) {
        const file = state.rawAudioFiles[path];
        if (file) result[path] = file;
      }
    }
    return result;
  });

  // on init, rehydrate list of directories from localStorage
  onMount(async () => {
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
        s.selectedAudioFile = key ? s.rawAudioFiles[key] : null;
        s.selectedCover = undefined;
      }),
    );
  });

  const setAudioFile = (key: string, value: AudioFile | undefined) => {
    setState(
      produce((s) => {
        if (value) {
          s.rawAudioFiles[key] = value;
        } else {
          delete s.rawAudioFiles[key];
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
        s.selectedAudioFile = file ? s.rawAudioFiles[file] : null;
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
        s.audioDirectories[directory] = { scanning: true, files: [] };
      }),
    );

    // channel callback from your Rust/Tauri side
    const onFileProcessed = new Channel<LoadAudioDirValue>((result) => {
      if (result.type === "audioFile") {
        const inner = result.content;
        if (inner.Ok) {
          const audioFile = inner.Ok;
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
              s.audioDirectories[directory!].files.push(audioFile.path);
            }),
          );
        }
      } else {
        // In this case, there are no more items to send over the channel
        setState(
          produce((s) => {
            s.audioDirectories[directory].scanning = false;
          }),
        );
      }
    });

    try {
      await invoke("load_audio_dir", { directory, onFileProcessed });
    } catch (e) {
      console.error("Error adding new audio directory", e);
      setState(
        produce((s) => {
          s.audioDirectories[directory].scanning = false;
        }),
      );
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
    audioFiles: audioFilesMemo,
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
