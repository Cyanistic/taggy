use std::{process::exit, path::PathBuf, fs::File, io::{Read, Write}};

use audiotags::{AudioTag, Tag, MimeType, Picture};

pub fn parse() {
    const AVAILABLE_COMMANDS: [&str; 30] = [
        "-h", "--help", 
        "-f", "--file",
        "-a", "--artist",
        "-t", "--title",
        "-c", "--cover",
        "-e", "--extract-cover",
        "-T", "--album-title",
        "-A", "--album-artist",
        "-n", "--track-number",
        "-y", "--year",
        "-g", "--genre",
        "-R", "--total-tracks",
        "-d", "--disc-number",
        "-D", "--total-discs",
        "-p", "--print"];
    let temp: Vec<String> = std::env::args().collect();
    let mut args: Vec<&str> = temp.iter().map(|x| x.as_str()).collect();
    { let mut count: usize = 0;
        for (ind, val) in args.clone().iter().enumerate(){ 
            if *val == "--print" || *val == "-p" || *val == "-h" || *val == "--help"{
                args.insert(ind+count+1, "");
                count += 1;
            }
        }
    }
    for i in (1..args.len()).step_by(2){
        if !AVAILABLE_COMMANDS.contains(&args[i]) {
            eprintln!("Invalid argument: '{}', exiting...", args[i]);
            if args[i].chars().filter(|x| x == &'-').count() == 1 && args[i].len() > 2{
                eprintln!("Note: arguments cannot be combined"); 
            }
            exit(1);
        }
    }
    if args.len() % 2 == 0 {
        eprintln!("Invalid number of arguments");
        exit(2);
    }
    let mut file: Option<Box<dyn AudioTag>> = None;
    let mut path: PathBuf = PathBuf::new();
    for i in (1..args.len()).step_by(2){
        match args[i] {
        "-h" | "--help" => print_help(),
        "-f" | "--file" => {
            if file.as_ref().is_some(){ 
                file.unwrap().write_to_path(path.as_path().to_str().unwrap()).unwrap();
            }
            path = PathBuf::from(args[i+1]);
            file = Some(Tag::new().read_from_path(path.as_path().to_str().unwrap()).unwrap());
        },
        "-a" | "--artist" => file.as_mut().expect("No file provided").set_artist(args[i+1]),
        "-t" | "--title" => file.as_mut().expect("No file provided").set_title(args[i+1]),
        "-c" | "--cover" => {
            if let Ok(k) = Tag::new().read_from_path(PathBuf::from(args[i+1])){
                file.as_mut().expect("No file provided").set_album_cover(k.album_cover().expect("Audio provided audio file has no cover"));
            }else{
                let mut temp = File::open(args[i+1]).unwrap();
                let mut buf = Vec::new();
                temp.read_to_end(&mut buf).unwrap();
                let mime = match args[i+1].split('.').last().unwrap().to_lowercase().as_str() {
                    "jpg" | "jpeg" => MimeType::Jpeg,
                    "png" => MimeType::Png,
                    "bmp" => MimeType::Bmp,
                    "tiff" => MimeType::Tiff,
                    _ => MimeType::Jpeg
                };
                file.as_mut().expect("No file provided").set_album_cover(Picture::new(buf.as_slice(), mime));
            }
        },
        "-e" | "--extract-cover" => {
            let cover = file.as_ref().expect("No file provided").album_cover().expect("Unable to extract from file, as it has no cover").data;
            let mut file = File::create(args[i+1]).unwrap();
            file.write_all(cover).unwrap();
        },
        "-T" | "--album-title" => file.as_mut().expect("No file provided").set_album_title(args[i+1]),
        "-A" | "--album-artist" => file.as_mut().expect("No file provided").set_album_artist(args[i+1]),
        "-y" | "--year" => file.as_mut().expect("No file provided").set_year(args[i+1].parse().unwrap()),
        "-g" | "--genre" => file.as_mut().expect("No file provided").set_genre(args[i+1]),
        "-n" | "--track-number" => file.as_mut().expect("No file provided").set_track_number(args[i+1].parse().unwrap()),
        "-R" | "--total-tracks" => file.as_mut().expect("No file provided").set_total_tracks(args[i+1].parse().unwrap()),
        "-d" | "--disc-number" => file.as_mut().expect("No file provided").set_disc_number(args[i+1].parse().unwrap()),
        "-D" | "--total-discs" =>  file.as_mut().expect("No file provided").set_total_discs(args[i+1].parse().unwrap()),
        "-p" | "--print" => {
            if file.is_none(){
                eprintln!("No files provided");
                exit(3);
            }
            println!("Artist:       {}", file.as_ref().unwrap().artist().unwrap_or(""));
            println!("Title:        {}", file.as_ref().unwrap().title().unwrap_or(""));
            println!("Genre:        {}", file.as_ref().unwrap().genre().unwrap_or(""));
            println!("Year:         {}", file.as_ref().unwrap().year().unwrap_or(0));
            println!("Album Title:  {}", file.as_ref().unwrap().album_title().unwrap_or(""));
            println!("Album Artist: {}", file.as_ref().unwrap().album_artist().unwrap_or(""));
            println!("Discs:        {}/{}", file.as_ref().unwrap().disc_number().unwrap_or(0), file.as_ref().unwrap().total_discs().unwrap_or(0));
            println!("Tracks:       {}/{}\n", file.as_ref().unwrap().track_number().unwrap_or(0), file.as_ref().unwrap().total_tracks().unwrap_or(0));
        },
        _ => ()
        }
    }
    file.unwrap().write_to_path(path.as_os_str().to_str().unwrap()).unwrap();
    exit(0);
}

fn print_help(){
    const BOLD: &str = "\x1b[1m";
    const UND: &str = "\x1b[4m";
    const RES: &str = "\x1b[0m";
    println!("{}A simple audio tag manipulator. Running with no arguments opens GUI.\nNote that argument order is respected.{}", BOLD, RES);
    println!("{}Usage: taggy [OPTIONS]{}", BOLD, RES);
    println!("{}-h, --help                          {}Print the help information.", BOLD, RES);
    println!("{}-f, --file         [FILE]           {}Sets the file to modify, this should be provided before the desired modifications.", BOLD, RES);
    println!("                                      Multiple files can be modified in the same command.");
    println!("{}-t, --title        [TITLE]          {}Sets the new title for the provided audio file.", BOLD, RES);
    println!("{}-a, --artist       [ARTIST]         {}Sets the new artist for the provided audio file.", BOLD, RES);
    println!("{}-c, --cover        [FILE]           {}Sets the new cover for the provided audio file.", BOLD, RES);
    println!("                                      This can either be an image file or another audio file with a cover");
    println!("{}-T, --album-title  [ALBUM TITLE]    {}Sets the new album title for the provided audio file.", BOLD, RES);
    println!("{}-A, --album-artist [ALBUM ARTIST]   {}Sets the new album artist for the provided audio file.", BOLD, RES);
    println!("{}-y, --year         [YEAR]           {}Sets the new year for the provided audio file.", BOLD, RES);
    println!("{}-g, --genre        [GENRE]          {}Sets the new genre for the provided audio file.", BOLD, RES);
    println!("{}-d, --disc-number  [DISC NUMBER]    {}Sets the new disc number for the provided audio file.", BOLD, RES);
    println!("{}-D, --total-discs  [TOTAL DISCS]    {}Sets the new total discs for the provided audio file.", BOLD, RES);
    println!("{}-n, --track-number [TRACK NUMBER]   {}Sets the new track number for the provided audio file.", BOLD, RES);
    println!("{}-R, --total-tracks [TOTAL TRACKS]   {}Sets the new total tracks for the provided audio file.", BOLD, RES);
    println!("{}-p, --print                         {}Prints all tags of the provided file.\n", BOLD, RES);
    exit(0)
}
