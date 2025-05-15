use std::{
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
};

use audiotags::{AudioTag, MimeType, Picture, Tag};
use base64::{Engine, engine::general_purpose};
use error::AppError;
use id3::Timestamp;
use serde::{Deserialize, Serialize};
use serde_nested_with::serde_nested;
use tauri::ipc::Channel;
use walkdir::WalkDir;

pub mod error;

use crate::error::Result;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_audio_dir,
            get_audio_cover,
            save_audio_tags
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Serde calls this the definition of the remote type. It is just a copy of the
// remote data structure. The `remote` attribute gives the path to the actual
// type we intend to derive code for.
#[derive(Serialize, Deserialize)]
#[serde(remote = "Timestamp")]
struct TimestampDef {
    pub year: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub month: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub day: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub minute: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub second: Option<u8>,
}

#[serde_nested]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AudioFile {
    path: PathBuf,
    #[serde(skip_serializing_if = "Option::is_none")]
    title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    artist: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cover: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    album_title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    album_artists: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    genre: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    comment: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    total_discs: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    total_tracks: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    disc_number: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    track_number: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    composer: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde_nested(sub = "Timestamp", serde(with = "TimestampDef"))]
    date: Option<Timestamp>,
}

/// Conitnue macro to handle errors in a more concise way.
macro_rules! cont {
    ($stmt:expr) => {
        match ($stmt) {
            Ok(k) => k,
            Err(_) => continue,
        }
    };
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase", tag = "type", content = "content")]
enum LoadAudioDirValue {
    Finshed,
    AudioFile(Result<AudioFile>),
}

#[tauri::command(rename_all = "camelCase")]
fn load_audio_file(path: PathBuf) -> Result<AudioFile> {
    let tags: Box<dyn AudioTag> = Tag::new().read_from_path(&path)?;
    Ok(AudioFile {
        path,
        title: tags.title().map(|t| t.into()),
        artist: tags.artist().map(|t| t.into()),
        cover: tags.album_cover().and_then(|cover| {
            let data = general_purpose::STANDARD.encode(cover.data);
            if data == "AA==" {
                return None;
            };
            Some(format!(
                "data:{};base64,{}",
                Into::<&'static str>::into(cover.mime_type),
                data
            ))
        }),
        album_title: tags.album_title().map(|t| t.into()),
        album_artists: tags
            .album_artists()
            .map(|t| t.iter().map(|&a| a.into()).collect()),
        genre: tags.genre().map(|t| t.into()),
        composer: tags.composer().map(|t| t.into()),
        comment: tags.comment().map(|t| t.into()),
        total_discs: tags.total_discs(),
        total_tracks: tags.total_tracks(),
        disc_number: tags.disc_number(),
        track_number: tags.track_number(),
        date: tags.date().or_else(|| {
            tags.year().map(|y| Timestamp {
                year: y,
                month: None,
                day: None,
                hour: None,
                minute: None,
                second: None,
            })
        }),
    })
}

#[tauri::command(rename_all = "camelCase")]
fn load_audio_dir(directory: PathBuf, on_file_processed: Channel<LoadAudioDirValue>) {
    // Spawn a thread to process the files in the directory and prevent blocking the main thread
    std::thread::spawn(move || {
        for entry in WalkDir::new(directory).follow_links(true) {
            let entry = match entry {
                Ok(k) => k,
                Err(e)
                    if e.io_error()
                        .is_some_and(|e| e.kind() == ErrorKind::NotFound) =>
                {
                    continue;
                }
                Err(e) => {
                    let _ = on_file_processed.send(LoadAudioDirValue::AudioFile(Err(e.into())));
                    continue;
                }
            };
            let _ = on_file_processed.send(LoadAudioDirValue::AudioFile(Ok(cont!(
                load_audio_file(entry.path().to_path_buf())
            ))));
        }
        let _ = on_file_processed.send(LoadAudioDirValue::Finshed);
    });
}

#[tauri::command(rename_all = "camelCase", async)]
fn get_audio_cover(path: &Path) -> Result<Option<String>> {
    Ok(Tag::new()
        .read_from_path(path)?
        .album_cover()
        .and_then(|cover| {
            let data = general_purpose::STANDARD.encode(cover.data);
            if data == "AA==" {
                return None;
            };
            Some(format!(
                "data:{};base64,{}",
                Into::<&'static str>::into(cover.mime_type),
                data
            ))
        }))
}

#[tauri::command(rename_all = "camelCase", async)]
fn save_audio_tags(tags: AudioFile, remove_cover: bool) -> Result<()> {
    let mut new_tags = Tag::new().read_from_path(&tags.path)?;
    match tags.album_artists {
        Some(artists) => new_tags.set_album_artist(&artists.join(new_tags.config().sep_artist)),
        None => new_tags.remove_album_artist(),
    }
    match tags.album_title {
        Some(title) => new_tags.set_album_title(&title),
        None => new_tags.remove_album_title(),
    }
    match tags.artist {
        Some(artist) => new_tags.set_artist(&artist),
        None => new_tags.remove_artist(),
    }
    match tags.genre {
        Some(genre) => new_tags.set_genre(&genre),
        None => new_tags.remove_genre(),
    }
    match tags.title {
        Some(genre) => new_tags.set_title(&genre),
        None => new_tags.remove_title(),
    }
    match tags.disc_number {
        Some(disc_number) => new_tags.set_disc_number(disc_number),
        None => new_tags.remove_disc_number(),
    }
    match tags.total_discs {
        Some(total_discs) => new_tags.set_total_discs(total_discs),
        None => new_tags.remove_total_discs(),
    }
    match tags.track_number {
        Some(track_number) => new_tags.set_track_number(track_number),
        None => new_tags.remove_track_number(),
    }
    match tags.total_tracks {
        Some(total_tracks) => new_tags.set_total_tracks(total_tracks),
        None => new_tags.remove_total_tracks(),
    }
    match tags.composer {
        Some(composer) => new_tags.set_composer(composer),
        None => new_tags.remove_composer(),
    }
    match tags.comment {
        Some(comment) => new_tags.set_comment(comment),
        None => new_tags.remove_comment(),
    }
    match tags.date {
        Some(date) => new_tags.set_date(date),
        None => new_tags.remove_date(),
    }
    if remove_cover {
        new_tags.remove_album_cover();
    } else if let Some(cover) = tags.cover {
        if let Some(cover) = cover.strip_prefix("data:") {
            let mime_end = cover
                .find(';')
                .ok_or(AppError::UserError("Invalid base64 image type!".into()))?;
            let mime = match &cover[..mime_end] {
                "image/jpeg" => MimeType::Jpeg,
                "image/png" => MimeType::Png,
                "image/tiff" => MimeType::Tiff,
                "image/bmp" => MimeType::Bmp,
                "image/gif" => MimeType::Gif,
                _ => return Err(AppError::UserError("Invalid base64 image type!".into())),
            };
            let image_data = general_purpose::STANDARD.decode(
                &cover[cover
                    .find(',')
                    .ok_or(AppError::UserError("Invalid base64 image type!".into()))?
                    + 1..],
            )?;
            new_tags.set_album_cover(Picture::new(&image_data, mime));
        } else {
            let mime = match &cover[cover
                .rfind('.')
                .ok_or(AppError::UserError("Invalid image type!".into()))?
                + 1..]
            {
                "png" => MimeType::Png,
                "jpeg" | "jpg" => MimeType::Jpeg,
                "tiff" => MimeType::Tiff,
                "gif" => MimeType::Gif,
                "bmp" => MimeType::Bmp,
                _ => return Err(AppError::UserError("Invalid image type!".into())),
            };
            new_tags.set_album_cover(Picture::new(&fs::read(cover)?, mime));
        }
    }
    // Must use `write_to_path` instead of `write_to` because the latter
    // breaks the audio file for some reason
    new_tags.write_to_path(&tags.path.display().to_string())?;
    Ok(())
}
