import {
  createContext,
  createSignal,
  useContext,
  JSX,
  Accessor,
  onMount,
} from "solid-js";
import { AudioFile } from "@/types";
import { open } from "@tauri-apps/plugin-dialog";
import { Channel, invoke } from "@tauri-apps/api/core";

interface AppContextValue {
  audioFiles: Accessor<Record<string, AudioFile>>;
  selectedFile: Accessor<string | null>;
  selectedAudioFile: Accessor<AudioFile | null>;
  audioDirectories: Accessor<string[]>;
  setSelectedFile: (file: string | null) => void;
  addAudioDirectory: () => Promise<void>;
}

type Result<T, E = unknown> = { Ok: T; Err: null } | { Ok: null; Err: E };
const AppContext = createContext<AppContextValue>();

export function AppProvider(props: { children: JSX.Element }) {
  const [audioFiles, setAudioFiles] = createSignal<Record<string, AudioFile>>(
    {},
  );
  const [selectedFile, updateSelectedFile] = createSignal<string | null>(null);
  const [selectedAudioFile, updateSelectedAudioFile] =
    createSignal<AudioFile | null>(null);
  const [audioDirectories, setAudioDirectories] = createSignal<string[]>([]);
  let onFileProcessed!: Channel<Result<AudioFile>>;
  onMount(() => {
    onFileProcessed = new Channel<Result<AudioFile>>((result) => {
      if (result.Ok) {
        const audioFile = result.Ok;
        setAudioFiles((prev) => ({
          ...prev,
          [audioFile.path]: audioFile,
        }));
      } else {
        console.error(result.Err);
      }
    });
  });

  const setSelectedFile = (file: string | null) => {
    updateSelectedFile(file);
    updateSelectedAudioFile(file ? audioFiles()[file] : null);
  };

  const addAudioDirectory = async () => {
    const selected = await open({
      title: "Select your music directory",
      directory: true,
      multiple: false,
    });
    if (!selected) return;
    const newFiles: Record<string, AudioFile> = await invoke("load_audio_dir", {
      directory: selected,
      onFileProcessed,
    });
    setAudioFiles({ ...audioFiles(), ...newFiles });
    setAudioDirectories([...audioDirectories(), selected]);
  };

  const value: AppContextValue = {
    audioFiles,
    selectedFile,
    setSelectedFile,
    selectedAudioFile,
    audioDirectories,
    addAudioDirectory,
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
