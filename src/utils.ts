import { convertFileSrc } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { CoverData } from "./types";

export async function fetchResource(url: string) {
  const assetURL = convertFileSrc(url);
  if (platform() !== "linux") {
    return assetURL;
  }
  // Use workaround for Linux file URLs
  // Reference: https://github.com/tauri-apps/tauri/issues/3725#issuecomment-2325248116
  // Note that using this only works for audio files and .webm videos
  return URL.createObjectURL(await fetch(assetURL).then((res) => res.blob()));
}

export function display(cover: CoverData) {
  if (cover.type === "audio") {
    return cover.data;
  }
  return convertFileSrc(cover.path);
}

export function getData(cover: CoverData){
  if (cover.type === "audio") {
    return cover.data;
  }
  return cover.path;
}
