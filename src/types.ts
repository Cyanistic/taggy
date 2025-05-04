export interface AudioFile {
  path: string;
  title?: string;
  artist?: string;
  cover?: string;
  albumTitle?: string;
  albumArtist?: string;
  year?: number;
  genre?: string;
}

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
