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
  audioDirectories: Accessor<string[]>;
  selectedCover: Accessor<CoverData | null | undefined>;
  setSelectedCover: Setter<CoverData | null | undefined>;
  setAudioFile: (key: string, value: AudioFile | undefined) => void;
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
  // Use undefined to indicate unchanged and null to indicate cover removed
  const [selectedCover, setSelectedCover] = createSignal<
    CoverData | null | undefined
  >(undefined);
  const [selectedAudioFile, updateSelectedAudioFile] =
    createSignal<AudioFile | null>(null);
  const [audioDirectories, setAudioDirectories] = createSignal<string[]>([]);
  let onFileProcessed!: Channel<Result<AudioFile>>;
  onMount(() => {
    onFileProcessed = new Channel<Result<AudioFile>>((result) => {
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
  });

  createEffect(() => {
    selectedFile();
    setSelectedCover(undefined);
  });

  createEffect(() => {
    const selected = selectedFile();
    updateSelectedAudioFile(selected ? audioFiles()[selected] : null);
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
    selectedCover,
    setSelectedCover,
    setAudioFile,
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
