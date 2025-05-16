pub mod audio;
pub mod error;

use audio::*;

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
