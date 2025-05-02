import { createSignal } from "solid-js";
import logo from "./assets/logo.svg";
import { invoke } from "@tauri-apps/api/core";
import "@/styles/globals.css";
import { TagMenu } from "./components/AudioTagger";

function App() {
  return <TagMenu />;
}

export default App;
