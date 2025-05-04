use std::{
    io::ErrorKind,
    path::{Path, PathBuf},
};

use audiotags::{AudioTag, Tag};
use base64::{Engine, engine::general_purpose};
use serde::Serialize;
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
        .invoke_handler(tauri::generate_handler![load_audio_dir, get_audio_cover])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioFile {
    path: PathBuf,
    title: Option<String>,
    artist: Option<String>,
    cover: Option<String>,
    album_title: Option<String>,
    album_artists: Option<Vec<String>>,
    year: Option<i32>,
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
