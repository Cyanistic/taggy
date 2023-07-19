// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{collections::HashMap, path::Path, fs::File, io::Write, ffi::OsStr};

use base64::{Engine as _, engine::general_purpose, prelude::BASE64_STANDARD};
use hex_literal::hex;
use sha2::{Sha256, Sha512, Digest};
use taggy::*;
use clap::Parser;
use audiotags::{Tag, Picture, MimeType};
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
        .invoke_handler(tauri::generate_handler![load_dir])
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

