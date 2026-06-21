# Changelog

All notable changes to Azeron Overlay are documented here.

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

## [1.3.1] - 2026-05-XX

### Fixed
- Overlay key labels are now normalized to uppercase

---

## [1.3.0] - 2026-05-XX

### Added
- Multi-device support: Keyzen and Cyro layouts added alongside Cyborg II

---

## [1.2.4] - 2026-04-XX

### Added
- Support for Azeron Software 2.0 export format alongside 1.5.6

---

## [1.2.3] - 2026-04-XX

### Added
- Multi-line labels in key popup
- Popup panel now grows to fit content

---

## [1.2.2] - 2026-04-XX

### Changed
- Replaced global keyboard hook with Raw Input API filtered to Azeron device (VID_16D0) — eliminates interference from other keyboards

---

## [1.2.1] - 2026-04-XX

### Added
- Close button in overlay
- App icon
- Screen-saver z-order so the overlay stays on top during gameplay

---

## [1.1.11] - 2026-03-XX

### Added
- Joystick direction keys now imported from Azeron profile

---

## [1.1.10] - 2026-03-XX

### Fixed
- Modifier-only key import (Ctrl, Shift, Alt as standalone bindings)

---

## [1.1.9] - 2026-03-XX

### Fixed
- All modifier key combinations can now be used as keybinds

---

## [1.1.6] - 2026-03-XX

### Fixed
- Profile import now uses the keybind as a label fallback when no label is set in the profile

---

## [1.1.5] - 2026-03-XX

### Fixed
- Options panel no longer clips at the top of the screen

---

## [1.1.4] - 2026-03-XX

### Fixed
- Auto-updater errors are now shown in the UI instead of failing silently

---

## [1.1.0] - 2026-03-XX

### Added
- Azeron profile import
- GitHub Actions release workflow with auto-updater support

---

## [1.0.0] - 2026-02-XX

### Added
- Initial release
- Key overlay with editable labels and keybinds
- Cogwheel options button with panel opening upward
- Real-time key highlight via WebSocket listener
