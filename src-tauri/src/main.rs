// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{collections::HashMap, path::Path, fs::File, io::{Write, Read}, ffi::OsStr};

use base64::{Engine as _, engine::general_purpose, prelude::BASE64_STANDARD};
use hex_literal::hex;
use serresult::SerResult;
use sha2::{Sha256, Sha512, Digest};
use taggy::*;
use clap::Parser;
use anyhow::Result;
use audiotags::{Tag, Picture, MimeType};
mod serresult;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

fn main() {
    let args = Args::parse();
    
    match args{ 
    Args{
        file: None,
        print: false,
        genre: _,
        year: _,
        title: _,
        artist: _, ..
    } => tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_dir, image_to_data, save_song])
        .run(tauri::generate_context!())
        .expect("error while running tauri application"),
    _ => {
            if args.file.is_some(){
                use_args(args);
            }
            else{
                println!("No files specified");
            }
        }
    }
}

#[tauri::command]
fn load_dir(music_dir: String) -> Result<Vec<HashMap<String, String>>, String>{
    println!("{}", std::env::current_dir().unwrap().to_str().unwrap());
    let mut files: Vec<String> = Vec::new();
    for entry in std::fs::read_dir(music_dir).unwrap(){
        if let Ok(entry) = entry{
            if let Ok(file_type) = entry.file_type(){
                if file_type.is_file(){
                    if let Some(file_name) = entry.file_name().to_str(){
                        files.push(entry.path().to_str().unwrap().to_string());
                    }
                }
            }
        }
    }
    let mut tags: Vec<HashMap<String, String>> = Vec::new();
    for i in files{
        let mut tag = match Tag::new().read_from_path(i.clone()){
            Ok(tag) => tag,
            Err(_) => continue
        };
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
        /* let cover_cache_dir; */
        // if let Some(image) = tag.album_cover(){
        //     let file_path = Path::new(&i);
        //     let mut file_name = String::new();
        //     if let Some(ind) = file_path.file_name().unwrap().to_str().unwrap().rfind('.'){
        //         let mut hasher = Sha256::new();
        //         hasher.update(image.data.clone());
        //         file_name = hex::encode(&hasher.finalize()[..]).to_string() + ".jpg";
        //     }
        //     cover_cache_dir = Path::new(&format!("{}/taggy/album_covers/{}", dirs::cache_dir().unwrap().to_str().unwrap(), file_name)).to_owned();
        //     if !Path::new(&format!("{}/taggy/album_covers", dirs::cache_dir().unwrap().to_str().unwrap())).is_dir(){
        //         std::fs::create_dir_all(Path::new(&format!("{}/taggy/album_covers", dirs::cache_dir().unwrap().to_str().unwrap())));
        //     }
        //     File::create(cover_cache_dir.clone()).unwrap().write(image.data).unwrap();
        //     tag_map.insert("cover_cache_dir".to_string(), cover_cache_dir.to_str().unwrap().to_string());
        // }else{
        //     tag_map.insert("cover_cache_dir".to_string(), "".to_string());
        // }

        // tag_map.insert("cover_cache_dir".to_string(), String::from_utf8(tag.album_cover().unwrap_or(Picture { data: &[0], mime_type: MimeType::Jpeg }).data.to_owned()).unwrap_or("".to_string()));
        tags.push(tag_map);
    }
    Ok(tags)
}

#[tauri::command]
fn image_to_data(file_path: String) -> SerResult<(String, String)>{
    if let Ok(tag) = Tag::new().read_from_path(&file_path) {
        let asdajsd = match tag.album_cover().unwrap_or(Picture { data: &[0], mime_type: MimeType::Jpeg }).mime_type{
            MimeType::Jpeg => "jpg".to_string(),
            MimeType::Png => "png".to_string(),
            MimeType::Bmp => "bmp".to_string(),
            MimeType::Gif => "gif".to_string(),
            MimeType::Tiff => "tiff".to_string()
        };
        return Ok((BASE64_STANDARD.encode(tag.album_cover().unwrap_or(Picture { data: &[0], mime_type: MimeType::Jpeg }).data), asdajsd))
        
    }
    let mut file = File::open(&file_path)?;
    let mut cover_type = String::new();
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
                ()
            },
            "genre" => tag.set_genre(val),
            "track_number" => {
                ()
            },
            "title" => tag.set_title(val),
            "year" => if let Ok(value) = val.parse(){
                tag.set_year(value);
            },
            _ => ()
        }
    }
    tag.write_to_path(&path)?;
    Ok(())
}
