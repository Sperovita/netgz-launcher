# Netgz Launcher

gzdoom launcher with saveable configurations that support mods and multiplayer.

## Setup

Set the gzdoom folder first using the file icon at the top right. This is where gzdoom.exe resides and where the launcher will attempt to load gzdoom with your saved configurations.

### Mods

Currently all of your mod files will need to be extracted loose in the same folder. You'll be able to add multiple files to a launch config using the search/dropdown Mod Files. Subfolders are not supported at this time.

To use mods you'll need to set a mod folder using the gear icon in the top right.

Once set all files in that folder will be available to add to your configurations.

## Dev Notes

This is an electron app using sqlite3 to store configurations and settings. Frontend uses alpine.js framework for js. Stylings are basic bootstrap, fontawesome and some minor custom stylings. I've used context isolation to seperate the frontend code from the electron/node backend for better security. 

Some of the initial code was brought over from my first electrion project that was for swapping directx mods. This is technically my second electron project, so expect some bugs early on. 

Electron Forge was used to compile the app. It is much larger than I'd like, and I imagine I can shrink it quite a bit in the future through tweaking forge configs, or maybe compiling it a different way.

### Updates
I currently don't have any designs on the update process for the end user, so early on it will just be replacing the whole app folder. You can simply move over the app.db file in the app's root folder to the new install and you'll keep all of your settings and configurations. If there are database changes I'll make migrations so no one should ever need to worry about redoing any of their configs in future updates.
