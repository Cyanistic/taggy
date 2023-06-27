// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::async_runtime::spawn;
use tauri::Manager;
use taggy::*;
use clap::Parser;
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
        .invoke_handler(tauri::generate_handler![open_directory_picker])
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
fn load_dir(music_dir: String) -> Result<String, String>{
    todo!()
}

#[tauri::command]
fn open_directory_picker() -> Option<String> {
   todo!() 
}
