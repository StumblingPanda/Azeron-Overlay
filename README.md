# Azeron Overlay

A lightweight Windows overlay that mirrors your Azeron keypad in real time.
Live key-press highlights, editable button labels, and on-the-fly profile
switching — no Azeron software needed at runtime. Perfect for streamers or
as a quick visual reference for your binds.

## Device Support

| Device | Overlay | Profile Import |
|---|---|---|
| LH Cyborg II | ✅ | ✅ |
| RH Cyborg II | ✅ | ✅ |
| LH Keyzen | ✅ | ✅ |
| RH Cyro | ✅ | ✅ |
| RH Keyzen | ✅ | ⏳ coming soon |
| LH Cyro | ✅ | ⏳ coming soon |

All devices support manual button labeling. Profile import for RH Keyzen and LH Cyro is not yet available — pin mappings for those devices are still being collected from community exports.

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

## Known Limitations

**Duplicate keybinds:** The overlay tracks button activity by key name, not by which physical button was pressed. If two buttons on your keypad are assigned to the same key, pressing either one will highlight whichever overlay button has that keybind. This is by design — it allows the overlay to work across all Azeron hardware models without needing device-specific hardware identifiers. Avoid assigning the same key to more than one button if accurate per-button highlighting matters to you.

## Acknowledgements

Big thanks to **@COALEYED** on the Azeron Discord for providing profile exports,
screenshots, and hardware info that made multi-device support possible.

## License
GPL v3

## Support & Community

Have a question, found a bug, or want to suggest a feature?
Head over to the [Discussions](../../discussions) tab on GitHub!

If you find this useful, consider supporting the project!

- [GitHub Sponsors](https://github.com/sponsors/stumblingpanda)
- [Ko-fi](https://ko-fi.com/stumblingpanda)

All support is appreciated and helps keep the project maintained.
