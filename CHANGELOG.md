# Changelog

All notable changes to Azeron Overlay are documented here.

---

## [1.4.8] - 2026-06-24

### Fixed
- Device swap / hotplug now works — unplugging one Azeron and plugging in another (e.g. swapping RH for LH Cyborg II) previously left the overlay deaf to all input because the new device received a new OS handle that was never registered. The listener now handles `WM_INPUT_DEVICE_CHANGE` with `RIDEV_DEVNOTIFY`, refreshing its internal handle sets whenever a device connects or disconnects, and re-broadcasts the updated PID list to the renderer

---

## [1.4.7] - 2026-06-23

### Fixed
- Calibration no longer closes the app when an Azeron button bound to Space is pressed — the Azeron enumerates as a HID keyboard so every button press also fires a DOM keyboard event in Electron; Space/Enter were triggering a click on the focused close button. Fixed by blurring the active element on calibration start and blocking Space/Enter DOM events during calibration
- Modifier-only keybinds now highlight correctly — modifier keys (Ctrl, Shift, Alt) now emit `down`/`up` events immediately on press/release rather than a deferred synthetic pair, so they light up while held and work as expected when used as part of a chord

### Added
- Crash logging via `electron-log` — unhandled main-process exceptions and renderer errors now write to `%AppData%\AzeronOverlay\logs\main.log`

---

## [1.4.6] - 2026-06-23

### Added
- Mouse button support in listener — Azeron buttons bound to mouse clicks (mouse1–mouse5) are now detected via Raw Input mouse interface, making them calibratable and highlightable during gameplay
- Per-device `knownPid` mapping — each device config now has a confirmed USB PID so calibration data is always submitted with the correct hardware identifier regardless of how many Azerons are connected
- Calibration data quality metrics — `mapped_count` and `total_count` are now submitted alongside the calibration map so incomplete or low-quality community submissions can be filtered

### Changed
- Calibration wizard panel removed during active calibration — the overlay now shows only the highlighted key, eliminating any chance of accidental UI clicks being recorded as button presses. Clicking the settings button cancels calibration if needed
- Profile import no longer auto-switches device — if the imported profile belongs to a different device than the one currently selected, an error message is shown instead of silently switching

### Fixed
- Cyro and LH Cyro scroll encoder excluded from calibration — it produced no keyboard events and left a misleading null entry in the calibration map
- NumLock state no longer affects calibration — the listener now uses raw scan codes and the E0 extended flag to correctly identify numpad keys regardless of NumLock being on or off
- Accidental double-tap during calibration — a 400ms cooldown after each recorded button press prevents a quick second press from skipping to the next calibration step
- Calibration status now updates correctly when switching devices — status reflects the selected device rather than whichever device the listener last reported

---

## [1.4.5] - 2026-06-22

### Changed
- Options panel redesigned from a tall single-column layout to a compact horizontal 4-column layout (Device / Display / Overlay / Profile) — significantly reduces panel height and keeps all controls visible at once
- Accent Color and Key Color pickers condensed onto a single row in the Display column
- Overlay buttons (Lock Position, Clickthrough, Reset Position, Monitor) arranged in a 2×2 grid instead of stacked full-width
- Device column now shows backend connection status, calibration status, and Recalibrate button together

---

## [1.4.4] - 2026-06-22

### Added
- First-run detection — options panel opens automatically with clickthrough disabled when no calibration or keybinds are saved
- Backend connection status indicator in Device section — green when running, orange with antivirus hint when not
- "No Azeron detected" nudge if device is not plugged in when the app starts
- Faint "Calibrate to activate highlights" hint on the overlay when no keybinds are set

### Fixed
- Calibration wizard panel was unstyled due to missing CSS — styles added and z-index set above controls row so ⚙/✕ buttons no longer bleed through

---

## [1.4.3] - 2026-06-21

### Added
- Back button in calibration wizard steps view — lets users redo the previous button if they misclicked, disabled on the first step
- Back button on section break screen — lets users redo the last button of a completed section before moving on

### Fixed
- Clickthrough mode now stays disabled for the entire calibration wizard including section break screens
- Calibration wizard no longer re-enables clickthrough if the options panel mouseleave event fired at the same time as a section boundary

---

## [1.4.2] - 2026-06-21

### Fixed
- Calibration wizard buttons (Continue, Skip, Cancel) were unclickable when overlay was in clickthrough mode — clickthrough is now suspended for the duration of the wizard and restored on finish or cancel
- Default community calibration maps wired up — new users automatically get highlights if a community map exists for their device

---

## [1.4.1] - 2026-06-21

### Added
- Anonymous calibration data is now submitted to Supabase after a successful calibration (when opt-in is enabled)

### Fixed
- NSIS installer custom page replaced with a standard MessageBox to avoid plugin compatibility issues with electron-builder's bundled NSIS

---

## [1.4.0] - 2026-06-21

### Added
- Button calibration wizard — maps physical Azeron buttons to overlay elements without needing a profile export, works for any hardware revision
- Calibration is split into sections per device (Main Body → 5-Way Cluster → Side Buttons → Joystick Click) with a transition screen between each group
- Multi-key bind support in calibration — buttons bound to combos like I+O register both keys in a 100ms collection window so neither is missed
- 8-second auto-skip countdown for buttons with no Azeron keybind — unbound buttons skip themselves automatically
- Standalone modifier key detection — buttons bound to just Ctrl, Shift, or Alt alone are now detected and calibrated correctly
- Anonymous calibration data opt-in added to the install wizard — checked by default (opt-out), preference saved to `%APPDATA%\AzeronOverlay\prefs.json` and toggleable in-app
- Overlay now launches in clickthrough mode by default — must be manually disabled to interact

### Fixed
- Hardware revision detection on profile import — buttons no longer land in wrong positions when importing a profile from a different Cyborg II firmware revision (detected via pin range > 37)
- Calibration panel positions itself below the bottom row of buttons instead of overlapping them
- Options panel section buttons condensed to two per row; Privacy merged into Device section to reduce panel height

---

## [1.3.3] - 2026-06-21

### Fixed
- Options panel now opens fully below the bottom row of buttons when the overlay is near the top of the screen

---

## [1.3.2] - 2026-06-21

### Added
- Cyborg II firmware v1.5.x support — auto-detected on profile import via 0-based pin numbering
- OEM key detection in listener (`-`, `[`, `]`, `=`, `;`, `'`, `` ` ``, `,`, `.`, `/`, `\`) so macro buttons bound to those keys can now highlight
- Unbound buttons are now hidden in normal mode and faintly visible in edit mode

### Fixed
- Type-16 macro buttons with Azeron-internal kv codes now import correctly (`-`, `[`, `]`, `num0`, `num*`, `2`, `4`, `5`, `7`, `9`, `u`)
- Tab button (pin 255 in v1.5.x firmware) now imports correctly
- Stale keybinds from a previous profile are cleared when re-importing
- Unassigned buttons (type 11) in a new profile no longer retain old keybinds

---

## [1.3.1] - 2026-06-19

### Fixed
- Overlay key labels are now normalized to uppercase

---

## [1.3.0] - 2026-06-19

### Added
- Multi-device support: Keyzen and Cyro layouts added alongside Cyborg II

---

## [1.2.4] - 2026-06-18

### Added
- Support for Azeron Software 2.0 export format alongside 1.5.6

---

## [1.2.3] - 2026-06-18

### Added
- Multi-line labels in key popup
- Popup panel now grows to fit content

---

## [1.2.2] - 2026-06-17

### Changed
- Replaced global keyboard hook with Raw Input API filtered to Azeron device (VID_16D0) — eliminates interference from other keyboards

---

## [1.2.1] - 2026-06-17

### Added
- Close button in overlay
- App icon
- Screen-saver z-order so the overlay stays on top during gameplay

---

## [1.2.0] - 2026-06-17

### Added
- (Foundation release for 1.2.x line)

---

## [1.1.12] - 2026-06-17

### Added
- App icon

---

## [1.1.11] - 2026-06-16

### Added
- Joystick direction keys now imported from Azeron profile

---

## [1.1.10] - 2026-06-16

### Fixed
- Modifier-only key import (Ctrl, Shift, Alt as standalone bindings)

---

## [1.1.9] - 2026-06-16

### Fixed
- All modifier key combinations can now be used as keybinds

---

## [1.1.6] - 2026-06-16

### Fixed
- Profile import now uses the keybind as a label fallback when no label is set in the profile

---

## [1.1.5] - 2026-06-16

### Fixed
- Options panel no longer clips at the top of the screen

---

## [1.1.4] - 2026-06-16

### Fixed
- Auto-updater errors are now shown in the UI instead of failing silently

---

## [1.1.0] - 2026-06-15

### Added
- Azeron profile import
- GitHub Actions release workflow with auto-updater support

---

## [1.0.0] - 2026-06-15

### Added
- Initial release
- Key overlay with editable labels and keybinds
- Cogwheel options button with panel opening upward
- Real-time key highlight via WebSocket listener
