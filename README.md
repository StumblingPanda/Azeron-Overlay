# Azeron Overlay

A lightweight Windows overlay that mirrors your Azeron keypad in real time.
Live key-press highlights, editable button labels, and on-the-fly profile
switching — no Azeron software needed at runtime. Perfect for streamers or
as a quick visual reference while gaming.

## Device Support

All six devices are fully supported. The built-in calibration wizard works
for any hardware revision without needing a profile export.

| Device | Layout | Calibration Wizard | Profile Import |
|---|---|---|---|
| LH Cyborg II | ✅ | ✅ | ✅ |
| RH Cyborg II | ✅ | ✅ | ❓ |
| LH Keyzen | ✅ | ✅ | ✅ |
| RH Keyzen | ✅ | ✅ | ❓ |
| RH Cyro | ✅ | ✅ | ✅ |
| LH Cyro | ✅ | ✅ | ❓ |

❓ = untested / community exports not yet collected

## Features

- Live key-press highlights as you press buttons
- Built-in calibration wizard — works on any Azeron hardware, no profile needed
- Import profiles directly from the Azeron software as an alternative
- Rename and reassign button labels on the fly
- Customisable colors, scale, and opacity
- Multi-monitor support
- Launches in clickthrough mode by default — the overlay never blocks your game
- Minimal and lightweight — no Azeron software required at runtime

## Installation

1. Go to the [Releases](../../releases) page
2. Download the latest `.exe`
3. Run the installer

During installation you will be asked whether to share anonymous calibration data. This helps build community maps so future users get highlights working out of the box without calibrating manually. You can change this at any time in the app settings.

## Getting highlights working

There are two ways to set up key highlights:

### Option A — Calibration wizard (recommended for most users)

The wizard walks you through pressing each physical button in turn and maps them to the overlay automatically.

1. Open the overlay settings (⚙ button)
2. Click **Calibrate Buttons…**
3. Press each button when prompted — the wizard groups them by physical section (Main Body → 5-Way Cluster → Side Buttons → Joystick Click)
4. Buttons with no keybind auto-skip after 8 seconds
5. Done — highlights are active immediately

### Option B — Import an Azeron profile

1. Open the **Azeron software** → **Settings** → **Import/Export** → **Export profiles**
2. In the overlay, click **Import Azeron Profile…**
3. Select the file, pick your profile, hit **Apply**

## Settings

| Setting | What it does |
|---|---|
| Model | Switch between LH/RH Cyborg II, Keyzen, and Cyro layouts |
| Calibrate Buttons… | Open the calibration wizard |
| Share anonymous data | Toggle whether calibration data is submitted after calibrating |
| Scale | Resize the entire overlay |
| Opacity | Control overlay transparency |
| Accent Color | Change the border/highlight color of keys |
| Key Color | Change the fill color of keys |
| Unlock Position | Allow dragging the overlay freely |
| Enable / Disable Clickthrough | Toggle whether the overlay blocks mouse clicks |
| Reset Position | Snap the overlay back if it goes off-screen |
| Monitor | Move the overlay to a different screen |

## Clickthrough mode

The overlay launches in clickthrough mode by default. To interact with the overlay:

1. Click the ⚙ button (always works in clickthrough mode)
2. Click **Disable Clickthrough**
3. When done, click **Enable Clickthrough** to restore passthrough

## Anonymous data sharing

When you complete a calibration, a small anonymous record is submitted containing: which device layout you use, your device's USB hardware ID, the key mapping from calibration, and the app version. No key names, labels, profile data, or personal information are included.

Once enough submissions exist for a device, a community map gets baked into the app so future users get highlights without calibrating at all.

Opt out any time via the **Share anonymous data** checkbox in settings.

## Known Limitations

**Duplicate keybinds:** The overlay tracks highlights by key name, not physical button. If two buttons share the same keybind, pressing either highlights whichever button has that bind. Avoid assigning the same key to more than one button if per-button accuracy matters.

## Acknowledgements

A huge thank you to **@COALEYED** on the Azeron Discord — without their time
spent supplying profile exports, hardware screenshots, and device info, multi-device
support would not have been possible. If you're benefiting from Keyzen or Cyro
support, they're the reason it exists.

## License

GPL v3

## Support & Community

Found a bug or want to suggest a feature? Head over to the [Discussions](../../discussions) tab on GitHub.

If you find this useful, consider supporting the project:

- [GitHub Sponsors](https://github.com/sponsors/stumblingpanda)
- [Ko-fi](https://ko-fi.com/stumblingpanda)

All support is appreciated and helps keep the project maintained.
