export interface AudioFile {
  path: string;
  title?: string;
  artist?: string;
  cover?: string;
  albumTitle?: string;
  albumArtists?: string[];
  year?: number;
  genre?: string;
  // Extra fields
  trackNumber?: number;
  discNumber?: number;
  totalTracks?: number;
  totalDiscs?: number;
  comment?: string;
  composer?: string;
  date?: string;
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
