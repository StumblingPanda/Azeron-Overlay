# Changelog

All notable changes to Azeron Overlay are documented here.

---

## [1.7.1] - 2026-08-01

### Fixed
- Cyborg I/II button ids were internally named after the dev's own old WoW keybinds (e.g. `map-dungeon-finder`, `crusaders-strike`, `holy-shock`) and leaked into the anonymous Supabase calibration uploads as-is, showing up as if they were part of another user's own mapping. All Cyborg I/II ids are renamed to a neutral `az-r{row}c{col}` scheme, matching the naming already used for Cyro and Keyzen. Calibrations saved under the old ids are migrated automatically on load, so no one needs to recalibrate after updating

---

## [1.7.0] - 2026-07-31

### Added
- System tray icon with a "Hide Overlay (for OBS)" toggle — left-click (or the right-click menu) moves the overlay window off past the edge of your rightmost monitor instead of minimizing it, so it's out of your own view but still fully rendered. OBS's Window Capture source keeps showing key highlights the whole time, since it captures the window's contents directly rather than a screen region. Always starts visible on launch; the hidden state isn't remembered between sessions. The tray menu also has a Quit entry

---

## [1.6.4] - 2026-07-31

### Fixed
- Key highlights could silently miss a repaint or get stuck active when the overlay sat on a non-primary monitor — Windows' native window-occlusion tracking misjudges this always-on-top transparent window as "occluded" whenever it isn't the OS-focused window on its monitor (common on secondary displays), and Chromium throttles rendering for windows it thinks are hidden. Occlusion tracking is now disabled for the overlay window, and renderer background throttling is disabled too
- Buttons bound to a native mouse click (via the Mouse dropdown or profile import) could fail to highlight entirely — the multi-device filter treated a single Azeron's own separate interfaces (keyboard, mouse-click, joystick) as if a second physical device were connected, since it counted every raw interface ID rather than distinct hardware. Only interfaces confirmed during the physical calibration wizard ever passed that filter, so any mouse-click bind made through the dropdown or a profile import — which skip calibration entirely — was silently dropped forever. The filter now keys off distinct device PIDs, so it only activates when genuinely different Azeron hardware is connected at once
- The Python backend could be left running after the app closed, permanently holding port 8765 and breaking the next launch — closing the app didn't wait for the backend process to actually be confirmed killed before Electron's own process exited, and a fast enough quit could race the backend's own startup, spawning it after nothing was left tracking it. Shutdown now blocks on confirming the backend is dead before the app is allowed to fully exit

---

## [1.6.3] - 2026-07-31

### Fixed
- Calibrating mouse-click buttons (Left/Right/Middle Click) could still fail entirely on a device where keyboard-emulation buttons calibrate first — the multi-device filter added in v1.6.2 ran *before* calibration recording, so once the keyboard interface's device ID got bound from earlier steps, presses from the same physical device's *mouse* interface were silently dropped before ever reaching the code that accumulates newly-seen device IDs, deadlocking that interface out of the binding for the rest of the session. Calibration now records every press unfiltered, so it can actually learn all of a device's interfaces
- Recognized Azeron profile type `"15"` mouse-click value `"2"` (Middle Click) — only `"1"` (Left) and `"3"` (Right) were previously mapped, so profile imports assigning a button to Middle Click silently left it unbound

---

## [1.6.2] - 2026-07-31

### Fixed
- Mouse-click-bound buttons (Left/Right Click, etc.) could still fail to highlight even after the v1.6.1 detection fixes — a single physical Azeron enumerates as two separate device IDs (its keyboard-emulation interface and its mouse-click interface). The multi-device binding feature, meant to isolate two genuinely separate physical Azerons, was overwriting the calibrated device binding with whichever interface sent the *last* calibration press — always the keyboard interface, since Joystick Click calibrates last — silently unbinding any mouse-click buttons calibrated earlier in the same session. Calibration now accumulates every device ID seen during the session instead of overwriting

### Added
- "Mouse" dropdown in the key-edit popup — assign Left Click, Right Click, Middle Click, or Mouse Button 4/5 directly to any overlay button without needing to physically trigger detection

---

## [1.6.1] - 2026-07-31

### Fixed
- Azeron buttons bound to a mouse click (Left/Right Click, etc.) could silently stop reacting entirely — the listener only registered for mouse raw input if an Azeron mouse interface was already detected at startup, so a device whose mouse sub-interface enumerated a moment after the keyboard one (or connected after the app launched) never received `WM_INPUT` mouse messages for the rest of the session. Raw input registration now re-runs whenever the detected mouse/joystick interface set changes
- Mouse button presses crashed the raw input callback with `AttributeError: 'RAWMOUSE' object has no attribute 'usButtonFlags'` due to one level of union access being skipped in the ctypes struct — fixed the field path, so mouse button events are parsed correctly instead of silently failing
- Profile import didn't recognize Azeron profile buttons assigned to a native mouse click (type `"15"`) — they imported with no label and no keybind, so the corresponding overlay tile stayed blank and never highlighted. Left Click and Right Click assignments are now imported like any other bind

---

## [1.6.0] - 2026-07-29

### Added
- LH/RH Cyborg I device support — same button grid as Cyborg II, minus the extra button Cyborg II added next to the joystick; own calibration flow, known PID `113C`
- Manual profiles — save and recall named, hand-built keybind sets per device without needing an Azeron profile export. Stored as JSON files under the app's userData folder, switchable via a new Import/Manual mode toggle in the Profile section. Meant as a stopgap for hardware the import feature doesn't support yet
- Key display mode — a new "Show" setting in Display options lets overlay buttons display their Label, Keybind, or Both instead of only ever showing the label

### Fixed
- Options panel could open on top of the button grid instead of floating clear of it, when it opened automatically on a device with no saved keybinds/calibration yet — the smart positioning logic previously only ran on a manual gear-icon click, not the automatic first-run open
- The "Open settings… to activate highlights" calibration hint had no CSS positioning at all and could render behind the top row of buttons on a fresh, uncalibrated device; it's now positioned clear of the grid, hides while the options panel is open, and never reappears once the panel has been opened once

---

## [1.5.0] - 2026-07-28

### Added
- Native joystick/gamepad HID mode support — the overlay's virtual joystick indicator previously only reacted to WASD (keyboard-emulation mode). It now also works when an Azeron's analog stick is set to "Analog Joystick" or "Xbox 360 Joystick" mode in Azeron's software instead: the listener registers Raw Input for joystick/gamepad HID usages and decodes axis values generically from each device's own report descriptor via the Windows HID Parser API, rather than assuming a fixed byte layout, so it isn't tied to one specific hardware revision or report format

### Fixed
- Modifier-only keybinds — pressing a modifier (Shift, Ctrl, Alt, or a chord of them) alone in the key editor and releasing now commits it as the full keybind (e.g. `shift`) instead of clearing the field blank
- `DefWindowProcW` could silently raise an `OverflowError` on large 64-bit window-message values — a latent bug in the existing keyboard/mouse listener code that the new joystick support made visible far more often. Fixed by declaring explicit ctypes argument types instead of relying on ctypes to guess
- Repeated `WM_INPUT_DEVICE_CHANGE` bursts (observed from Azeron's virtual joystick interface) could flood the listener with redundant device re-enumeration in rapid succession — now debounced

---

## [1.4.8] - 2026-06-24

### Fixed
- Device swap / hotplug now works — unplugging one Azeron and plugging in another previously left the overlay deaf because the new device received a new OS handle that was never registered. The listener now handles `WM_INPUT_DEVICE_CHANGE` with `RIDEV_DEVNOTIFY`, refreshing handle sets on connect/disconnect and re-broadcasting the updated device list to the renderer
- Dual-device support — when two Azerons are connected simultaneously (e.g. a standard and a custom-modded unit), each layout now binds to whichever physical device was used during its calibration. Key events from the other device are ignored, so switching the overlay between LH and RH layouts correctly highlights only the active device's button presses. Binding is recorded automatically on the first key press of calibration and cleared when recalibration starts

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
