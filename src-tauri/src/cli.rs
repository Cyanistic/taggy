use std::{process::exit, path::PathBuf, fs::File, io::{Read, Write}};

use audiotags::{AudioTag, Tag, MimeType, Picture};

pub fn parse() {
    const AVAILABLE_COMMANDS: [&str; 32] = [
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
        "-p", "--print",
        "-r", "--dry-run",
    ];

    const FLAGS: [&str; 6] = [
        "-h", "--help",
        "-p", "--print",
        "-r", "--dry-run"];
    let temp: Vec<String> = std::env::args().collect();
    let mut args: Vec<&str> = temp.iter().map(|x| x.as_str()).collect();
    // Add empty string after argument if the argument is a flag for easier error handling
    { let mut count: usize = 0;
        for (ind, val) in args.clone().iter().enumerate(){ 
            if FLAGS.contains(val){
                args.insert(ind+count+1, "");
                count += 1;
            }
        }
    }
    // Check if each argument is a valid command
    for i in (1..args.len()).step_by(2){
        if !AVAILABLE_COMMANDS.contains(&args[i]) {
            eprintln!("Invalid argument: '{}', exiting...", args[i]);
            if args[i].chars().filter(|x| x == &'-').count() == 1 && args[i].len() > 2{
                eprintln!("Note: arguments cannot be combined"); 
            }
            exit(1);
        }
    }
    // Check if the number of arguments is even, as each argument has a corresponding value
    if args.len() % 2 == 0 {
        eprintln!("Invalid number of arguments");
        exit(2);
    }
    // Define file and path variables to store file and path as they can be modified within the
    // same command.
    let mut file: Option<Box<dyn AudioTag>> = None;
    let mut path: PathBuf = PathBuf::new();
    let mut dry_run: bool = false;
    reset_sigpipe();
    
    // Iterate over every argument and perform the corresponding action
    for i in (1..args.len()).step_by(2){
        match args[i] {
        "-h" | "--help" => print_help(),
        "-r" | "--dry-run" => dry_run = true,
        "-f" | "--file" => {
            if file.as_ref().is_some() && !dry_run {
                file.unwrap().write_to_path(path.as_path().to_str().unwrap()).unwrap();
            }
            path = PathBuf::from(args[i+1]);
            file = Some(Tag::new().read_from_path(path.as_path().to_str().unwrap()).unwrap());
        },
        "-a" | "--artist" => file.as_mut().expect("No file provided").set_artist(args[i+1]),
        "-t" | "--title" => file.as_mut().expect("No file provided").set_title(args[i+1]),
        "-c" | "--cover" => {
            // Attempt to copy cover from audio file
            if let Ok(k) = Tag::new().read_from_path(PathBuf::from(args[i+1])){
                file.as_mut().expect("No file provided").set_album_cover(k.album_cover().expect("Audio provided audio file has no cover"));
            }
            // File is not an audio file, so attempt to read it as an image
            else{
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
    if !dry_run{
        file.unwrap().write_to_path(path.as_os_str().to_str().unwrap()).unwrap();
    }
    exit(0);
}

fn print_help(){
    const BOLD: &str = "\x1b[1m";
    const UND: &str = "\x1b[4m";
    const RES: &str = "\x1b[0m";
    println!("{}A simple audio tag manipulator. Running with no arguments opens GUI.\nNote that argument order is respected.{}", BOLD, RES);
    println!("{}Usage: taggy [OPTIONS]{}", BOLD, RES);
    println!("{}-h, --help                          {}Print the help information.", BOLD, RES);
    println!("{}-r, --dry-run                       {}Modifications to all files are discarded after execution.", BOLD, RES);
    println!("                                      In most cases, this should be the first argument if you plan to use it, as it only applies to arguments provided after it.");
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

// Add piping support on unix-like systems
#[cfg(unix)]
fn reset_sigpipe() {
    unsafe {
        libc::signal(libc::SIGPIPE, libc::SIG_DFL);
    }
}

#[cfg(not(unix))]
fn reset_sigpipe() {
    // no-op
}
