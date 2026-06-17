# Azeron Cyborg II Overlay

A lightweight Windows overlay that mirrors your Azeron keypad in real time.
Live key-press highlights, editable button labels, and on-the-fly profile
switching — no Azeron software needed at runtime. Perfect for streamers or
as a quick visual reference for your binds.

Currently only tested and confirmed that importing works from Azeron software 1.5.6 so be aware of Bugs if 2.0 dont work.
Plans to fully implement 2.0 if its not working, and adding the other pieces of hardware (Cyborg II lefty, Cyro and the Keyzen).

## Features

- Live key-press highlights
- Import profiles directly from Azeron software
- Rename and reassign button labels on the fly
- Customisable colors, scale, and opacity
- Multi-monitor support
- Minimal and lightweight — no Azeron software required at runtime

## Installation

1. Go to the [Releases](../../releases) page
2. Download the latest `.exe`
3. Run the installer and its good to go.

## First-time setup

> **⚠️ Important:** The overlay fills the screen by default and will block clicks
> on windows behind it. Open the settings panel and **Enable Clickthrough** 
> before trying to interact with any other app/window on that monitor.

## Settings

| Setting | What it does |
|---|---|
| Scale | Resizes the entire overlay |
| Opacity | Controls how transparent the overlay is |
| Accent Color | Changes the border/accent color of keys |
| Key Color | Changes the fill color of keys |
| Unlock Position | Lets you drag the overlay freely |
| Enable/Disable Clickthrough | Prevents the overlay from blocking clicks |
| Reset Position | Snaps the overlay back if it goes off-screen |
| Monitor | Moves the overlay to a different screen |

## Usage

Once set up, the overlay runs passively on top of your game and highlights
keys as you press them. You can switch profiles at any time from the settings
panel without restarting.

## Importing your Azeron profile
 **Important:** As of right now it only reads software profiles

First, export your profile from the Azeron software:

1. Open the **Azeron software**
2. Click **Settings** (the sliders icon on the left sidebar)
3. Go to **Import/Export**
4. Click **Export profiles** and save the file somewhere handy

Then bring it into the overlay:

5. Click **Import Azeron Profile…** in the overlay settings panel
6. Select the file you just exported
7. Pick your profile from the dropdown and hit **Apply** — key labels update instantly

## Support & Community

Have a question, found a bug, or want to suggest a feature?
Head over to the [Discussions](../../discussions) tab on GitHub!

## License
GPL v3

## Support

If you find this useful, consider supporting the project!

- [GitHub Sponsors](https://github.com/sponsors/stumblingpanda)
- [Ko-fi](https://ko-fi.com/stumblingpanda)

All support is appreciated and helps keep the project maintained.
