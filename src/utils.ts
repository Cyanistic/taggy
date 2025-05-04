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

export function getData(cover: CoverData) {
  if (cover.type === "audio") {
    return cover.data;
  }
  return cover.path;
}

// Copied from: https://stackoverflow.com/a/55257089
export function convertBase64ToBlob(base64Image: string) {
  // Split into two parts
  const parts = base64Image.split(";base64,");

  // Hold the content type
  const imageType = parts[0].split(":")[1];

  // Decode Base64 string
  const decodedData = window.atob(parts[1]);

  const buffer = Uint8Array.from(decodedData, (c) => c.charCodeAt(0));
  // Return BLOB image after conversion
  return new Blob([buffer], { type: imageType });
}
