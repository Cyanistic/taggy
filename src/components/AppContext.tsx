import {
  createContext,
  useContext,
  JSX,
  onMount,
  createEffect,
  createMemo,
  Accessor,
} from "solid-js";
import { createStore, produce, SetStoreFunction } from "solid-js/store";
import { AudioFile, CoverData } from "@/types";
import { open } from "@tauri-apps/plugin-dialog";
import { Channel, invoke } from "@tauri-apps/api/core";
import { convertBase64ToBlob } from "@/utils";
import { DEFAULT_FILTER_FIELDS, FilterField } from "./FilterButton";
import { DEFAULT_SORT_CRITERIA, SortCriterion } from "./SortButton";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { stat } from "@tauri-apps/plugin-fs";
import { useToast } from "./ToastProvider";

interface AppContextValue {
  audioFiles: Accessor<Record<string, AudioFile>>;
  state: AppState;
  setSelectedCover: (cover: CoverData | null | undefined) => void;
  setAudioFile: (key: string, value: AudioFile | undefined) => void;
  setSelectedFile: (file: string | null) => void;
  addAudioDirectory: (directory?: string) => Promise<void>;
  removeAudioDirectory: (directory: string) => void;
  setState: SetStoreFunction<AppState>;
}

interface Preferences {
  filterFields: FilterField[];
  sortCriteria: SortCriterion[];
  volume: number;
  showExtraTagFields: boolean;
  panelSizes: {
    outer: number[];
    inner: number[];
  };
}

interface StoredPreferences extends Preferences {
  audioDirectories?: string[];
}

export const DEFAULT_PREFERENCES: Preferences = {
  filterFields: DEFAULT_FILTER_FIELDS,
  sortCriteria: DEFAULT_SORT_CRITERIA,
  volume: 0.1,
  showExtraTagFields: false,
  panelSizes: { outer: [50, 50], inner: [50, 50] },
};

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
  preferences: Preferences;
  dragging: boolean;
  draggingDirectory: boolean;
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
    preferences: structuredClone(DEFAULT_PREFERENCES),
    dragging: false,
    draggingDirectory: false,
  });

  const { showError } = useToast();

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
      const preferencesRaw = localStorage.getItem("preferences");
      if (!preferencesRaw) return;
      const preferences: StoredPreferences = {
        ...DEFAULT_PREFERENCES,
        ...JSON.parse(preferencesRaw),
      };
      const audioDirs = preferences.audioDirectories || [];
      delete preferences.audioDirectories;
      // Fallback to default preferences if parsing any fields fail
      setState(
        produce((s) => {
          s.preferences = preferences;
        }),
      );
      for (const dir of audioDirs) {
        await addAudioDirectory(dir);
      }
    } catch (e) {
      showError(
        "Error loading existing audio directories",
        (e as Error).message,
        e,
      );
    }
  });

  onMount(async () => {
    await getCurrentWindow().onDragDropEvent(async (e) => {
      if (e.payload.type === "enter") {
        setState(
          produce((s) => {
            s.dragging = true;
          }),
        );
      } else if (e.payload.type === "drop") {
        setState(
          produce((s) => {
            s.dragging = false;
          }),
        );
        Promise.allSettled(
          e.payload.paths.map(async (p) => {
            try {
              const info = await stat(p);
              if (info.isDirectory) {
                await addAudioDirectory(p);
              }
            } catch (e) {
              showError(`Error loading "${p}"`, (e as Error).message, e);
            }
          }),
        );
      } else if (e.payload.type === "leave") {
        setState(
          produce((s) => {
            s.dragging = false;
          }),
        );
      }
    });
  });

  // Update the user's preferences whenever the preferences change
  createEffect(() => {
    const preferences: StoredPreferences = {
      ...state.preferences,
      filterFields: state.preferences.filterFields.filter((f) => f.enabled),
      audioDirectories: Object.keys(state.audioDirectories),
    };
    localStorage.setItem("preferences", JSON.stringify(preferences));
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
          if (s.selectedFile === key) {
            s.selectedAudioFile = value;
          }
        } else {
          delete s.rawAudioFiles[key];
          // if you just deleted the currently‐selected file, clear selection
          if (s.selectedFile === key) {
            s.selectedFile = null;
            s.selectedAudioFile = null;
          }
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
      showError(
        `Error fetching audio directory ${directory}`,
        (e as Error).message,
        e,
      );
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
    setState,
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
