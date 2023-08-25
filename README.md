<h1 align="center">Taggy</h1>
<p align="center"> <img src="https://badgen.net/github/license/Cyanistic/taggy"><img src="https://badgen.net/github/stars/cyanistic/taggy"></p>

<h2 align="center">A simple CLI and GUI tool for tagging audio files. Built with Tauri.</h2>

# Usage
```
A simple audio tag manipulator. Running with no arguments opens GUI.
Note that argument order is respected.

Usage: taggy [OPTIONS]

OPTIONS:
-h, --help                           Print the help information.
-V, --version                        Print the version information.
-r, --dry-run                        Modifications to all files are discarded after execution.
                                     In most cases, this should be the first argument if you plan to use it, as it only applies to arguments provided after it.
--                                   Passes all arguments to the GUI version and runs it.
-f, --file          [FILE]           Sets the file to modify, this should be provided before the desired modifications.
                                     Multiple files can be modified in the same command.
-t, --title         [TITLE]          Sets the new title for the provided audio file.
-a, --artist        [ARTIST]         Sets the new artist for the provided audio file.
-c, --cover         [FILE]           Sets the new cover for the provided audio file.
                                     This can either be an image file or another audio file with a cover
-e, --extract-cover [FILE]           Extract the cover of the provided audio file into FILE.
                                     If FILE is - the cover data is printed to stdout.
-T, --album-title   [ALBUM TITLE]    Sets the new album title for the provided audio file.
-A, --album-artist  [ALBUM ARTIST]   Sets the new album artist for the provided audio file.
-y, --year          [YEAR]           Sets the new year for the provided audio file.
-g, --genre         [GENRE]          Sets the new genre for the provided audio file.
-d, --disc-number   [DISC NUMBER]    Sets the new disc number for the provided audio file.
-D, --total-discs   [TOTAL DISCS]    Sets the new total discs for the provided audio file.
-n, --track-number  [TRACK NUMBER]   Sets the new track number for the provided audio file.
-R, --total-tracks  [TOTAL TRACKS]   Sets the new total tracks for the provided audio file.
-p, --print                         Prints all tags of the provided file.
```

# Building
Building taggy requires npm and cargo.
```
git clone https://github.com/Cyanistic/taggy.git
cd taggy
npm install
npm run tauri build
```
The binary after building, the binary will be in the `./src-tauri/target/release` folder
