import { convertFileSrc } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { CoverData, Timestamp } from "./types";

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

const DATE_TIME_REGEX =
  /^(\d{4})(?:\/(\d{2})(?:\/(\d{2})(?:\s*(?:T|@| )\s*(\d{2})(?::(\d{2})(?::(\d{2}))?)?)?)?)?$/;

export function parseDateTime(input: string): Timestamp {
  const match = DATE_TIME_REGEX.exec(input);
  if (!match) {
    throw new Error(`Invalid date-time format: ${input}`);
  }
  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;

  const year = parseInt(yearStr, 10);
  const result: Timestamp = { year };

  if (monthStr !== undefined) {
    const month = parseInt(monthStr, 10);
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month value: ${month}`);
    }
    result.month = month;
  }

  if (dayStr !== undefined) {
    const day = parseInt(dayStr, 10);
    if (day < 1 || day > 31) {
      throw new Error(`Invalid day value: ${day}`);
    }
    result.day = day;
  }

  if (hourStr !== undefined) {
    const hour = parseInt(hourStr, 10);
    if (hour < 0 || hour > 23) {
      throw new Error(`Invalid hour value: ${hour}`);
    }
    result.hour = hour;
  }

  if (minuteStr !== undefined) {
    const minute = parseInt(minuteStr, 10);
    if (minute < 0 || minute > 59) {
      throw new Error(`Invalid minute value: ${minute}`);
    }
    result.minute = minute;
  }

  if (secondStr !== undefined) {
    const second = parseInt(secondStr, 10);
    if (second < 0 || second > 59) {
      throw new Error(`Invalid second value: ${second}`);
    }
    result.second = second;
  }

  return result;
}

export function formatDateTime(parts: Timestamp): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");

  // Year is mandatory to produce anything
  if (parts.year == null) return "";

  let out = String(parts.year);

  // Month
  if (parts.month == null) return out;
  out += "/" + pad2(parts.month);

  // Day
  if (parts.day == null) return out;
  out += "/" + pad2(parts.day);

  // Hour
  if (parts.hour == null) return out;
  out += "@" + pad2(parts.hour);

  // Minute
  if (parts.minute == null) return out;
  out += ":" + pad2(parts.minute);

  // Second
  if (parts.second == null) return out;
  out += ":" + pad2(parts.second);

  return out;
}
