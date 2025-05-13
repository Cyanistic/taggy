export interface AudioFile {
  path: string;
  title?: string;
  artist?: string;
  cover?: string;
  albumTitle?: string;
  albumArtists?: string[];
  genre?: string;
  date?: Timestamp | null;
  // Extra fields
  trackNumber?: number;
  discNumber?: number;
  totalTracks?: number;
  totalDiscs?: number;
  comment?: string;
  composer?: string;
}

export type CoverData =
  | { type: "image"; path: string }
  | { type: "audio"; data: string };

export const ImageTypes = ["png", "jpeg", "jpg", "tiff", "gif"];
export const AudioTypes = [
  "mp3",
  "flac",
  ".mp4",
  ".m4a",
  ".m4p",
  ".m4b",
  ".m4r",
  ".m4v",
];

export type Timestamp = {
  year: number; // i32
  month?: number; // u8 (1–12)
  day?: number; // u8 (1–31)
  hour?: number; // u8 (0–23)
  minute?: number; // u8 (0–59)
  second?: number; // u8 (0–59)
};
