// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{collections::HashMap, path::Path, fs::File, io::Read, ffi::OsStr};

use base64::{Engine as _,  prelude::BASE64_STANDARD};
use serresult::SerResult;
use audiotags::{Tag, Picture, MimeType};
mod serresult;
mod cli;

fn main() {
    
    if std::env::args().count() == 1{
        tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_dir, image_to_data, save_song, search])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    }else{
        cli::parse();
    }
}

fn load_subdir(music_dir: String) -> SerResult<Vec<String>>{
    let mut files: Vec<String> = Vec::new();
    for entry in std::fs::read_dir(music_dir)?{
        if let Ok(entry) = entry{
            if let Ok(file_type) = entry.file_type(){
                if file_type.is_file(){
                    if entry.file_name().to_str().is_some(){
                        files.push(entry.path().to_str().unwrap().to_string());
                    }
                }else if file_type.is_dir(){
                       files.append(&mut load_subdir(entry.path().to_str().unwrap().to_string())?);
                }
            }
        }
    }
    Ok(files)
}

// Loads all audio files in the directory specified by the user
#[tauri::command]
fn load_dir(music_dir: String, recursive: bool) -> SerResult<Vec<HashMap<String, String>>>{
    let mut files: Vec<String> = Vec::new();
    for entry in std::fs::read_dir(music_dir).unwrap(){
        if let Ok(entry) = entry{
            if let Ok(file_type) = entry.file_type(){
                if file_type.is_file(){
                    if let Some(file_name) = entry.file_name().to_str(){
                        files.push(entry.path().to_str().unwrap().to_string());
                    }
                }else if recursive && file_type.is_dir(){
                    files.append(&mut load_subdir(entry.path().to_str().unwrap().to_string())?);
                }
            }
        }
    }
    let mut tags: Vec<HashMap<String, String>> = Vec::new();
    for i in files{
        let tag; 
        let file_name = Path::new(&i.clone()).file_name().unwrap_or(&OsStr::new("")).to_string_lossy().to_string();
        if let Some(ind) = file_name.rfind('.'){
            match &file_name[ind+1..] {
                "mp3" | "m4a" | "mp4" | "flac" => {
                tag = match Tag::new().read_from_path(i.clone()){
                    Ok(tag) => tag,
                    Err(_) => continue
                };}
                _ => continue
            }
        }else {
            continue;
        }
        
        let mut tag_map: HashMap<String, String> = HashMap::new();
        tag_map.insert("file_path".to_string(), i.clone());
        tag_map.insert("file_name".to_string(), Path::new(&i.clone()).file_name().unwrap_or(&OsStr::new("")).to_string_lossy().to_string());
        tag_map.insert("title".to_string(),  tag.title().unwrap_or("").to_string());
        tag_map.insert("artist".to_string(), tag.artist().unwrap_or("").to_string());
        tag_map.insert("genre".to_string(), tag.genre().unwrap_or("").to_string());
        tag_map.insert("year".to_string(), tag.year().unwrap_or(0).to_string());
        tag_map.insert("track_number".to_string(),format!("{}/{}", tag.track().0.unwrap_or(0), tag.track().1.unwrap_or(0)).to_string());
        tag_map.insert("album_title".to_string(), tag.album_title().unwrap_or("").to_string());
        tag_map.insert("album_artist".to_string(), tag.album_artist().unwrap_or("").to_string());
        tag_map.insert("disc_number".to_string(),format!("{}/{}", tag.disc().0.unwrap_or(0), tag.disc().1.unwrap_or(0)).to_string());
        tag_map.insert("cover_data".to_string(),  BASE64_STANDARD.encode(tag.album_cover().unwrap_or(Picture { data: &[0], mime_type: MimeType::Jpeg }).data).to_string());
        tag_map.insert("cover_type".to_string(), "jpg".to_string()); 
        tags.push(tag_map);
    }
    tags.sort_unstable_by(|a, b| a[&"file_name".to_string()].partial_cmp(&b[&"file_name".to_string()]).unwrap());
    Ok(tags)
}

#[tauri::command]
fn image_to_data(file_path: String) -> SerResult<(String, String)>{
    let mut cover_type = String::new();
    if let Ok(tag) = Tag::new().read_from_path(&file_path) {
        cover_type = match tag.album_cover().unwrap_or(Picture { data: &[0], mime_type: MimeType::Jpeg }).mime_type{
            MimeType::Jpeg => "jpg".to_string(),
            MimeType::Png => "png".to_string(),
            MimeType::Bmp => "bmp".to_string(),
            MimeType::Gif => "gif".to_string(),
            MimeType::Tiff => "tiff".to_string()
        };
        return Ok((BASE64_STANDARD.encode(tag.album_cover().unwrap_or(Picture { data: &[0], mime_type: MimeType::Jpeg }).data), cover_type))
        
    }
    let mut file = File::open(&file_path)?;
    if let Some(ind) = file_path.rfind('.'){
        cover_type = file_path[ind+1..].to_string();
    }
    let mut buf = Vec::new();
    file.read_to_end(&mut buf)?;
    Ok((BASE64_STANDARD.encode(buf), cover_type))
}

#[tauri::command]
fn save_song(song_data: HashMap<&str, &str>) -> SerResult<()>{    
    let path = *song_data.get("file_path").unwrap();
    let cover_type = *song_data.get("cover_type").unwrap();
    let mut tag = Tag::new().read_from_path(&path)?;
    for (key, val) in song_data.into_iter(){
        match key {
            "album_artist" => tag.set_album_artist(val),
            "album_title" => tag.set_album_title(val),
            "artist" => tag.set_artist(val),
            "cover_data" => {
                let mime = match cover_type {
                    "jpg" | "jpeg" => MimeType::Jpeg,
                    "png" => MimeType::Png,
                    "tiff" => MimeType::Tiff,
                    "bmp" => MimeType::Bmp,
                    "gif" => MimeType::Gif,
                    _ => continue
                };
                tag.set_album_cover(Picture { data: BASE64_STANDARD.decode(val)?.as_slice(), mime_type: mime });
            },
            "disc_number" => {
                if let Some(ind) = val.rfind('/'){
                    tag.set_disc_number(val[..ind].parse()?);
                    tag.set_total_discs(val[ind+1..].parse()?);
                }
            },
            "genre" => tag.set_genre(val),
            "track_number" => {
                if let Some(ind) = val.rfind('/'){
                    tag.set_track_number(val[..ind].parse()?);
                    tag.set_total_tracks(val[ind+1..].parse()?);
                }
            },
            "title" => tag.set_title(val),
            "year" => if let Ok(value) = val.parse(){
                tag.set_year(value);
            },
            _ => ()
        }
    }
    tag.write_to_path(path)?;
    Ok(())
}

#[tauri::command]
fn search<'a>(songs: Vec<HashMap<&'a str, &'a str>>, pattern: &'a str) -> Vec<HashMap<&'a str, &'a str>>{
    songs.into_iter().filter(|x| x[&"file_name"].to_lowercase().contains(pattern) || x[&"title"].to_lowercase().contains(pattern) || x[&"artist"].to_lowercase().contains(pattern) || x[&"album_artist"].to_lowercase().contains(pattern) || x[&"album_title"].to_lowercase().contains(pattern)).collect()
}
