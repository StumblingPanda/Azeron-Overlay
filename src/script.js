const { ipcRenderer } = require('electron');
const log = require('electron-log/renderer');

window.onerror = (msg, src, line, col, err) => {
    log.error('Renderer uncaught error:', msg, `${src}:${line}:${col}`, err);
};
window.onunhandledrejection = (e) => {
    log.error('Renderer unhandled rejection:', e.reason);
};

// Device layout files
const KEYS_CYBORG2       = require('./layouts/keys.cjs');
const KEYS_CYBORG2_LEFTY = require('./layouts/keys_lefty.cjs');
const KEYS_CYBORG1       = require('./layouts/keys_cyborg1.cjs');
const KEYS_CYBORG1_LEFTY = require('./layouts/keys_cyborg1_lefty.cjs');
const KEYS_KEYZEN        = require('./layouts/keys_keyzen.cjs');
const KEYS_KEYZEN_RH     = require('./layouts/keys_keyzen_rh.cjs');
const KEYS_CYRO          = require('./layouts/keys_cyro.cjs');
const KEYS_CYRO_LH       = require('./layouts/keys_cyro_lh.cjs');

const JOYSTICK_DISTANCE = 35;
const POPUP_WIDTH       = 200;
const KEY_W             = 65;
let   CONTENT_W         = 665;

// DOM refs
const overlay           = document.getElementById("overlay-visuals");
const overlayContent    = document.getElementById("overlay-content");
const optionsUi         = document.getElementById("options-ui");
const stick             = document.getElementById("joystick-stick");
const joystickContainer = document.getElementById("joystick-container");
const optionsButton     = document.getElementById("options-button");
const closeButton       = document.getElementById("close-button");
const optionsPanel      = document.getElementById("options-panel");
const scaleSlider       = document.getElementById("scale-slider");
const opacitySlider     = document.getElementById("opacity-slider");
const colorPicker       = document.getElementById("color-picker");
const keyBgPicker       = document.getElementById("key-bg-picker");
const keyTextModeSelect = document.getElementById("key-text-mode");
const unlockBtn         = document.getElementById("unlock-btn");
const clickthroughBtn   = document.getElementById("clickthrough-btn");
const resetPositionBtn  = document.getElementById("reset-position-btn");
const shareDataCheck    = document.getElementById("share-data-check");
const monitorBtn          = document.getElementById("monitor-btn");
const updateSection       = document.getElementById("update-section");
const updateStatusText    = document.getElementById("update-status-text");
const installUpdateBtn    = document.getElementById("install-update-btn");
const retryUpdateBtn      = document.getElementById("retry-update-btn");
const updateBadge         = document.getElementById("update-badge");
const importProfileBtn       = document.getElementById("import-profile-btn");
const importFileInput        = document.getElementById("import-file-input");
const profileSelectRow       = document.getElementById("profile-select-row");
const profileDropdownTrigger = document.getElementById("profile-dropdown-trigger");
const profileDropdownList    = document.getElementById("profile-dropdown-list");
const profileApplyBtn        = document.getElementById("profile-apply-btn");
const importStatus           = document.getElementById("import-status");
const profileModeToggle      = document.getElementById("profile-mode-toggle");
const profileModeLabel       = document.getElementById("profile-mode-label");
const profileImportView      = document.getElementById("profile-import-view");
const profileManualView      = document.getElementById("profile-manual-view");
const manualProfileNameInput       = document.getElementById("manual-profile-name-input");
const manualProfileSaveBtn         = document.getElementById("manual-profile-save-btn");
const manualProfileSelectRow       = document.getElementById("manual-profile-select-row");
const manualProfileDropdownTrigger = document.getElementById("manual-profile-dropdown-trigger");
const manualProfileDropdownList    = document.getElementById("manual-profile-dropdown-list");
const manualProfileApplyBtn        = document.getElementById("manual-profile-apply-btn");
const manualProfileStatus          = document.getElementById("manual-profile-status");
const deviceSelect        = document.getElementById("device-select");
const keyPopup            = document.getElementById("key-popup");
const keyPopupTitle       = document.getElementById("key-popup-title");
const keyPopupClose       = document.getElementById("key-popup-close");
const popupLabelInput     = document.getElementById("popup-label-input");
const popupKeybindInput   = document.getElementById("popup-keybind-input");
const popupMouseSelect    = document.getElementById("popup-mouse-select");
const calibrateBtn           = document.getElementById("calibrate-btn");
const calibrationWizard      = document.getElementById("calibration-wizard");
const calibrationStepsView   = document.getElementById("calibration-steps-view");
const calibrationSectionLabel= document.getElementById("calibration-section-label");
const calibrationPrompt      = document.getElementById("calibration-prompt");
const calibrationProgress    = document.getElementById("calibration-progress");
const calibrationBackBtn     = document.getElementById("calibration-back-btn");
const calibrationSkipBtn     = document.getElementById("calibration-skip-btn");
const calibrationCancelBtn   = document.getElementById("calibration-cancel-btn");
const calibrationBreakView   = document.getElementById("calibration-break-view");
const calibrationBreakMsg    = document.getElementById("calibration-break-msg");
const calibrationBreakNext   = document.getElementById("calibration-break-next");
const calibrationBreakBackBtn  = document.getElementById("calibration-break-back-btn");
const calibrationContinueBtn   = document.getElementById("calibration-continue-btn");
const calibrationCancelBreakBtn = document.getElementById("calibration-cancel-break-btn");
const calibrationStatus      = document.getElementById("calibration-status");

// Device configurations
const PIN_TO_KEY_ID_CYBORG2 = {
     1: "az-r5c0",   2: "az-r4c0",   3: "az-r3c1",
     4: "az-r2c0",   5: "az-r1c0",   6: "az-r3c0",
     7: "az-r5c1",   8: "az-r4c1",   9: "az-r3c2",
    10: "az-r2c1",  11: "az-r1c1",  13: "az-r5c2",
    14: "az-r4c2",  15: "az-r3c3",  16: "az-r2c2",
    17: "az-r1c2",  19: "az-r4c4",  20: "az-r3c6",
    22: "az-r5c3",  23: "az-r4c3",  24: "az-r3c4",
    25: "az-r2c3",  26: "az-r1c3",  27: "az-r3c5",
    32: "az-r5c4",  33: "az-r1c6",  34: "az-r0c0",
    35: "az-r1c4",  36: "az-r2c4",  37: "az-r1c5",
};

// Cyborg II firmware v1.5.x uses 0-based pin numbering — physically different from v1 map.
// Derived from Benji_Profile.json cross-referenced with Azeron Software 1.5.6 screenshot.
const PIN_TO_KEY_ID_CYBORG2_V2 = {
    // Row 1 — top row main cluster (left → right)
    22: "az-r1c0",   39: "az-r1c1",    3: "az-r1c2",    9: "az-r1c3",
    // Row 1 — extended right module (C, empty slot, O)
    14: "az-r1c4",   17: "az-r1c5",   12: "az-r1c6",
    // Row 2 — main cluster
    23: "az-r2c0",    38: "az-r2c1",     2: "az-r2c2",    8: "az-r2c3",
    // Row 2 — right module (B)
    13: "az-r2c4",
    // Row 3 — main cluster (ESC + 5 buttons)
    21: "az-r3c0",       24: "az-r3c1",   18: "az-r3c2",
     1: "az-r3c3",           7: "az-r3c4", 10: "az-r3c5",
    // Row 3 — far right (Tab; pinOne=255 in v1.5.x for software-layer keys)
   255: "az-r3c6",
    // Row 4 — main cluster
    25: "az-r4c0",     19: "az-r4c1",  0: "az-r4c2",   5: "az-r4c3",
    // Row 4 — far right (Ctrl+Shift+F1; pins 28 and 43 are the same physical button)
    28: "az-r4c4",       43: "az-r4c4",
    // Row 5 — main cluster
    26: "az-r5c0", 20: "az-r5c1", 27: "az-r5c2",  4: "az-r5c3",
    // Row 5 — right (joystick button)
    40: "az-r5c4",
    // Row 0 — single top button
    11: "az-r0c0",
};

// All 22 keyboard buttons mapped. cy-r4c3 is the scroll encoder (no keyboard event).
const PIN_TO_KEY_ID_CYRO = {
    // Row 2 right (JOY #4, #3, #2, #1)
    12: "cy-r2c3",
    13: "cy-r2c4",
     8: "cy-r2c5",
     9: "cy-r2c6",
    // Row 3 right (JOY #8, #7, #6, #5)
    14: "cy-r3c3",
    15: "cy-r3c4",
    11: "cy-r3c5",
    10: "cy-r3c6",
    // Row 4 right (JOY #12, #11, #10, #9) — cy-r4c3 is scroll encoder, starts at cy-r4c4
     3: "cy-r4c4",
     2: "cy-r4c5",
     1: "cy-r4c6",
     0: "cy-r4c7",
    // Row 5 right (JOY #17, #16, #15, #14)
     7: "cy-r5c4",
     6: "cy-r5c5",
     5: "cy-r5c6",
     4: "cy-r5c7",
    // 5-way cluster (Up/Left/Esc/Right/Down)
    19: "cy-r0c1",
    18: "cy-r1c0",
    20: "cy-r1c1",
    17: "cy-r1c2",
    16: "cy-r2c1",
    // Bottom left (JOY #24)
    22: "cy-r5c1",
};

// 30 of 32 buttons confirmed from user export cross-referenced with MMORPG screenshot.
// Pins 28 and 29 exist (type:11 unassigned) but their kz-IDs (kz-r3c5, kz-r4c5) are unknown.
const PIN_TO_KEY_ID_KEYZEN = {
     1: "kz-r5c1",    2: "kz-r4c1",    3: "kz-r3c1",    4: "kz-r2c1",
     5: "kz-r3c0",    6: "kz-r4c0",    7: "kz-r5c2",    8: "kz-r4c2",
     9: "kz-r3c2",   10: "kz-r2c2",   11: "kz-r1c2",   13: "kz-r5c3",
    14: "kz-r4c3",   15: "kz-r3c3",   16: "kz-r2c3",   17: "kz-r1c3",
    19: "kz-r5c8",   20: "kz-r3c8",   22: "kz-r5c4",   23: "kz-r4c4",
    24: "kz-r3c4",   25: "kz-r2c4",   26: "kz-r1c4",   27: "kz-r2c5",
    28: "kz-r3c5",   29: "kz-r4c5",
    32: "kz-r5c7",   33: "kz-r1c8",   34: "kz-r0c7",   35: "kz-r1c6",
    36: "kz-r2c7",   37: "kz-r1c7",
};

const PIN_TO_KEY_ID_CYRO_LH   = {};
const PIN_TO_KEY_ID_KEYZEN_RH  = {};

const CYBORG2_SECTIONS = [
    {
        label: "Main Body",
        transition: "Move your thumb over to the 5-way cluster",
        ids: ["az-r1c0","az-r1c1","az-r1c2","az-r1c3",
              "az-r2c0","az-r2c1","az-r2c2","az-r2c3",
              "az-r3c0","az-r3c1","az-r3c2","az-r3c3","az-r3c4","az-r3c5",
              "az-r4c0","az-r4c1","az-r4c2","az-r4c3",
              "az-r5c0","az-r5c1","az-r5c2","az-r5c3"],
    },
    {
        label: "5-Way Cluster",
        transition: "Now press the two side buttons next to the joystick",
        ids: ["az-r0c0","az-r1c4","az-r1c5","az-r1c6","az-r2c4"],
    },
    {
        label: "Side Buttons",
        transition: "Finally, press the joystick click",
        ids: ["az-r3c6","az-r4c4"],
    },
    {
        label: "Joystick Click",
        transition: null,
        ids: ["az-r5c4"],
    },
];

const CYBORG1_SECTIONS = [
    {
        label: "Main Body",
        transition: "Move your thumb over to the 5-way cluster",
        ids: ["az-r1c0","az-r1c1","az-r1c2","az-r1c3",
              "az-r2c0","az-r2c1","az-r2c2","az-r2c3",
              "az-r3c0","az-r3c1","az-r3c2","az-r3c3","az-r3c4","az-r3c5",
              "az-r4c0","az-r4c1","az-r4c2","az-r4c3",
              "az-r5c0","az-r5c1","az-r5c2","az-r5c3"],
    },
    {
        label: "5-Way Cluster",
        transition: "Now press the two side buttons next to the joystick",
        ids: ["az-r0c0","az-r1c4","az-r1c5","az-r1c6","az-r2c4"],
    },
    {
        label: "Side Buttons",
        transition: "Finally, press the joystick click",
        ids: ["az-r4c4"],
    },
    {
        label: "Joystick Click",
        transition: null,
        ids: ["az-r5c4"],
    },
];

const KEYZEN_SECTIONS = [
    {
        label: "Main Body",
        transition: "Move your thumb over to the 5-way cluster",
        ids: ["kz-r1c2","kz-r1c3","kz-r1c4",
              "kz-r2c1","kz-r2c2","kz-r2c3","kz-r2c4","kz-r2c5",
              "kz-r3c0","kz-r3c1","kz-r3c2","kz-r3c3","kz-r3c4","kz-r3c5",
              "kz-r4c0","kz-r4c1","kz-r4c2","kz-r4c3","kz-r4c4","kz-r4c5",
              "kz-r5c1","kz-r5c2","kz-r5c3","kz-r5c4"],
    },
    {
        label: "5-Way Cluster",
        transition: "Now press the two buttons at the bottom next to the joystick",
        ids: ["kz-r0c7","kz-r1c6","kz-r1c7","kz-r1c8","kz-r2c7"],
    },
    {
        label: "Side Buttons",
        transition: "Finally, press the joystick click",
        ids: ["kz-r5c7","kz-r5c8"],
    },
    {
        label: "Joystick Click",
        transition: null,
        ids: ["kz-r3c8"],
    },
];

const KEYZEN_RH_SECTIONS = [
    {
        label: "Main Body",
        transition: "Move your thumb over to the 5-way cluster",
        ids: ["kz-rh-r1c2","kz-rh-r1c3","kz-rh-r1c4",
              "kz-rh-r2c1","kz-rh-r2c2","kz-rh-r2c3","kz-rh-r2c4","kz-rh-r2c5",
              "kz-rh-r3c0","kz-rh-r3c1","kz-rh-r3c2","kz-rh-r3c3","kz-rh-r3c4","kz-rh-r3c5",
              "kz-rh-r4c0","kz-rh-r4c1","kz-rh-r4c2","kz-rh-r4c3","kz-rh-r4c4","kz-rh-r4c5",
              "kz-rh-r5c1","kz-rh-r5c2","kz-rh-r5c3","kz-rh-r5c4"],
    },
    {
        label: "5-Way Cluster",
        transition: "Now press the two buttons at the bottom next to the joystick",
        ids: ["kz-rh-r0c7","kz-rh-r1c6","kz-rh-r1c7","kz-rh-r1c8","kz-rh-r2c7"],
    },
    {
        label: "Side Buttons",
        transition: "Finally, press the joystick click",
        ids: ["kz-rh-r5c7","kz-rh-r5c8"],
    },
    {
        label: "Joystick Click",
        transition: null,
        ids: ["kz-rh-r3c8"],
    },
];

const CYRO_SECTIONS = [
    {
        label: "Main Body",
        transition: "Move your thumb over to the 5-way cluster",
        ids: ["cy-r2c3","cy-r2c4","cy-r2c5","cy-r2c6",
              "cy-r3c3","cy-r3c4","cy-r3c5","cy-r3c6",
              "cy-r4c4","cy-r4c5","cy-r4c6","cy-r4c7",
              "cy-r5c4","cy-r5c5","cy-r5c6","cy-r5c7"],
    },
    {
        label: "5-Way Cluster",
        transition: "Finally, press the joystick click",
        ids: ["cy-r0c1","cy-r1c0","cy-r1c1","cy-r1c2","cy-r2c1"],
    },
    {
        label: "Joystick Click",
        transition: null,
        ids: ["cy-r5c1"],
    },
];

const CYRO_LH_SECTIONS = [
    {
        label: "Main Body",
        transition: "Move your thumb over to the 5-way cluster",
        ids: ["cy-lh-r2c3","cy-lh-r2c4","cy-lh-r2c5","cy-lh-r2c6",
              "cy-lh-r3c3","cy-lh-r3c4","cy-lh-r3c5","cy-lh-r3c6",
              "cy-lh-r4c4","cy-lh-r4c5","cy-lh-r4c6","cy-lh-r4c7",
              "cy-lh-r5c4","cy-lh-r5c5","cy-lh-r5c6","cy-lh-r5c7"],
    },
    {
        label: "5-Way Cluster",
        transition: "Finally, press the joystick click",
        ids: ["cy-lh-r0c1","cy-lh-r1c0","cy-lh-r1c1","cy-lh-r1c2","cy-lh-r2c1"],
    },
    {
        label: "Joystick Click",
        transition: null,
        ids: ["cy-lh-r5c1"],
    },
];

const DEVICE_CONFIGS = {
    'cyborg2': {
        name: 'LH Cyborg II',
        baseKeys: KEYS_CYBORG2,
        pinToKeyId: PIN_TO_KEY_ID_CYBORG2,
        joystick: { left: 434, top: 286 },
        contentWidth: 665,
        autoDetectDevice: 8,
        calibrationSections: CYBORG2_SECTIONS,
        knownPid: "12F7",
    },
    'cyborg2-lefty': {
        name: 'RH Cyborg II',
        baseKeys: KEYS_CYBORG2_LEFTY,
        pinToKeyId: PIN_TO_KEY_ID_CYBORG2,
        joystick: { left: 111, top: 286 },
        contentWidth: 665,
        autoDetectDevice: null,
        calibrationSections: CYBORG2_SECTIONS,
        knownPid: "12F7",
    },
    'cyborg1': {
        name: 'LH Cyborg I',
        baseKeys: KEYS_CYBORG1,
        pinToKeyId: PIN_TO_KEY_ID_CYBORG2,
        joystick: { left: 434, top: 286 },
        contentWidth: 665,
        autoDetectDevice: null,
        calibrationSections: CYBORG1_SECTIONS,
        knownPid: "113C",
    },
    'cyborg1-lefty': {
        name: 'RH Cyborg I',
        baseKeys: KEYS_CYBORG1_LEFTY,
        pinToKeyId: PIN_TO_KEY_ID_CYBORG2,
        joystick: { left: 111, top: 286 },
        contentWidth: 665,
        autoDetectDevice: null,
        calibrationSections: CYBORG1_SECTIONS,
        knownPid: "113C",
    },
    'keyzen': {
        name: 'LH Keyzen',
        baseKeys: KEYS_KEYZEN,
        pinToKeyId: PIN_TO_KEY_ID_KEYZEN,
        joystick: { left: 430, top: 261 },
        contentWidth: 631,
        autoDetectDevice: [8, 9],
        calibrationSections: KEYZEN_SECTIONS,
        knownPid: "13EA",
    },
    'cyro': {
        name: 'RH Cyro',
        baseKeys: KEYS_CYRO,
        pinToKeyId: PIN_TO_KEY_ID_CYRO,
        joystick: { left: 84, top: 291 },
        contentWidth: 581,
        autoDetectDevice: 4,
        calibrationSections: CYRO_SECTIONS,
        knownPid: "1103",
    },
    'cyro-lh': {
        name: 'LH Cyro',
        baseKeys: KEYS_CYRO_LH,
        pinToKeyId: PIN_TO_KEY_ID_CYRO_LH,
        joystick: { left: 377, top: 291 },
        contentWidth: 497,
        autoDetectDevice: null,
        calibrationSections: CYRO_LH_SECTIONS,
        knownPid: "1103",
    },
    'keyzen-rh': {
        name: 'RH Keyzen',
        baseKeys: KEYS_KEYZEN_RH,
        pinToKeyId: PIN_TO_KEY_ID_KEYZEN_RH,
        joystick: { left: 161, top: 271 },
        contentWidth: 697,
        autoDetectDevice: null,
        calibrationSections: KEYZEN_RH_SECTIONS,
        knownPid: "13EA",
    },
};

// Runtime state
let activeDeviceId    = localStorage.getItem("activeDevice") || "cyborg2";
let joystickKeys      = JSON.parse(localStorage.getItem("joystickKeys") || "null") || { up: "w", down: "s", left: "a", right: "d" };
let movementState     = Object.fromEntries(Object.values(joystickKeys).map(k => [k, false]));
let isClickthrough    = false;
let isUnlocked        = false;
let isDragging        = false;
let currentEditingKey = null;
let dragStartX, dragStartY, overlayStartX, overlayStartY;
let displays            = [];
let currentDisplayId    = null;
let currentDisplayBounds = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };

// Persisted settings
let overlayScale   = parseFloat(localStorage.getItem("overlayScale"))   || 1;
let overlayOpacity = parseFloat(localStorage.getItem("overlayOpacity")) || 1;
let accentColor    = localStorage.getItem("accentColor") || "#ffffff";
let keyBgColor     = localStorage.getItem("keyBgColor")  || "#0f0f0f";
let keyTextMode    = localStorage.getItem("keyTextMode") || "label";

// Active layout state — populated by switchDevice()
let keys   = [];
const keyMap = {};



/* -----------------------------
   JOYSTICK
----------------------------- */

function updateJoystick() {
    const x = (movementState[joystickKeys.right] ? JOYSTICK_DISTANCE : 0) - (movementState[joystickKeys.left] ? JOYSTICK_DISTANCE : 0);
    const y = (movementState[joystickKeys.down]  ? JOYSTICK_DISTANCE : 0) - (movementState[joystickKeys.up]   ? JOYSTICK_DISTANCE : 0);
    stick.style.transform = `translate(${x}px, ${y}px)`;
}

// Drives the stick from real analog joystick/gamepad HID axis data (Azeron's "joystick
// mode"), independent of the digital WASD path above (Azeron's "keyboard mode"). A given
// device only ever sends one or the other, so there's no conflict between the two.
function updateJoystickAxis(x, y) {
    stick.style.transform = `translate(${x * JOYSTICK_DISTANCE}px, ${y * JOYSTICK_DISTANCE}px)`;
}



/* -----------------------------
   WEBSOCKET
----------------------------- */

let socket;

const backendStatus = document.getElementById("backend-status");
const calibrateHint = document.getElementById("calibrate-hint");

let deviceDetectTimer = null;

function setBackendStatus(connected) {
    backendStatus.style.display = "block";
    if (connected) {
        backendStatus.textContent = "● Backend connected";
        backendStatus.style.color = "#4caf50";
    } else {
        backendStatus.textContent = "● Backend not running — check antivirus";
        backendStatus.style.color = "#f0a500";
    }
}

let hasOpenedOptionsPanel = localStorage.getItem("hasOpenedOptionsPanel") === "true";

function markOptionsPanelOpened() {
    if (hasOpenedOptionsPanel) return;
    hasOpenedOptionsPanel = true;
    localStorage.setItem("hasOpenedOptionsPanel", "true");
}

function updateCalibrateHint() {
    const hasAnyBind = Object.keys(keyMap).length > 0;
    const panelOpen  = optionsPanel.style.display === "flex";
    calibrateHint.style.display = (hasAnyBind || panelOpen || hasOpenedOptionsPanel) ? "none" : "block";
}

// A single physical Azeron device can enumerate as multiple raw-input dev_ids at
// once (its keyboard-emulation interface and its mouse-click interface get separate
// OS handles, so separate dev_ids) — so calibration must bind to the *set* of dev_ids
// seen while calibrating this layout, not just whichever one sent the last press.
// Storing only the latest dev_id meant mouse-click buttons (recorded earlier in the
// wizard) got silently dropped once a later, keyboard-interface press overwrote it.
function getBoundDeviceIds() {
    const raw = localStorage.getItem("boundDevice_" + activeDeviceId);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return [raw]; // legacy plain-string value saved before this was array-based
    }
}

function shouldIgnoreDeviceEvent(device) {
    // Gate on distinct PIDs, not raw dev_id count: a single Azeron enumerates as several
    // dev_ids (keyboard interface, mouse-click interface, joystick sub-interfaces), so
    // gating on dev_id count alone treated every mouse-capable Azeron as if a second
    // physical device were connected. That silently dropped any mouse-click bind made
    // via the Mouse dropdown or profile import (both skip calibration, so the mouse
    // interface's dev_id never gets recorded into the bound set below) — those buttons
    // never highlighted, on any monitor. connectedPids is deduped per physical unit, so
    // it only trips this filter when genuinely different Azeron hardware is connected
    // simultaneously, which is what this filter is actually meant to isolate.
    if (connectedPids.length <= 1 || !device) return false;
    const bound = getBoundDeviceIds();
    if (!bound.length) return false;
    // Only enforce the binding once at least one of its dev_ids is still actually
    // connected — otherwise a stale binding from an unplugged device would silently
    // block every future device forever.
    if (!bound.some(d => connectedDeviceIds.includes(d))) return false;
    return !bound.includes(device);
}

function connectWebSocket() {
    socket = new WebSocket("ws://localhost:8765");

    socket.onopen  = () => {
        console.log("WebSocket connected");
        setBackendStatus(true);
        // If no device_info arrives within 3s, show a nudge
        deviceDetectTimer = setTimeout(() => {
            if (!connectedPids.length) {
                calibrationStatus.textContent = "No Azeron detected — check USB connection";
                calibrationStatus.style.color = "#f0a500";
                calibrationStatus.style.display = "block";
            }
        }, 3000);
    };
    socket.onerror = () => {};

    socket.onclose = () => {
        console.log("WebSocket closed, retrying in 1s...");
        clearTimeout(deviceDetectTimer);
        setBackendStatus(false);
        Object.keys(movementState).forEach(k => movementState[k] = false);
        updateJoystick();
        updateJoystickAxis(0, 0);
        document.querySelectorAll(".key.active").forEach(el => el.classList.remove("active"));
        setTimeout(connectWebSocket, 1000);
    };

    socket.onmessage = (event) => {
        const active = document.activeElement;
        if (active === popupLabelInput || active === popupKeybindInput) return;

        const msg = JSON.parse(event.data);

        if (msg.type === "device_info") {
            clearTimeout(deviceDetectTimer);
            handleDeviceInfo(msg.pids || [], msg.devices || []);
            return;
        }

        if (msg.type === "joystick_axis") {
            if (shouldIgnoreDeviceEvent(msg.device)) return;
            if (calibrationActive) return;
            updateJoystickAxis(msg.x, msg.y);
            return;
        }

        const { key, action, device } = msg;

        // Calibration must see presses from every Azeron interface, unfiltered — it's
        // the only place that accumulates newly-seen dev_ids into the bound set (see
        // getBoundDeviceIds/shouldIgnoreDeviceEvent above). Filtering here first would
        // deadlock: once one interface's dev_id gets bound (e.g. the keyboard-emulation
        // interface, calibrated first), every later step from a *different* interface
        // of the same physical device (e.g. its mouse-click interface) would be dropped
        // before ever reaching calibrationRecordKey, so it could never get added.
        if (calibrationActive && action === "down") {
            calibrationRecordKey(key, device);
            return;
        }

        // Multi-device filtering: when >1 Azeron is connected, only react to the
        // device(s) that were used to calibrate this layout (bound during calibration).
        if (shouldIgnoreDeviceEvent(device)) return;

        if (key in movementState) movementState[key] = action === "down";
        updateJoystick();

        const el = document.getElementById(keyMap[key]);
        if (!el) return;
        el.classList.toggle("active", action === "down");
    };
}



/* -----------------------------
   CALIBRATION WIZARD
----------------------------- */

const SUPPORTED_PIDS = {
    // Add known PIDs here as they are confirmed
    // "0CD3": "Cyborg II Rev1",
};

// Built lazily on first use so DEVICE_CONFIGS and keys are already defined
let _calibrationOrder = null;
function getCalibrationSections() {
    return DEVICE_CONFIGS[activeDeviceId]?.calibrationSections || null;
}
function getCalibrationOrder() {
    if (!_calibrationOrder) {
        const sections = getCalibrationSections();
        if (sections) {
            _calibrationOrder = sections.flatMap(s => s.ids);
        } else {
            const cfg = DEVICE_CONFIGS[activeDeviceId];
            _calibrationOrder = (cfg?.keys || keys).filter(k => k.type !== "scroll").map(k => k.id);
        }
    }
    return _calibrationOrder;
}
function getSectionAtStep(step) {
    const sections = getCalibrationSections();
    if (!sections) return null;
    let offset = 0;
    for (let i = 0; i < sections.length; i++) {
        offset += sections[i].ids.length;
        if (step < offset) return sections[i];
    }
    return null;
}
function isSectionBoundary(step) {
    const sections = getCalibrationSections();
    if (!sections) return false;
    let offset = 0;
    for (let i = 0; i < sections.length - 1; i++) {
        offset += sections[i].ids.length;
        if (step === offset) return sections[i]; // returns completed section
    }
    return false;
}

let calibrationActive = false;
let calibrationStep   = 0;
let calibrationMap    = {};
let connectedPids      = [];
let connectedDeviceIds = [];

function updateCalibrationStatus() {
    const knownPid = DEVICE_CONFIGS[activeDeviceId]?.knownPid;
    if (knownPid && SUPPORTED_PIDS[knownPid]) {
        calibrationStatus.textContent = `Hardware supported natively (${SUPPORTED_PIDS[knownPid]})`;
        calibrationStatus.style.color = "";
        calibrationStatus.style.display = "block";
        calibrateBtn.textContent = "⚠ Recalibrate";
        return;
    }
    const saved = loadCalibration();
    if (saved) {
        calibrationStatus.textContent = "Calibrated — highlights active";
        calibrationStatus.style.color = "#aaa";
        calibrationStatus.style.display = "block";
        calibrateBtn.textContent = "⚠ Recalibrate";
    } else if (DEFAULT_CALIBRATION_MAPS[activeDeviceId]) {
        calibrationStatus.textContent = "Community calibration active — recalibrate to customise";
        calibrationStatus.style.color = "#6ab0f5";
        calibrationStatus.style.display = "block";
        calibrateBtn.textContent = "⚠ Recalibrate";
    } else {
        calibrationStatus.textContent = "Unknown hardware — calibration recommended";
        calibrationStatus.style.color = "#f0a500";
        calibrationStatus.style.display = "block";
    }
}

function handleDeviceInfo(pids, deviceIds) {
    connectedPids      = pids;
    connectedDeviceIds = deviceIds;
    updateCalibrationStatus();
}

// Pre-1.8.0 Cyborg I/II button ids were named after the dev's own WoW keybinds
// (e.g. "map-dungeon-finder", "crusaders-strike") and leaked into the anonymous
// Supabase calibration uploads as-is. Renamed to neutral "az-r{row}c{col}" ids;
// this table lets calibrations saved under the old ids keep working after update.
const LEGACY_ID_ALIASES = {
    "bags-character": "az-r0c0",
    "map-dungeon-finder": "az-r1c0",  "row1-btn2": "az-r1c1",
    "row1-btn3": "az-r1c2",           "row1-btn4": "az-r1c3",
    "spellbook-talents": "az-r1c4",   "social-esc": "az-r1c5",
    "utility-ring": "az-r1c6",
    "crusaders-strike": "az-r2c0",    "judgement": "az-r2c1",
    "consecrate": "az-r2c2",          "focus-target-macro": "az-r2c3",
    "dungeon-portals": "az-r2c4",
    "light-of-dawn": "az-r3c0",       "holy-shock": "az-r3c1",
    "flash-of-light": "az-r3c2",      "holy-light": "az-r3c3",
    "word-of-glory": "az-r3c4",       "extra-actionbutton": "az-r3c5",
    "appearances-log": "az-r3c6",
    "hammer-of-wrath": "az-r4c0",     "blessing-of-seasons": "az-r4c1",
    "kick": "az-r4c2",                "racial-ability": "az-r4c3",
    "mount-journal": "az-r4c4",
    "mage-food-mana-drink": "az-r5c0","combat-ress": "az-r5c1",
    "lay-on-hands": "az-r5c2",        "jump": "az-r5c3",
    "movement-ability": "az-r5c4",
};

function loadCalibration() {
    try {
        const raw = localStorage.getItem("calibration_" + activeDeviceId);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Object.keys(parsed).some(id => id in LEGACY_ID_ALIASES)) return parsed;
        const migrated = {};
        for (const [id, val] of Object.entries(parsed)) {
            migrated[LEGACY_ID_ALIASES[id] || id] = val;
        }
        saveCalibration(migrated);
        return migrated;
    } catch { return null; }
}

function saveCalibration(map) {
    localStorage.setItem("calibration_" + activeDeviceId, JSON.stringify(map));
}

function applyCalibration(map) {
    for (const [elementId, keyValue] of Object.entries(map)) {
        if (!keyValue) continue;
        const keyObj = keys.find(k => k.id === elementId);
        if (!keyObj) continue;
        if (keyObj.keybind) delete keyMap[keyObj.keybind];
        // keyValue may be a string (single key or "shift+i") or array (e.g. ["i","o"] from I+O bind)
        const allKeys = Array.isArray(keyValue) ? keyValue : [keyValue];
        keyObj.keybind = allKeys[0];
        allKeys.forEach(k => { if (k) keyMap[k] = elementId; });
        renderKeyText(keyObj);
    }
}

function positionCalibrationPanel() {
    let gridBottom = 0;
    overlayContent.querySelectorAll(".key").forEach(k => {
        const b = k.getBoundingClientRect().bottom;
        if (b > gridBottom) gridBottom = b;
    });
    const overlayTop = overlay.getBoundingClientRect().top;
    const panel = document.getElementById("calibration-panel");
    panel.style.top = (gridBottom - overlayTop + 8) + "px";
}

function startCalibration() {
    calibrationActive    = true;
    calibrationComboKeys = [];
    localStorage.removeItem("boundDevice_" + activeDeviceId);
    if (calibrationComboTimer) { clearTimeout(calibrationComboTimer); calibrationComboTimer = null; }
    calibrationStep          = 0;
    calibrationMap           = {};
    calibrationCooldownUntil = 0;
    optionsPanel.style.display = "none";
    updateCalibrateHint();
    overlayContent.classList.remove("edit-mode");
    document.activeElement?.blur();
    if (isClickthrough) ipcRenderer.send("set-clickthrough", false);
    showCalibrationStep();
}

let calibrationSkipTimer   = null;
let calibrationCountdown   = 0;
const CALIBRATION_SKIP_SEC = 8;

function clearCalibrationTimer() {
    if (calibrationSkipTimer) { clearInterval(calibrationSkipTimer); calibrationSkipTimer = null; }
}

function startCalibrationTimer() {
    clearCalibrationTimer();
    calibrationCountdown = CALIBRATION_SKIP_SEC;
    updateCalibrationPrompt();
    calibrationSkipTimer = setInterval(() => {
        calibrationCountdown--;
        updateCalibrationPrompt();
        if (calibrationCountdown <= 0) {
            clearCalibrationTimer();
            calibrationMap[getCalibrationOrder()[calibrationStep]] = null;
            calibrationStep++;
            advanceCalibrationStep();
        }
    }, 1000);
}

function updateCalibrationPrompt() {
    calibrationPrompt.textContent =
        `Press the highlighted button on your Azeron (auto-skip in ${calibrationCountdown}s if unbound)`;
}

function showSectionBreak(completedSection) {
    clearCalibrationTimer();
    document.querySelectorAll(".key.calibrating").forEach(k => k.classList.remove("calibrating"));
    calibrationBreakMsg.textContent = completedSection.transition;
    const nextSection = getSectionAtStep(calibrationStep);
    calibrationBreakNext.textContent = nextSection ? `Next: ${nextSection.label}` : "";
    calibrationStepsView.style.display = "none";
    calibrationBreakView.style.display = "flex";
    // Re-assert clickthrough is off — mouseleave on the options panel can race with this
    ipcRenderer.send("set-clickthrough", false);
}

function resumeFromSectionBreak() {
    calibrationBreakView.style.display = "none";
    calibrationStepsView.style.display = "";
    showCalibrationStep();
}

function advanceCalibrationStep() {
    if (calibrationStep >= getCalibrationOrder().length) {
        finishCalibration();
    } else {
        showCalibrationStep();
    }
}

function showCalibrationStep() {
    clearCalibrationTimer();
    document.querySelectorAll(".key.calibrating").forEach(k => k.classList.remove("calibrating"));
    if (calibrationStep >= getCalibrationOrder().length) {
        finishCalibration();
        return;
    }
    const section = getSectionAtStep(calibrationStep);
    calibrationSectionLabel.textContent = section ? section.label : "";
    const elementId = getCalibrationOrder()[calibrationStep];
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add("calibrating");
        el.scrollIntoView?.({ block: "nearest" });
    }
    calibrationProgress.textContent =
        `Button ${calibrationStep + 1} of ${getCalibrationOrder().length}`;
    calibrationBackBtn.disabled = calibrationStep === 0;
    startCalibrationTimer();
}

let calibrationComboKeys     = [];
let calibrationComboTimer    = null;
let calibrationCooldownUntil = 0;
const CALIBRATION_COOLDOWN_MS = 400;

function flushCalibrationCombo() {
    calibrationComboTimer = null;
    if (!calibrationActive || calibrationComboKeys.length === 0) return;
    const collected = [...calibrationComboKeys];
    calibrationComboKeys = [];
    clearCalibrationTimer();
    const elementId = getCalibrationOrder()[calibrationStep];
    // Store as a single string for one key, or array for multi-key binds (e.g. I+O)
    calibrationMap[elementId] = collected.length === 1 ? collected[0] : collected;
    calibrationStep++;
    calibrationCooldownUntil = Date.now() + CALIBRATION_COOLDOWN_MS;
    advanceCalibrationStep();
}

function calibrationRecordKey(key, device) {
    if (Date.now() < calibrationCooldownUntil) return;
    // Auto-bind this physical device to the current layout. A single physical Azeron
    // can send presses under more than one dev_id (its keyboard-emulation interface
    // vs. its mouse-click interface), so accumulate every dev_id seen this session
    // instead of overwriting — otherwise whichever interface calibrates last would
    // silently unbind the others. Gate on distinct PIDs (see shouldIgnoreDeviceEvent)
    // so this only activates when genuinely different Azeron hardware is connected.
    if (device && connectedPids.length > 1) {
        const bound = getBoundDeviceIds();
        if (!bound.includes(device)) {
            bound.push(device);
            localStorage.setItem("boundDevice_" + activeDeviceId, JSON.stringify(bound));
        }
    }
    calibrationComboKeys.push(key);
    if (calibrationComboTimer) clearTimeout(calibrationComboTimer);
    // 100ms window — long enough to catch the second key of I+O, fast enough not to feel slow
    calibrationComboTimer = setTimeout(flushCalibrationCombo, 100);
}

// ---- Supabase anonymous data submission ----
// Replace these two values once your Supabase project is created (Settings → API).
const SUPABASE_URL = "https://gndjejpohyvicmfyzkdo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZGplanBvaHl2aWNtZnl6a2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTIyNjAsImV4cCI6MjA5NzYyODI2MH0.PP0ogOtpcMfZ-FO0sQXajs4J589KvDCJzqXALArLWuM";

async function submitCalibrationData(map) {
    if (!shareAnonymousData) return;
    // Skip if the placeholders haven't been filled in yet
    if (SUPABASE_URL.includes("YOUR_PROJECT_ID") || SUPABASE_KEY.includes("YOUR_ANON")) return;
    try {
        const version = await ipcRenderer.invoke("get-version");
        const entries      = Object.values(map);
        const total_count  = entries.length;
        const mapped_count = entries.filter(v => v !== null).length;
        await fetch(`${SUPABASE_URL}/rest/v1/calibrations`, {
            method: "POST",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            body: JSON.stringify({
                device_id:       activeDeviceId,
                pid:             DEVICE_CONFIGS[activeDeviceId]?.knownPid || null,
                calibration_map: JSON.stringify(map),
                total_count,
                mapped_count,
                app_version:     version,
                submitted_at:    new Date().toISOString(),
            }),
        });
    } catch (e) {
        console.warn("Calibration data submission failed:", e);
    }
}

function finishCalibration() {
    calibrationActive = false;
    document.querySelectorAll(".key.calibrating").forEach(k => k.classList.remove("calibrating"));
    saveCalibration(calibrationMap);
    applyCalibration(calibrationMap);
    submitCalibrationData(calibrationMap);
    calibrationStatus.textContent = "Calibrated — highlights active";
    calibrationStatus.style.color = "#aaa";
    calibrationStatus.style.display = "block";
    calibrateBtn.textContent = "⚠ Recalibrate";
    updateCalibrateHint();
    if (isClickthrough) ipcRenderer.send("set-clickthrough", true);
}

function cancelCalibration() {
    clearCalibrationTimer();
    if (calibrationComboTimer) { clearTimeout(calibrationComboTimer); calibrationComboTimer = null; }
    calibrationComboKeys = [];
    calibrationActive    = false;
    document.querySelectorAll(".key.calibrating").forEach(k => k.classList.remove("calibrating"));
    if (isClickthrough) ipcRenderer.send("set-clickthrough", true);
}

calibrateBtn.addEventListener("click", () => {
    optionsPanel.style.display = "none";
    updateCalibrateHint();
    overlayContent.classList.remove("edit-mode");
    startCalibration();
});

calibrationBackBtn.addEventListener("click", () => {
    if (calibrationStep === 0) return;
    clearCalibrationTimer();
    if (calibrationComboTimer) { clearTimeout(calibrationComboTimer); calibrationComboTimer = null; }
    calibrationComboKeys = [];
    const prevId = getCalibrationOrder()[calibrationStep - 1];
    delete calibrationMap[prevId];
    calibrationStep--;
    showCalibrationStep();
});

calibrationSkipBtn.addEventListener("click", () => {
    clearCalibrationTimer();
    calibrationMap[getCalibrationOrder()[calibrationStep]] = null;
    calibrationStep++;
    advanceCalibrationStep();
});

calibrationCancelBtn.addEventListener("click", cancelCalibration);
calibrationBreakBackBtn.addEventListener("click", () => {
    if (calibrationComboTimer) { clearTimeout(calibrationComboTimer); calibrationComboTimer = null; }
    calibrationComboKeys = [];
    const prevId = getCalibrationOrder()[calibrationStep - 1];
    delete calibrationMap[prevId];
    calibrationStep--;
    calibrationBreakView.style.display = "none";
    calibrationStepsView.style.display = "";
    showCalibrationStep();
});
calibrationContinueBtn.addEventListener("click", resumeFromSectionBreak);
calibrationCancelBreakBtn.addEventListener("click", cancelCalibration);

// Community-sourced default calibration maps, keyed by device_id.
// Paste calibration_map JSON from Supabase submissions here as they come in.
const DEFAULT_CALIBRATION_MAPS = {
    // "cyborg2": { "az-r1c0": "m", ... },
};

function applyDefaultCalibrationIfNeeded() {
    const saved = loadCalibration();
    if (saved) {
        applyCalibration(saved);
        return "saved";
    }
    const def = DEFAULT_CALIBRATION_MAPS[activeDeviceId];
    if (def) {
        applyCalibration(def);
        return "default";
    }
    return null;
}

// Apply saved or community calibration on load
applyDefaultCalibrationIfNeeded();



/* -----------------------------
   OPTIONS PANEL
----------------------------- */

closeButton.addEventListener("click", () => window.close());

// Floats the panel above the whole overlay if there's room, otherwise below the key
// grid — used both for a manual gear-icon open and the automatic first-run open, so
// neither path leaves the panel at its static CSS position overlapping the grid.
function positionOptionsPanel() {
    const uiRect    = optionsUi.getBoundingClientRect();
    const panelH    = optionsPanel.getBoundingClientRect().height;
    const overlayRect = overlay.getBoundingClientRect();

    // Preferred: float above the overlay (bottom of panel = top of overlay - 8px gap)
    const desiredBottom = overlayRect.top - 8;
    if (desiredBottom - panelH >= 0) {
        optionsPanel.style.top = (desiredBottom - uiRect.top - panelH) + "px";
    } else {
        // Fallback: below the key grid
        let maxKeyBottom = 0;
        overlayContent.querySelectorAll(".key").forEach(el => {
            const b = el.getBoundingClientRect().bottom;
            if (b > maxKeyBottom) maxKeyBottom = b;
        });
        optionsPanel.style.top = (maxKeyBottom - uiRect.top + 8) + "px";
    }
}

optionsButton.addEventListener("click", () => {
    if (calibrationActive) { cancelCalibration(); return; }
    const opening = optionsPanel.style.display !== "flex";
    optionsPanel.style.display = opening ? "flex" : "none";
    if (opening) markOptionsPanelOpened();
    updateCalibrateHint();
    overlayContent.classList.toggle("edit-mode", opening);
    if (!opening) { closeKeyPopup(); return; }

    positionOptionsPanel();
});



/* -----------------------------
   SCALE
----------------------------- */

function updateOverlayScale() {
    overlayContent.style.transform = `scale(${overlayScale})`;
}

scaleSlider.value = overlayScale;
scaleSlider.addEventListener("input", () => {
    overlayScale = parseFloat(scaleSlider.value);
    localStorage.setItem("overlayScale", overlayScale);
    updateOverlayScale();
});



/* -----------------------------
   OPACITY
----------------------------- */

function updateOverlayOpacity() {
    overlayContent.style.opacity = overlayOpacity;
}

opacitySlider.value = overlayOpacity;
opacitySlider.addEventListener("input", () => {
    overlayOpacity = parseFloat(opacitySlider.value);
    localStorage.setItem("overlayOpacity", overlayOpacity);
    updateOverlayOpacity();
});



/* -----------------------------
   ACCENT COLOR
----------------------------- */

function applyAccentColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const fg = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#000000" : "#ffffff";
    document.documentElement.style.setProperty("--accent",    hex);
    document.documentElement.style.setProperty("--accent-bg", `rgba(${r},${g},${b},0.15)`);
    document.documentElement.style.setProperty("--accent-fg", fg);
}

colorPicker.value = accentColor;
colorPicker.addEventListener("input", () => {
    accentColor = colorPicker.value;
    localStorage.setItem("accentColor", accentColor);
    applyAccentColor(accentColor);
});

function applyKeyBgColor(hex) {
    document.documentElement.style.setProperty("--key-bg", hex);
}

keyBgPicker.value = keyBgColor;
keyBgPicker.addEventListener("input", () => {
    keyBgColor = keyBgPicker.value;
    localStorage.setItem("keyBgColor", keyBgColor);
    applyKeyBgColor(keyBgColor);
});



/* -----------------------------
   KEY TEXT DISPLAY MODE
   Label only (default), Keybind only, or both stacked on separate lines.
----------------------------- */

function getKeyDisplayText(keyObj) {
    const label   = keyObj.label   || "";
    const keybind = keyObj.keybind || "";
    if (keyTextMode === "keybind") return keybind || label;
    if (keyTextMode === "both") {
        if (label && keybind && label !== keybind) return label + "\n" + keybind;
        return label || keybind;
    }
    return label || keybind; // "label" (default)
}

function renderKeyText(keyObj) {
    const el = document.getElementById(keyObj.id);
    if (!el || el.classList.contains("scroll-indicator")) return;
    el.innerText = getKeyDisplayText(keyObj);
    el.classList.toggle("empty", !keyObj.label && !keyObj.keybind);
}

keyTextModeSelect.value = keyTextMode;
keyTextModeSelect.addEventListener("change", () => {
    keyTextMode = keyTextModeSelect.value;
    localStorage.setItem("keyTextMode", keyTextMode);
    keys.forEach(renderKeyText);
});



/* -----------------------------
   UNLOCK / DRAG
----------------------------- */

overlay.addEventListener("mousedown", (e) => {
    if (!isUnlocked) return;
    isDragging    = true;
    dragStartX    = e.clientX;
    dragStartY    = e.clientY;
    overlayStartX = parseInt(overlay.style.left) || 0;
    overlayStartY = parseInt(overlay.style.top)  || 0;
    overlay.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    overlay.style.left = (overlayStartX + e.clientX - dragStartX) + "px";
    overlay.style.top  = (overlayStartY + e.clientY - dragStartY) + "px";
});

document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    overlay.style.cursor = "grab";
    localStorage.setItem("overlayX", overlay.style.left);
    localStorage.setItem("overlayY", overlay.style.top);
});

unlockBtn.addEventListener("click", () => {
    isUnlocked = !isUnlocked;
    unlockBtn.textContent = isUnlocked ? "Lock position" : "Unlock position";
    unlockBtn.classList.toggle("active", isUnlocked);
    overlay.style.cursor = isUnlocked ? "grab" : "";
});



/* -----------------------------
   CLICKTHROUGH
----------------------------- */

function setClickthrough(value) {
    isClickthrough = value;
    ipcRenderer.send("set-clickthrough", value);
    clickthroughBtn.textContent = value ? "Disable clickthrough" : "Enable clickthrough";
    clickthroughBtn.classList.toggle("active", value);
    if (value) {
        optionsPanel.style.display = "none";
        updateCalibrateHint();
        overlayContent.classList.remove("edit-mode");
        closeKeyPopup();
    }
}

optionsUi.addEventListener("mouseenter", () => { if (isClickthrough) ipcRenderer.send("set-clickthrough", false); });
optionsUi.addEventListener("mouseleave", () => { if (isClickthrough && !calibrationActive) ipcRenderer.send("set-clickthrough", true); });

// Prevent Azeron buttons bound to Space/Enter from accidentally clicking focused UI elements during calibration.
// The Azeron enumerates as a HID keyboard, so every button press generates both a Raw Input event
// (captured by the listener) AND a regular DOM keyboard event that can trigger button clicks.
document.addEventListener('keydown', (e) => {
    if (calibrationActive && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
    }
});

clickthroughBtn.addEventListener("click", () => setClickthrough(!isClickthrough));

setClickthrough(true);

/* ---- PRIVACY / DATA SHARING ---- */

let shareAnonymousData = true; // mirrors installer default (opt-out)

ipcRenderer.invoke('get-prefs').then(prefs => {
    if (typeof prefs.shareAnonymousData === 'boolean') {
        shareAnonymousData = prefs.shareAnonymousData;
    }
    shareDataCheck.checked = shareAnonymousData;
});

shareDataCheck.addEventListener('change', () => {
    shareAnonymousData = shareDataCheck.checked;
    ipcRenderer.send('set-pref', 'shareAnonymousData', shareAnonymousData);
});

resetPositionBtn.addEventListener("click", resetPosition);

function resetPosition() {
    overlay.style.left = "100px";
    overlay.style.top  = "100px";
    localStorage.setItem("overlayX", "100px");
    localStorage.setItem("overlayY", "100px");
}



/* -----------------------------
   MONITOR SWITCHING
----------------------------- */

function updateMonitorBtn() {
    const idx = displays.findIndex(d => d.id === currentDisplayId);
    if (displays.length <= 1) { monitorBtn.style.display = "none"; return; }
    monitorBtn.style.display = "";
    const d = displays[idx] || displays[0];
    monitorBtn.innerHTML = `Monitor<br><span class="monitor-idx">${idx + 1}/${displays.length}</span>`;
}

async function switchToDisplay(displayId) {
    const bounds = await ipcRenderer.invoke("move-to-display", displayId);
    if (!bounds) return;
    currentDisplayId     = displayId;
    currentDisplayBounds = { x: 0, y: 0, width: bounds.width, height: bounds.height };
    localStorage.setItem("displayId", String(displayId));
    overlay.style.left = "100px";
    overlay.style.top  = "100px";
    localStorage.setItem("overlayX", "100px");
    localStorage.setItem("overlayY", "100px");
    updateMonitorBtn();
}

monitorBtn.addEventListener("click", () => {
    if (displays.length <= 1) return;
    const idx  = displays.findIndex(d => d.id === currentDisplayId);
    const next = displays[(idx + 1) % displays.length];
    switchToDisplay(next.id);
});

/* -----------------------------
   AUTO-UPDATE
----------------------------- */

ipcRenderer.on("update-status", (_event, status) => {
    updateBadge.style.display = "";
    updateSection.style.display = "";
    if (status === "available") {
        updateStatusText.textContent = "Downloading update... 0%";
        retryUpdateBtn.style.display = "none";
    } else if (status.startsWith("downloading:")) {
        const pct = status.split(":")[1];
        updateStatusText.textContent = `Downloading update... ${pct}%`;
        retryUpdateBtn.style.display = "none";
    } else if (status === "ready") {
        updateStatusText.textContent = "Update ready to install.";
        installUpdateBtn.style.display = "";
        retryUpdateBtn.style.display = "none";
    } else if (status.startsWith("error")) {
        const msg = status.startsWith("error:") ? status.slice(6) : "Unknown error.";
        updateStatusText.textContent = msg;
        retryUpdateBtn.style.display = "";
    }
});

installUpdateBtn.addEventListener("click", () => ipcRenderer.send("install-update"));
retryUpdateBtn.addEventListener("click", () => ipcRenderer.send("retry-update"));



/* -----------------------------
   PROFILE IMPORT
----------------------------- */

const VK_TO_KEY = {
     8: "backspace",  9: "tab",    13: "enter",  27: "esc",   32: "space",
    16: "shift",     17: "ctrl",  18: "alt",
   160: "shift",   161: "shift", 162: "ctrl", 163: "ctrl", 164: "alt", 165: "alt",
    33: "pgup",  34: "pgdn",  35: "end",  36: "home",
    37: "left",      38: "up",    39: "right",  40: "down",  45: "insert", 46: "delete",
    48: "0",  49: "1",  50: "2",  51: "3",  52: "4",  53: "5",  54: "6",  55: "7",  56: "8",  57: "9",
    65: "a",  66: "b",  67: "c",  68: "d",  69: "e",  70: "f",  71: "g",  72: "h",  73: "i",
    74: "j",  75: "k",  76: "l",  77: "m",  78: "n",  79: "o",  80: "p",  81: "q",  82: "r",
    83: "s",  84: "t",  85: "u",  86: "v",  87: "w",  88: "x",  89: "y",  90: "z",
    96: "num0",  97: "num1",  98: "num2",  99: "num3", 100: "num4",
   101: "num5", 102: "num6", 103: "num7", 104: "num8", 105: "num9",
   106: "num*", 107: "num+", 109: "num-", 110: "num.", 111: "num/",
    112: "f1",  113: "f2",  114: "f3",  115: "f4",  116: "f5",  117: "f6",
    118: "f7",  119: "f8",  120: "f9",  121: "f10", 122: "f11", 123: "f12",
    186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`",
    219: "[", 220: "\\", 221: "]", 222: "'",
};

// v2 software uses Web KeyboardEvent code strings instead of VK numbers
const WEB_CODE_TO_KEY = {
    Space: "space", Enter: "enter", Backspace: "backspace", Tab: "tab",
    Escape: "esc", Delete: "delete", Insert: "insert",
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    ShiftLeft: "shift", ShiftRight: "shift",
    ControlLeft: "ctrl", ControlRight: "ctrl",
    AltLeft: "alt", AltRight: "alt",
    Equal: "=", Minus: "-", BracketLeft: "[", BracketRight: "]",
    Semicolon: ";", Quote: "'", Backquote: "`", Backslash: "\\",
    Comma: ",", Period: ".", Slash: "/",
    F1: "f1", F2: "f2", F3: "f3", F4: "f4", F5: "f5", F6: "f6",
    F7: "f7", F8: "f8", F9: "f9", F10: "f10", F11: "f11", F12: "f12",
    PageUp: "pgup", PageDown: "pgdn", End: "end", Home: "home",
    Numpad0: "num0", Numpad1: "num1", Numpad2: "num2", Numpad3: "num3", Numpad4: "num4",
    Numpad5: "num5", Numpad6: "num6", Numpad7: "num7", Numpad8: "num8", Numpad9: "num9",
    NumpadMultiply: "num*", NumpadAdd: "num+", NumpadSubtract: "num-",
    NumpadDecimal: "num.", NumpadDivide: "num/", NumpadEnter: "enter",
};

// Azeron v1.5.x type-16 macro kv values that don't correspond to Windows VK codes.
// Derived empirically from Benji_Profile.json cross-referenced with Azeron Software key labels.
const AZERON_MACRO_KV_OVERRIDE = {
     5: "num*",  6: "num0",
     7: "9",    11: "7",   12: "5",   13: "2",
    16: "-",    17: "[",   19: "]",
    25: "u",
};

// Azeron profile type "15" = a button assigned a native mouse-click function, with
// keyValues[0] selecting which button. "1"/"3" confirmed from a Cyborg II "Mouse"
// profile export (Left/Right Click). "2" confirmed from a Cyro export (software
// v2.0.1) — by elimination against 1/3 this is Middle Click. Button 4/5 (back/forward)
// values are still unconfirmed and intentionally left unmapped rather than guessed.
const MOUSE_CLICK_KV_TO_BIND = {
    "1": { keybind: "mouse1", label: "Left Click" },
    "2": { keybind: "mouse3", label: "Middle Click" },
    "3": { keybind: "mouse2", label: "Right Click" },
};

function resolveKey(val) {
    if (!val || val === "0") return null;
    const letter = val.match(/^Key([A-Z])$/);
    if (letter) return letter[1].toLowerCase();
    const digit = val.match(/^Digit(\d)$/);
    if (digit) return digit[1];
    if (WEB_CODE_TO_KEY[val]) return WEB_CODE_TO_KEY[val];
    const vk = parseInt(val);
    return (!isNaN(vk) && vk) ? (VK_TO_KEY[vk] || null) : null;
}

function resolveModifier(val) {
    if (!val || val === "0") return null;
    if (val === "ShiftLeft"   || val === "ShiftRight")   return "shift";
    if (val === "ControlLeft" || val === "ControlRight") return "ctrl";
    if (val === "AltLeft"     || val === "AltRight")     return "alt";
    const vk = parseInt(val);
    if (vk === 16 || vk === 160 || vk === 161) return "shift";
    if (vk === 17 || vk === 162 || vk === 163) return "ctrl";
    if (vk === 18 || vk === 164 || vk === 165) return "alt";
    return null;
}

function buildKeybindString(keyVal, metaValues) {
    const key = resolveKey(keyVal);
    if (!key) return "";
    const mods = new Set();
    for (const mv of metaValues) {
        const mod = resolveModifier(mv);
        if (mod) mods.add(mod);
    }
    const parts = [];
    if (mods.has("ctrl"))  parts.push("ctrl");
    if (mods.has("shift")) parts.push("shift");
    if (mods.has("alt"))   parts.push("alt");
    parts.push(key);
    return parts.join("+");
}

function applyAzeronProfile(profile) {
    const deviceNum = profile.metaData?.device;
    if (deviceNum !== undefined) {
        const deviceMatches = (ad) => Array.isArray(ad) ? ad.includes(deviceNum) : ad === deviceNum;
        const currentCfg = DEVICE_CONFIGS[activeDeviceId];
        if (!deviceMatches(currentCfg?.autoDetectDevice)) {
            const match = Object.entries(DEVICE_CONFIGS).find(([, cfg]) => deviceMatches(cfg.autoDetectDevice));
            const expectedName = match ? DEVICE_CONFIGS[match[0]].name : "a different device";
            showImportStatus(`Profile is for ${expectedName} — switch to that device first, then import again.`);
            return null;
        }
    }

    let pinToKeyId = DEVICE_CONFIGS[activeDeviceId].pinToKeyId;
    // Benji-style firmware has pins up to 43 (pins 38+). The user's firmware tops out at 37.
    // Both export pin=0 (encoder) so we distinguish by checking for pins above 37.
    if ((activeDeviceId === 'cyborg2' || activeDeviceId === 'cyborg2-lefty') &&
        profile.inputs.some(inp => inp.pinOne > 37 && inp.pinOne !== 255)) {
        pinToKeyId = PIN_TO_KEY_ID_CYBORG2_V2;
    }

    const joystickInput = profile.inputs.find(
        inp => (inp.types?.[0] === "4" || inp.types?.[0] === "21") &&
               inp.analogSettings?.analogKeys?.left
    );
    if (joystickInput) {
        const ak   = joystickInput.analogSettings.analogKeys.left;
        const up   = resolveKey(String(ak.up?.[0]));
        const down = resolveKey(String(ak.down?.[0]));
        const left = resolveKey(String(ak.left?.[0]));
        const right= resolveKey(String(ak.right?.[0]));
        if (up || down || left || right) {
            joystickKeys  = { up: up || joystickKeys.up, down: down || joystickKeys.down, left: left || joystickKeys.left, right: right || joystickKeys.right };
            movementState = Object.fromEntries(Object.values(joystickKeys).map(k => [k, false]));
            localStorage.setItem("joystickKeys", JSON.stringify(joystickKeys));
        }
    }

    let count = 0;
    const seenPins = new Set();
    for (const input of profile.inputs) {
        const keyId  = pinToKeyId[input.pinOne];
        if (!keyId) continue;
        if (seenPins.has(input.pinOne)) continue;
        const keyObj = keys.find(k => k.id === keyId);
        if (!keyObj) continue;

        const label    = (input.label || "").trim();
        // For type-16 macros, Azeron uses its own kv numbering for low values (< 48).
        // Look up the known override first; fall through to standard VK resolution otherwise.
        const macroOverride = input.types?.[0] === "16"
            ? (AZERON_MACRO_KV_OVERRIDE[parseInt(input.keyValues?.[0])] ?? null)
            : null;
        const isKbd     = macroOverride !== null ||
                          ((input.types?.[0] === "1" || input.types?.[0] === "16") &&
                           !!resolveKey(input.keyValues?.[0]) &&
                           !resolveModifier(input.keyValues?.[0]));
        const isModOnly = input.types?.[0] === "1" && !resolveKey(input.keyValues?.[0]) &&
                          !!resolveModifier(input.metaValues?.[0]);
        const isJoyBtn  = input.types?.[0] === "5" &&
                          input.keyValues?.[0] && input.keyValues?.[0] !== "0";
        const mouseClick = input.types?.[0] === "15" ? MOUSE_CLICK_KV_TO_BIND[input.keyValues?.[0]] : undefined;
        if (!label && !isKbd && !isModOnly && !isJoyBtn && !mouseClick) continue;

        if (label) {
            seenPins.add(input.pinOne);
            keyObj.label = label;
        }

        if (isKbd) {
            let keybind;
            if (macroOverride !== null) {
                const mods = new Set();
                for (const mv of (input.metaValues || [])) {
                    const mod = resolveModifier(mv);
                    if (mod) mods.add(mod);
                }
                const modParts = ["ctrl", "shift", "alt"].filter(m => mods.has(m));
                keybind = [...modParts, macroOverride].join("+") || null;
            } else {
                keybind = buildKeybindString(input.keyValues[0], input.metaValues || []);
            }
            if (keybind) {
                delete keyMap[keyObj.keybind];
                keyObj.keybind = keybind;
                keyMap[keybind] = keyId;
                seenPins.add(input.pinOne);
                if (!label) keyObj.label = keybind;
            }
        } else if (isModOnly) {
            const keybind = resolveModifier(input.metaValues[0]);
            delete keyMap[keyObj.keybind];
            keyObj.keybind = keybind;
            keyMap[keybind] = keyId;
            seenPins.add(input.pinOne);
            if (!label) keyObj.label = keybind;
        } else if (isJoyBtn) {
            seenPins.add(input.pinOne);
            if (!label) keyObj.label = String(input.keyValues[0]);
        } else if (mouseClick) {
            delete keyMap[keyObj.keybind];
            keyObj.keybind = mouseClick.keybind;
            keyMap[mouseClick.keybind] = keyId;
            seenPins.add(input.pinOne);
            if (!label) keyObj.label = mouseClick.label;
        }
        renderKeyText(keyObj);
        count++;
    }

    // Clear any overlay element whose pin appears in this profile but was left unassigned
    // (e.g. a 5-way center button set to type 11 with no keybind). Without this, old
    // keybinds from a previous profile or manual entry would silently persist.
    const profilePins = new Set(profile.inputs.map(inp => inp.pinOne));
    for (const pin of profilePins) {
        if (seenPins.has(pin)) continue;
        const keyId = pinToKeyId[pin];
        if (!keyId) continue;
        const keyObj = keys.find(k => k.id === keyId);
        if (!keyObj || (!keyObj.label && !keyObj.keybind)) continue;
        delete keyMap[keyObj.keybind];
        keyObj.keybind = "";
        keyObj.label = "";
        renderKeyText(keyObj);
    }

    saveKeybinds();
    return count;
}

let importedProfiles  = (() => {
    try { return JSON.parse(localStorage.getItem("importedProfiles") || "[]"); } catch { return []; }
})();
let selectedProfileIdx = 0;
let importStatusTimer  = null;

function showImportStatus(msg) {
    importStatus.textContent = msg;
    importStatus.style.display = "";
    clearTimeout(importStatusTimer);
    importStatusTimer = setTimeout(() => { importStatus.style.display = "none"; }, 4000);
}

function renderProfileSelect() {
    if (!importedProfiles.length) { profileSelectRow.style.display = "none"; return; }
    if (selectedProfileIdx >= importedProfiles.length) {
        selectedProfileIdx = importedProfiles.length - 1;
    }

    profileDropdownList.innerHTML = "";
    importedProfiles.forEach((p, i) => {
        const item = document.createElement("div");
        item.className = "profile-dropdown-item" + (i === selectedProfileIdx ? " selected" : "");

        const nameEl = document.createElement("span");
        nameEl.className = "profile-dropdown-item-name";
        nameEl.textContent = p.name || `Profile ${i + 1}`;
        item.addEventListener("click", () => {
            selectedProfileIdx = i;
            profileDropdownList.style.display = "none";
            renderProfileSelect();
        });

        const removeBtn = document.createElement("button");
        removeBtn.className = "profile-item-remove";
        removeBtn.textContent = "✕";
        removeBtn.title = "Remove";
        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const removedName = importedProfiles[i].name;
            importedProfiles.splice(i, 1);
            localStorage.setItem("importedProfiles", JSON.stringify(importedProfiles));
            renderProfileSelect();
            profileDropdownList.style.display = "";
            showImportStatus(`Removed "${removedName}".`);
        });

        item.appendChild(nameEl);
        item.appendChild(removeBtn);
        profileDropdownList.appendChild(item);
    });

    const sel = importedProfiles[selectedProfileIdx];
    profileDropdownTrigger.textContent = (sel?.name || `Profile ${selectedProfileIdx + 1}`) + " ▾";
    profileSelectRow.style.display = "flex";
}

renderProfileSelect();

importProfileBtn.addEventListener("click", () => importFileInput.click());

importFileInput.addEventListener("change", () => {
    const file = importFileInput.files[0];
    if (!file) return;
    importFileInput.value = "";
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            importedProfiles = json.profiles || [];
            if (!importedProfiles.length) { showImportStatus("No profiles found in file."); return; }
            localStorage.setItem("importedProfiles", JSON.stringify(importedProfiles));
            selectedProfileIdx = 0;
            renderProfileSelect();
            if (importedProfiles.length === 1) {
                const n = applyAzeronProfile(importedProfiles[0]);
                if (n !== null) showImportStatus(`Imported "${importedProfiles[0].name}": ${n} keys updated.`);
            }
        } catch {
            showImportStatus("Failed to parse profile file.");
        }
    };
    reader.readAsText(file);
});

profileDropdownTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = profileDropdownList.style.display !== "none";
    profileDropdownList.style.display = isOpen ? "none" : "";
});

profileApplyBtn.addEventListener("click", () => {
    const profile = importedProfiles[selectedProfileIdx];
    if (!profile) return;
    const n = applyAzeronProfile(profile);
    if (n !== null) showImportStatus(`Applied "${profile.name}": ${n} keys updated.`);
});



/* -----------------------------
   MANUAL PROFILES
   Named, hand-built snapshots of the current device's keybinds — saved as JSON
   files on disk (via main.js IPC) rather than an Azeron export, so hardware
   that the import feature doesn't support yet can still get named, switchable
   profiles. Scoped per-device: each device's profile list only shows profiles
   saved while that device was active.
----------------------------- */

let manualProfiles          = [];
let selectedManualProfileIdx = 0;
let manualProfileStatusTimer = null;

function showManualProfileStatus(msg) {
    manualProfileStatus.textContent = msg;
    manualProfileStatus.style.display = "";
    clearTimeout(manualProfileStatusTimer);
    manualProfileStatusTimer = setTimeout(() => { manualProfileStatus.style.display = "none"; }, 4000);
}

function applyManualProfile(profile) {
    let n = 0;
    keys.forEach(keyObj => {
        const saved   = profile.keys?.[keyObj.id];
        const label   = saved?.label   || "";
        const keybind = saved?.keybind || "";
        if (keyObj.keybind) delete keyMap[keyObj.keybind];
        keyObj.label   = label;
        keyObj.keybind = keybind;
        if (keybind) { keyMap[keybind] = keyObj.id; n++; }
        renderKeyText(keyObj);
    });
    saveKeybinds();
    return n;
}

function renderManualProfileSelect() {
    if (!manualProfiles.length) { manualProfileSelectRow.style.display = "none"; return; }
    if (selectedManualProfileIdx >= manualProfiles.length) {
        selectedManualProfileIdx = manualProfiles.length - 1;
    }

    manualProfileDropdownList.innerHTML = "";
    manualProfiles.forEach((p, i) => {
        const item = document.createElement("div");
        item.className = "profile-dropdown-item" + (i === selectedManualProfileIdx ? " selected" : "");

        const nameEl = document.createElement("span");
        nameEl.className = "profile-dropdown-item-name";
        nameEl.textContent = p.name;
        item.addEventListener("click", () => {
            selectedManualProfileIdx = i;
            manualProfileDropdownList.style.display = "none";
            renderManualProfileSelect();
        });

        const removeBtn = document.createElement("button");
        removeBtn.className = "profile-item-remove";
        removeBtn.textContent = "✕";
        removeBtn.title = "Delete";
        removeBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const removedName = manualProfiles[i].name;
            await ipcRenderer.invoke("delete-manual-profile", activeDeviceId, removedName);
            await loadManualProfiles();
            manualProfileDropdownList.style.display = "";
            showManualProfileStatus(`Deleted "${removedName}".`);
        });

        item.appendChild(nameEl);
        item.appendChild(removeBtn);
        manualProfileDropdownList.appendChild(item);
    });

    const sel = manualProfiles[selectedManualProfileIdx];
    manualProfileDropdownTrigger.textContent = (sel?.name || `Profile ${selectedManualProfileIdx + 1}`) + " ▾";
    manualProfileSelectRow.style.display = "flex";
}

async function loadManualProfiles() {
    manualProfiles = await ipcRenderer.invoke("list-manual-profiles", activeDeviceId);
    selectedManualProfileIdx = 0;
    renderManualProfileSelect();
}

manualProfileSaveBtn.addEventListener("click", async () => {
    const name = manualProfileNameInput.value.trim();
    if (!name) { showManualProfileStatus("Enter a profile name."); return; }

    const data = {};
    keys.forEach(k => { data[k.id] = { label: k.label, keybind: k.keybind }; });

    const result = await ipcRenderer.invoke("save-manual-profile", activeDeviceId, { name, keys: data });
    if (!result?.ok) { showManualProfileStatus(result?.error || "Failed to save profile."); return; }

    manualProfileNameInput.value = "";
    await loadManualProfiles();
    selectedManualProfileIdx = manualProfiles.findIndex(p => p.name === name);
    if (selectedManualProfileIdx < 0) selectedManualProfileIdx = 0;
    renderManualProfileSelect();
    showManualProfileStatus(`Saved "${name}".`);
});

manualProfileDropdownTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = manualProfileDropdownList.style.display !== "none";
    manualProfileDropdownList.style.display = isOpen ? "none" : "";
});

manualProfileApplyBtn.addEventListener("click", () => {
    const profile = manualProfiles[selectedManualProfileIdx];
    if (!profile) return;
    const n = applyManualProfile(profile);
    showManualProfileStatus(`Applied "${profile.name}": ${n} keys updated.`);
});

function updateProfileModeView() {
    const manual = localStorage.getItem("profileMode") === "manual";
    profileModeToggle.checked      = manual;
    profileModeLabel.textContent   = manual ? "Manual" : "Import";
    profileImportView.style.display = manual ? "none" : "flex";
    profileManualView.style.display = manual ? "flex" : "none";
}

profileModeToggle.addEventListener("change", () => {
    localStorage.setItem("profileMode", profileModeToggle.checked ? "manual" : "import");
    updateProfileModeView();
});

updateProfileModeView();



// F8/F9 come from globalShortcut in main.js so they fire even when a game has focus
ipcRenderer.on("global-key", (_event, key) => {
    const editingPopup = document.activeElement === popupLabelInput ||
                         document.activeElement === popupKeybindInput;
    if (key === "F8" && !editingPopup) setClickthrough(!isClickthrough);
    if (key === "F9") resetPosition();
});



/* -----------------------------
   DEVICE SWITCHING
----------------------------- */

function saveKeybinds() {
    const data = {};
    keys.forEach(k => {
        data[k.id] = { label: k.label, keybind: k.keybind };
        const el = document.getElementById(k.id);
        if (el && !el.classList.contains("scroll-indicator")) {
            el.classList.toggle("empty", !k.label && !k.keybind);
        }
    });
    localStorage.setItem("keybinds_" + activeDeviceId, JSON.stringify(data));
}

function switchDevice(deviceId) {
    if (!DEVICE_CONFIGS[deviceId]) return;

    closeKeyPopup();

    activeDeviceId = deviceId;
    localStorage.setItem("activeDevice", deviceId);
    _calibrationOrder = null; // reset so getCalibrationOrder() rebuilds for new device

    const config = DEVICE_CONFIGS[deviceId];

    // Migrate legacy Cyborg II keybinds on first switch
    if (deviceId === "cyborg2" && !localStorage.getItem("keybinds_cyborg2") && localStorage.getItem("keybinds")) {
        localStorage.setItem("keybinds_cyborg2", localStorage.getItem("keybinds"));
    }

    const saved = JSON.parse(localStorage.getItem("keybinds_" + deviceId) || "{}");
    keys = config.baseKeys.map(k => ({ ...k, ...(saved[k.id] || {}) }));

    // Rebuild key DOM elements
    overlayContent.querySelectorAll(".key").forEach(el => el.remove());
    Object.keys(keyMap).forEach(k => delete keyMap[k]);

    keys.forEach(keyData => {
        const el = document.createElement("div");
        el.classList.add("key");
        el.id        = keyData.id;
        el.style.top  = keyData.top  + "px";
        el.style.left = keyData.left + "px";
        overlayContent.appendChild(el);

        if (keyData.type === "scroll") {
            el.classList.add("scroll-indicator");
            el.innerHTML = '<span class="scroll-arrow">↑</span><span class="scroll-divider"></span><span class="scroll-arrow">↓</span>';
        } else {
            el.innerText = getKeyDisplayText(keyData);
            if (keyData.keybind) keyMap[keyData.keybind] = keyData.id;
            el.classList.toggle("empty", !keyData.label && !keyData.keybind);
            el.addEventListener("click", (e) => {
                if (optionsPanel.style.display !== "flex" || isClickthrough) return;
                e.stopPropagation();
                showKeyPopup(keyData);
            });
        }
    });

    // Reposition joystick
    joystickContainer.style.left = config.joystick.left + "px";
    joystickContainer.style.top  = config.joystick.top  + "px";

    // Update popup flip boundary
    CONTENT_W = config.contentWidth;

    // Sync dropdown
    if (deviceSelect) deviceSelect.value = deviceId;

    // Apply saved or community calibration for the new device
    applyDefaultCalibrationIfNeeded();
    updateCalibrationStatus();

    // Manual profiles are scoped per-device — refresh the list for the new device
    manualProfileNameInput.value = "";
    loadManualProfiles();
}

deviceSelect.addEventListener("change", () => {
    switchDevice(deviceSelect.value);
});



/* -----------------------------
   KEY POPUP
----------------------------- */

function normalizeKey(jsKey) {
    const aliases = {
        " ": "space", "Escape": "esc", "Enter": "enter",
        "Backspace": "backspace", "Tab": "tab", "Delete": "delete",
        "ArrowUp": "up", "ArrowDown": "down", "ArrowLeft": "left", "ArrowRight": "right",
    };
    return aliases[jsKey] || jsKey.toLowerCase();
}

function physicalKey(code) {
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Key'))   return code.slice(3).toLowerCase();
    return null;
}

function closeKeyPopup() {
    keyPopup.style.display = "none";
    currentEditingKey = null;
}

function commitLabel() {
    if (!currentEditingKey) return;
    currentEditingKey.label = popupLabelInput.value;
    renderKeyText(currentEditingKey);
    saveKeybinds();
}

function commitKeybind() {
    if (!currentEditingKey) return;
    const newBind = popupKeybindInput.value.trim();
    if (!newBind || newBind.endsWith("+") || newBind === currentEditingKey.keybind) return;
    delete keyMap[currentEditingKey.keybind];
    currentEditingKey.keybind = newBind;
    keyMap[newBind] = currentEditingKey.id;
    renderKeyText(currentEditingKey);
    saveKeybinds();
}

function showKeyPopup(keyData) {
    currentEditingKey         = keyData;
    keyPopupTitle.textContent = (keyData.label || keyData.id).replace(/\n/g, ' ');
    popupLabelInput.value     = keyData.label;
    popupKeybindInput.value   = keyData.keybind;
    popupKeybindInput.classList.remove("capturing");
    popupMouseSelect.value    = /^mouse[1-5]$/.test(keyData.keybind) ? keyData.keybind : "";

    const scaledTop  = keyData.top  * overlayScale;
    const scaledLeft = keyData.left * overlayScale;
    const scaledKeyW = KEY_W        * overlayScale;

    let popupLeft = scaledLeft + scaledKeyW + 8;
    if (popupLeft + POPUP_WIDTH > CONTENT_W * overlayScale) popupLeft = scaledLeft - POPUP_WIDTH - 8;

    keyPopup.style.top     = Math.max(0, scaledTop)  + "px";
    keyPopup.style.left    = Math.max(0, popupLeft)  + "px";
    keyPopup.style.display = "block";
    popupLabelInput.focus();
    popupLabelInput.select();
}

keyPopupClose.addEventListener("click", (e) => {
    e.stopPropagation();
    commitLabel();
    commitKeybind();
    closeKeyPopup();
});

popupLabelInput.addEventListener("blur",    commitLabel);
popupLabelInput.addEventListener("keydown", (e) => {
    if (e.key === "Tab")    { e.preventDefault(); popupKeybindInput.focus(); }
    if (e.key === "Escape") { e.preventDefault(); closeKeyPopup(); }
});

popupKeybindInput.addEventListener("focus", () => {
    popupKeybindInput.classList.add("capturing");
    popupKeybindInput.value = "";
});

popupKeybindInput.addEventListener("keydown", (e) => {
    e.preventDefault();
    const key = normalizeKey(e.key);
    if (key === "escape") { closeKeyPopup(); return; }
    const parts = [];
    if (e.ctrlKey)  parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey)   parts.push("alt");
    if (["control", "shift", "alt"].includes(key)) {
        popupKeybindInput.value = parts.join("+") + "+";
        return;
    }
    const finalKey = parts.length > 0 ? (physicalKey(e.code) || key) : key;
    parts.push(finalKey);
    popupKeybindInput.value = parts.join("+");
});

popupKeybindInput.addEventListener("keyup", (e) => {
    if (!popupKeybindInput.value.endsWith("+")) return;
    const key = normalizeKey(e.key);
    if (!["control", "shift", "alt"].includes(key)) return;
    const parts = [];
    if (e.ctrlKey)  parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey)   parts.push("alt");
    if (parts.length > 0) {
        popupKeybindInput.value = parts.join("+") + "+";
    } else {
        // No modifiers left held and no other key was pressed — commit the modifier(s)
        // alone as the full keybind (e.g. "shift") instead of clearing the field.
        popupKeybindInput.value = popupKeybindInput.value.slice(0, -1);
    }
});

popupKeybindInput.addEventListener("blur", () => {
    popupKeybindInput.classList.remove("capturing");
    commitKeybind();
});

popupMouseSelect.addEventListener("change", () => {
    if (!currentEditingKey || !popupMouseSelect.value) return;
    const newBind = popupMouseSelect.value;
    delete keyMap[currentEditingKey.keybind];
    currentEditingKey.keybind = newBind;
    keyMap[newBind] = currentEditingKey.id;
    popupKeybindInput.value = newBind;
    renderKeyText(currentEditingKey);
    saveKeybinds();
});

document.addEventListener("click", (e) => {
    if (keyPopup.style.display !== "block") return;
    if (!keyPopup.contains(e.target) && !e.target.classList.contains("key")) closeKeyPopup();
});

document.addEventListener("click", (e) => {
    if (!profileDropdownList.contains(e.target) && e.target !== profileDropdownTrigger) {
        profileDropdownList.style.display = "none";
    }
    if (!manualProfileDropdownList.contains(e.target) && e.target !== manualProfileDropdownTrigger) {
        manualProfileDropdownList.style.display = "none";
    }
});



/* -----------------------------
   INITIALIZE
----------------------------- */

(async () => {
    displays = await ipcRenderer.invoke("get-displays");

    const savedId      = parseInt(localStorage.getItem("displayId") || "0");
    const targetDisplay = displays.find(d => d.id === savedId)
                       || displays.find(d => d.isPrimary)
                       || displays[0];

    const bounds = await ipcRenderer.invoke("move-to-display", targetDisplay.id);
    currentDisplayId     = targetDisplay.id;
    currentDisplayBounds = bounds
        ? { x: 0, y: 0, width: bounds.width, height: bounds.height }
        : { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };

    updateMonitorBtn();

    let startX = parseInt(localStorage.getItem("overlayX")) || 100;
    let startY = parseInt(localStorage.getItem("overlayY")) || 100;

    const optX = startX + 44;
    const optY = startY + 44;
    if (optX < 0 || optY < 0 || optX > currentDisplayBounds.width || optY > currentDisplayBounds.height) {
        startX = 100;
        startY = 100;
        localStorage.setItem("overlayX", "100px");
        localStorage.setItem("overlayY", "100px");
    }

    overlay.style.left = startX + "px";
    overlay.style.top  = startY + "px";

    // Load active device (creates key DOM elements and positions joystick)
    switchDevice(activeDeviceId);

    // First-run: no saved calibration and no keybinds — open options panel automatically
    const hasKeybinds = !!localStorage.getItem("keybinds_" + activeDeviceId);
    const hasCal      = !!localStorage.getItem("calibration_" + activeDeviceId);
    if (!hasKeybinds && !hasCal) {
        optionsPanel.style.display = "flex";
        markOptionsPanelOpened();
        overlayContent.classList.add("edit-mode");
        ipcRenderer.send("set-clickthrough", false);
        positionOptionsPanel();
    }

    updateCalibrateHint();
    connectWebSocket();
    applyAccentColor(accentColor);
    applyKeyBgColor(keyBgColor);
    updateOverlayScale();
    updateOverlayOpacity();
})();
