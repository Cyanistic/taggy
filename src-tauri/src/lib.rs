
use std::{fmt, fs::{File, self, FileType}, io::Read, path::Path};

use audiotags::{Tag, Picture, MimeType};
use clap::Parser;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about)]
//Program that allows for easy changing of audio file tags
//Running with no arguments opens the GUI version
pub struct Args{
    ///The audio file to modify
    #[arg(short, long)]
    pub file: Option<String>,

    ///Modify the audio file's artist tag
    #[arg(short, long)]
    pub artist: Option<String>,
    
    ///Modify the audio file's title tag
    #[arg(short, long)]
    pub title: Option<String>,

    ///Modify the audio file's cover image
    #[arg(short, long)]
    pub cover: Option<String>,

    ///Modify the audio file's album title tag
    #[arg(long)]
    pub album_title: Option<String>,
    
    ///Modify the audio file's album artist tag
    #[arg(long)]
    pub album_artist: Option<String>,
    
    ///Modify the audio file's track number tag
    #[arg(long)]
    pub track_number: Option<u16>,

    ///Modify the audio file's total tracks tag
    #[arg(long)]
    pub total_tracks: Option<u16>,

    ///Modify the audio file's genre tag
    #[arg(short, long)]
    pub genre: Option<String>,
    
    ///Print audio file's tags after modifications, if any
    #[arg(short, long, default_value_t = false)]
    pub print: bool,

    ///Modify the audio file's year tag
    #[arg(short, long)]
    pub year: Option<u32>,

}

pub fn load_file(music_dir: String) -> Result<String, String>{
    todo!()
}

pub fn use_args(args: Args){
    let mut tag = Tag::new().read_from_path(args.file.clone().unwrap()).unwrap();
    if let Some(file) = args.file.clone(){
        if let Some(title) = args.title{
            tag.set_title(title.as_str());
        }
        if let Some(artist) = args.artist{
            tag.set_artist(artist.as_str());
        }
        if let Some(genre) = args.genre{
            tag.set_genre(genre.as_str());
        }
        'outer: while let Some(ref cover) = args.cover{
           if let Ok(mut cover_file) = File::open(cover){
                let mut cover_data: Vec<u8> = Vec::new();
                if let Err(e) = cover_file.read_to_end(&mut cover_data){
                    println!("{}", e);
                    break 'outer;
                }
                if let Some(ind) = cover.rfind('.'){
                    let cover_mime = match cover[ind+1..].to_string().as_str(){
                        ".png" => MimeType::Png,
                        ".gif" => MimeType::Gif,
                        ".bmp" => MimeType::Bmp,
                        ".tiff" => MimeType::Tiff,
                        ".jpeg" | ".jpg" | _ => MimeType::Jpeg
                    };
                    tag.set_album_cover(Picture::new(cover_data.as_slice(), cover_mime));
                    break 'outer;
                }
                break 'outer;
            }
        }
        if let Some(album_title) = args.album_title{
            tag.set_album_title(album_title.as_str());
        }
        if let Some(album_artist) = args.album_artist{
            tag.set_album_artist(album_artist.as_str());
        }
        if let Some(track_number) = args.track_number{
            tag.set_track_number(track_number);
        }
        if let Some(total_tracks) = args.total_tracks{
            tag.set_total_tracks(total_tracks);
        }
        if let Some(year) = args.year{
            tag.set_year(year as i32);
        }
        tag.write_to_path(file.as_str()).unwrap();
        if args.print{
            println!("File Name: {}", Path::new(&file).file_name().unwrap().to_str().unwrap());
            println!("Artist: {}", tag.artist().unwrap_or(""));
            println!("Title: {}", tag.title().unwrap_or(""));
            println!("Genre: {}", tag.genre().unwrap_or(""));
            println!("Year: {}", match tag.year(){
                Some(k) => k.to_string(),
                None => "".to_string()
            });
            println!("Album Title: {}", tag.album_title().unwrap_or(""));
            println!("Album Artist: {}", tag.album_artist().unwrap_or(""));
            println!("Track: {}/{}", match tag.track_number(){
                Some(k) => k.to_string(),
                None => "".to_string()
            }, match tag.total_tracks(){
                Some(k) => k.to_string(),
                None => "".to_string()
            });
        }
    }
    else{
        println!("No files specified");
    }
}

