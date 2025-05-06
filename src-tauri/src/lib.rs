use std::{
    fs::self,
    io::ErrorKind,
    path::{Path, PathBuf},
};

use audiotags::{AudioTag, MimeType, Picture, Tag};
use base64::{Engine, engine::general_purpose};
use error::AppError;
use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;
use walkdir::WalkDir;

pub mod error;

use crate::error::Result;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
    year: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    genre: Option<String>,
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

#[tauri::command(rename_all = "camelCase", async)]
fn load_audio_dir(directory: &Path, on_file_processed: Channel<Result<AudioFile>>) -> Result<()> {
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
                on_file_processed.send(Err(e.into()))?;
                continue;
            }
        };
        let tags: Box<dyn AudioTag> = cont!(Tag::new().read_from_path(entry.path()));
        on_file_processed.send(Ok(AudioFile {
            path: entry.path().into(),
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
            year: tags.year(),
            genre: tags.genre().map(|t| t.into()),
        }))?;
    }
    Ok(())
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
    match tags.year {
        Some(year) => new_tags.set_year(year),
        None => new_tags.remove_year(),
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
