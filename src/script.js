const { ipcRenderer } = require('electron');

// Device layout files
const KEYS_CYBORG2       = require('./layouts/keys.cjs');
const KEYS_CYBORG2_LEFTY = require('./layouts/keys_lefty.cjs');
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
const importProfileBtn    = document.getElementById("import-profile-btn");
const importFileInput     = document.getElementById("import-file-input");
const profileSelectRow    = document.getElementById("profile-select-row");
const profileSelect       = document.getElementById("profile-select");
const profileApplyBtn     = document.getElementById("profile-apply-btn");
const importStatus        = document.getElementById("import-status");
const deviceSelect        = document.getElementById("device-select");
const keyPopup            = document.getElementById("key-popup");
const keyPopupTitle       = document.getElementById("key-popup-title");
const keyPopupClose       = document.getElementById("key-popup-close");
const popupLabelInput     = document.getElementById("popup-label-input");
const popupKeybindInput   = document.getElementById("popup-keybind-input");
const calibrateBtn           = document.getElementById("calibrate-btn");
const calibrationWizard      = document.getElementById("calibration-wizard");
const calibrationStepsView   = document.getElementById("calibration-steps-view");
const calibrationSectionLabel= document.getElementById("calibration-section-label");
const calibrationPrompt      = document.getElementById("calibration-prompt");
const calibrationProgress    = document.getElementById("calibration-progress");
const calibrationSkipBtn     = document.getElementById("calibration-skip-btn");
const calibrationCancelBtn   = document.getElementById("calibration-cancel-btn");
const calibrationBreakView   = document.getElementById("calibration-break-view");
const calibrationBreakMsg    = document.getElementById("calibration-break-msg");
const calibrationBreakNext   = document.getElementById("calibration-break-next");
const calibrationContinueBtn = document.getElementById("calibration-continue-btn");
const calibrationCancelBreakBtn = document.getElementById("calibration-cancel-break-btn");
const calibrationStatus      = document.getElementById("calibration-status");

// Device configurations
const PIN_TO_KEY_ID_CYBORG2 = {
     1: "mage-food-mana-drink",   2: "hammer-of-wrath",     3: "holy-shock",
     4: "crusaders-strike",       5: "map-dungeon-finder",  6: "light-of-dawn",
     7: "combat-ress",            8: "blessing-of-seasons", 9: "flash-of-light",
    10: "judgement",             11: "row1-btn2",           13: "lay-on-hands",
    14: "kick",                  15: "holy-light",          16: "consecrate",
    17: "row1-btn3",             19: "mount-journal",       20: "appearances-log",
    22: "jump",                  23: "racial-ability",      24: "word-of-glory",
    25: "focus-target-macro",    26: "row1-btn4",           27: "extra-actionbutton",
    32: "movement-ability",      33: "utility-ring",        34: "bags-character",
    35: "spellbook-talents",     36: "dungeon-portals",     37: "social-esc",
};

// Cyborg II firmware v1.5.x uses 0-based pin numbering — physically different from v1 map.
// Derived from Benji_Profile.json cross-referenced with Azeron Software 1.5.6 screenshot.
const PIN_TO_KEY_ID_CYBORG2_V2 = {
    // Row 1 — top row main cluster (left → right)
    22: "map-dungeon-finder",   39: "row1-btn2",    3: "row1-btn3",    9: "row1-btn4",
    // Row 1 — extended right module (C, empty slot, O)
    14: "spellbook-talents",   17: "social-esc",   12: "utility-ring",
    // Row 2 — main cluster
    23: "crusaders-strike",    38: "judgement",     2: "consecrate",    8: "focus-target-macro",
    // Row 2 — right module (B)
    13: "dungeon-portals",
    // Row 3 — main cluster (ESC + 5 buttons)
    21: "light-of-dawn",       24: "holy-shock",   18: "flash-of-light",
     1: "holy-light",           7: "word-of-glory", 10: "extra-actionbutton",
    // Row 3 — far right (Tab; pinOne=255 in v1.5.x for software-layer keys)
   255: "appearances-log",
    // Row 4 — main cluster
    25: "hammer-of-wrath",     19: "blessing-of-seasons",  0: "kick",   5: "racial-ability",
    // Row 4 — far right (Ctrl+Shift+F1; pins 28 and 43 are the same physical button)
    28: "mount-journal",       43: "mount-journal",
    // Row 5 — main cluster
    26: "mage-food-mana-drink", 20: "combat-ress", 27: "lay-on-hands",  4: "jump",
    // Row 5 — right (joystick button)
    40: "movement-ability",
    // Row 0 — single top button
    11: "bags-character",
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
        ids: ["map-dungeon-finder","row1-btn2","row1-btn3","row1-btn4",
              "crusaders-strike","judgement","consecrate","focus-target-macro",
              "light-of-dawn","holy-shock","flash-of-light","holy-light","word-of-glory","extra-actionbutton",
              "hammer-of-wrath","blessing-of-seasons","kick","racial-ability",
              "mage-food-mana-drink","combat-ress","lay-on-hands","jump"],
    },
    {
        label: "5-Way Cluster",
        transition: "Now press the two side buttons next to the joystick",
        ids: ["bags-character","spellbook-talents","social-esc","utility-ring","dungeon-portals"],
    },
    {
        label: "Side Buttons",
        transition: "Finally, press the joystick click",
        ids: ["appearances-log","mount-journal"],
    },
    {
        label: "Joystick Click",
        transition: null,
        ids: ["movement-ability"],
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
              "cy-r4c3","cy-r4c4","cy-r4c5","cy-r4c6","cy-r4c7",
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
              "cy-lh-r4c3","cy-lh-r4c4","cy-lh-r4c5","cy-lh-r4c6","cy-lh-r4c7",
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
    },
    'cyborg2-lefty': {
        name: 'RH Cyborg II',
        baseKeys: KEYS_CYBORG2_LEFTY,
        pinToKeyId: PIN_TO_KEY_ID_CYBORG2,
        joystick: { left: 111, top: 286 },
        contentWidth: 665,
        autoDetectDevice: null,
        calibrationSections: CYBORG2_SECTIONS,
    },
    'keyzen': {
        name: 'LH Keyzen',
        baseKeys: KEYS_KEYZEN,
        pinToKeyId: PIN_TO_KEY_ID_KEYZEN,
        joystick: { left: 430, top: 261 },
        contentWidth: 631,
        autoDetectDevice: [8, 9],
        calibrationSections: KEYZEN_SECTIONS,
    },
    'cyro': {
        name: 'RH Cyro',
        baseKeys: KEYS_CYRO,
        pinToKeyId: PIN_TO_KEY_ID_CYRO,
        joystick: { left: 84, top: 291 },
        contentWidth: 581,
        autoDetectDevice: 4,
        calibrationSections: CYRO_SECTIONS,
    },
    'cyro-lh': {
        name: 'LH Cyro',
        baseKeys: KEYS_CYRO_LH,
        pinToKeyId: PIN_TO_KEY_ID_CYRO_LH,
        joystick: { left: 377, top: 291 },
        contentWidth: 497,
        autoDetectDevice: null,
        calibrationSections: CYRO_LH_SECTIONS,
    },
    'keyzen-rh': {
        name: 'RH Keyzen',
        baseKeys: KEYS_KEYZEN_RH,
        pinToKeyId: PIN_TO_KEY_ID_KEYZEN_RH,
        joystick: { left: 161, top: 271 },
        contentWidth: 697,
        autoDetectDevice: null,
        calibrationSections: KEYZEN_RH_SECTIONS,
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



/* -----------------------------
   WEBSOCKET
----------------------------- */

let socket;

function connectWebSocket() {
    socket = new WebSocket("ws://localhost:8765");

    socket.onopen  = () => console.log("WebSocket connected");
    socket.onerror = () => {};

    socket.onclose = () => {
        console.log("WebSocket closed, retrying in 1s...");
        Object.keys(movementState).forEach(k => movementState[k] = false);
        updateJoystick();
        document.querySelectorAll(".key.active").forEach(el => el.classList.remove("active"));
        setTimeout(connectWebSocket, 1000);
    };

    socket.onmessage = (event) => {
        const active = document.activeElement;
        if (active === popupLabelInput || active === popupKeybindInput) return;

        const msg = JSON.parse(event.data);

        if (msg.type === "device_info") {
            handleDeviceInfo(msg.pid);
            return;
        }

        const { key, action } = msg;

        if (calibrationActive && action === "down") {
            calibrationRecordKey(key);
            return;
        }

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
            _calibrationOrder = (cfg?.keys || keys).map(k => k.id);
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
let devicePid         = null;

function handleDeviceInfo(pid) {
    devicePid = pid;
    if (!pid) return;
    if (SUPPORTED_PIDS[pid]) {
        calibrationStatus.textContent = `Hardware supported natively (${SUPPORTED_PIDS[pid]})`;
        calibrationStatus.style.display = "block";
        calibrateBtn.textContent = "Recalibrate Buttons…";
    } else {
        const saved = loadCalibration();
        if (saved) {
            calibrationStatus.textContent = "Calibrated — highlights active";
            calibrationStatus.style.color = "#aaa";
            calibrationStatus.style.display = "block";
            calibrateBtn.textContent = "Recalibrate Buttons…";
        } else if (DEFAULT_CALIBRATION_MAPS[activeDeviceId]) {
            calibrationStatus.textContent = "Community calibration active — recalibrate to customise";
            calibrationStatus.style.color = "#6ab0f5";
            calibrationStatus.style.display = "block";
            calibrateBtn.textContent = "Recalibrate Buttons…";
        } else {
            calibrationStatus.textContent = "Unknown hardware — calibration recommended";
            calibrationStatus.style.color = "#f0a500";
            calibrationStatus.style.display = "block";
        }
    }
}

function loadCalibration() {
    try {
        const raw = localStorage.getItem("calibration_" + activeDeviceId);
        return raw ? JSON.parse(raw) : null;
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
    if (calibrationComboTimer) { clearTimeout(calibrationComboTimer); calibrationComboTimer = null; }
    calibrationStep   = 0;
    calibrationMap    = {};
    calibrationWizard.classList.add("active");
    overlayContent.classList.remove("edit-mode");
    positionCalibrationPanel();
    // Ensure the wizard buttons are always clickable regardless of clickthrough state
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
}

function resumeFromSectionBreak() {
    calibrationBreakView.style.display = "none";
    calibrationStepsView.style.display = "";
    showCalibrationStep();
}

function advanceCalibrationStep() {
    const boundary = isSectionBoundary(calibrationStep);
    if (boundary) {
        showSectionBreak(boundary);
    } else if (calibrationStep >= getCalibrationOrder().length) {
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
    startCalibrationTimer();
}

let calibrationComboKeys  = [];
let calibrationComboTimer = null;

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
    advanceCalibrationStep();
}

function calibrationRecordKey(key) {
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
                pid:             devicePid || null,
                calibration_map: JSON.stringify(map),
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
    calibrationWizard.classList.remove("active");
    document.querySelectorAll(".key.calibrating").forEach(k => k.classList.remove("calibrating"));
    saveCalibration(calibrationMap);
    applyCalibration(calibrationMap);
    submitCalibrationData(calibrationMap);
    calibrationStatus.textContent = "Calibrated — highlights active";
    calibrationStatus.style.color = "#aaa";
    calibrationStatus.style.display = "block";
    calibrateBtn.textContent = "Recalibrate Buttons…";
    if (isClickthrough) ipcRenderer.send("set-clickthrough", true);
}

function cancelCalibration() {
    clearCalibrationTimer();
    if (calibrationComboTimer) { clearTimeout(calibrationComboTimer); calibrationComboTimer = null; }
    calibrationComboKeys = [];
    calibrationActive    = false;
    calibrationWizard.classList.remove("active");
    calibrationBreakView.style.display = "none";
    calibrationStepsView.style.display = "";
    document.querySelectorAll(".key.calibrating").forEach(k => k.classList.remove("calibrating"));
    if (isClickthrough) ipcRenderer.send("set-clickthrough", true);
}

calibrateBtn.addEventListener("click", () => {
    optionsPanel.style.display = "none";
    overlayContent.classList.remove("edit-mode");
    startCalibration();
});

calibrationSkipBtn.addEventListener("click", () => {
    clearCalibrationTimer();
    calibrationMap[getCalibrationOrder()[calibrationStep]] = null;
    calibrationStep++;
    advanceCalibrationStep();
});

calibrationCancelBtn.addEventListener("click", cancelCalibration);
calibrationContinueBtn.addEventListener("click", resumeFromSectionBreak);
calibrationCancelBreakBtn.addEventListener("click", cancelCalibration);

// Community-sourced default calibration maps, keyed by device_id.
// Paste calibration_map JSON from Supabase submissions here as they come in.
const DEFAULT_CALIBRATION_MAPS = {
    // "cyborg2": { "map-dungeon-finder": "m", ... },
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

optionsButton.addEventListener("click", () => {
    const opening = optionsPanel.style.display !== "flex";
    if (opening) {
        const spaceAbove   = optionsButton.getBoundingClientRect().top;
        if (spaceAbove < 500) {
            // Not enough room above — open downward, anchored below the key grid
            let gridBottom = 0;
            overlayContent.querySelectorAll(".key").forEach(k => {
                const b = k.getBoundingClientRect().bottom;
                if (b > gridBottom) gridBottom = b;
            });
            const uiTop        = optionsPanel.parentElement.getBoundingClientRect().top;
            const topOffset    = gridBottom - uiTop + 8;
            const availableH   = window.innerHeight - uiTop - topOffset - 8;
            optionsPanel.style.top       = topOffset + "px";
            optionsPanel.style.bottom    = "auto";
            optionsPanel.style.maxHeight = Math.max(200, availableH) + "px";
        } else {
            optionsPanel.style.top       = "auto";
            optionsPanel.style.bottom    = "46px";
            optionsPanel.style.maxHeight = "";
        }
    }
    optionsPanel.style.display = opening ? "flex" : "none";
    overlayContent.classList.toggle("edit-mode", opening);
    if (!opening) closeKeyPopup();
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
    unlockBtn.textContent = isUnlocked ? "Lock Position" : "Unlock Position";
    unlockBtn.classList.toggle("active", isUnlocked);
    overlay.style.cursor = isUnlocked ? "grab" : "";
});



/* -----------------------------
   CLICKTHROUGH
----------------------------- */

function setClickthrough(value) {
    isClickthrough = value;
    ipcRenderer.send("set-clickthrough", value);
    clickthroughBtn.textContent = value ? "Disable Clickthrough" : "Enable Clickthrough";
    clickthroughBtn.classList.toggle("active", value);
    if (value) {
        optionsPanel.style.display = "none";
        overlayContent.classList.remove("edit-mode");
        closeKeyPopup();
    }
}

optionsUi.addEventListener("mouseenter", () => { if (isClickthrough) ipcRenderer.send("set-clickthrough", false); });
optionsUi.addEventListener("mouseleave", () => { if (isClickthrough) ipcRenderer.send("set-clickthrough", true);  });

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
    monitorBtn.textContent = `Monitor: ${idx + 1} / ${displays.length}  (${d.bounds.width}×${d.bounds.height})`;
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
    // Auto-detect device from v2 export metaData.
    // If the active device already claims this device number, keep it — multiple devices
    // (e.g., Keyzen and Cyborg II) can share the same exported device number.
    const deviceNum = profile.metaData?.device;
    if (deviceNum !== undefined) {
        const deviceMatches = (ad) => Array.isArray(ad) ? ad.includes(deviceNum) : ad === deviceNum;
        const currentCfg = DEVICE_CONFIGS[activeDeviceId];
        if (!deviceMatches(currentCfg?.autoDetectDevice)) {
            const match = Object.entries(DEVICE_CONFIGS).find(([, cfg]) => deviceMatches(cfg.autoDetectDevice));
            if (match) switchDevice(match[0]);
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
        if (!label && !isKbd && !isModOnly && !isJoyBtn) continue;

        if (label) {
            seenPins.add(input.pinOne);
            keyObj.label = label;
            const el = document.getElementById(keyId);
            if (el) el.innerText = label;
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
                if (!label) {
                    keyObj.label = keybind;
                    const el = document.getElementById(keyId);
                    if (el) el.innerText = keybind;
                }
            }
        } else if (isModOnly) {
            const keybind = resolveModifier(input.metaValues[0]);
            delete keyMap[keyObj.keybind];
            keyObj.keybind = keybind;
            keyMap[keybind] = keyId;
            seenPins.add(input.pinOne);
            if (!label) {
                keyObj.label = keybind;
                const el = document.getElementById(keyId);
                if (el) el.innerText = keybind;
            }
        } else if (isJoyBtn) {
            seenPins.add(input.pinOne);
            if (!label) {
                keyObj.label = String(input.keyValues[0]);
                const el = document.getElementById(keyId);
                if (el) el.innerText = String(input.keyValues[0]);
            }
        }
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
        const el = document.getElementById(keyId);
        if (el) el.innerText = "";
    }

    saveKeybinds();
    return count;
}

let importedProfiles  = (() => {
    try { return JSON.parse(localStorage.getItem("importedProfiles") || "[]"); } catch { return []; }
})();
let importStatusTimer = null;

function showImportStatus(msg) {
    importStatus.textContent = msg;
    importStatus.style.display = "";
    clearTimeout(importStatusTimer);
    importStatusTimer = setTimeout(() => { importStatus.style.display = "none"; }, 4000);
}

function renderProfileSelect() {
    if (!importedProfiles.length) { profileSelectRow.style.display = "none"; return; }
    profileSelect.innerHTML = "";
    importedProfiles.forEach((p, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = p.name || `Profile ${i + 1}`;
        profileSelect.appendChild(opt);
    });
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
            renderProfileSelect();
            if (importedProfiles.length === 1) {
                const n = applyAzeronProfile(importedProfiles[0]);
                showImportStatus(`Imported "${importedProfiles[0].name}": ${n} keys updated.`);
            }
        } catch {
            showImportStatus("Failed to parse profile file.");
        }
    };
    reader.readAsText(file);
});

profileApplyBtn.addEventListener("click", () => {
    const profile = importedProfiles[parseInt(profileSelect.value)];
    if (!profile) return;
    const n = applyAzeronProfile(profile);
    showImportStatus(`Imported "${profile.name}": ${n} keys updated.`);
});



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
            el.innerText = keyData.label;
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
    const el = document.getElementById(currentEditingKey.id);
    if (el) el.innerText = currentEditingKey.label;
    saveKeybinds();
}

function commitKeybind() {
    if (!currentEditingKey) return;
    const newBind = popupKeybindInput.value.trim();
    if (!newBind || newBind.endsWith("+") || newBind === currentEditingKey.keybind) return;
    delete keyMap[currentEditingKey.keybind];
    currentEditingKey.keybind = newBind;
    keyMap[newBind] = currentEditingKey.id;
    saveKeybinds();
}

function showKeyPopup(keyData) {
    currentEditingKey         = keyData;
    keyPopupTitle.textContent = (keyData.label || keyData.id).replace(/\n/g, ' ');
    popupLabelInput.value     = keyData.label;
    popupKeybindInput.value   = keyData.keybind;
    popupKeybindInput.classList.remove("capturing");

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
    popupKeybindInput.value = parts.length > 0 ? parts.join("+") + "+" : "";
});

popupKeybindInput.addEventListener("blur", () => {
    popupKeybindInput.classList.remove("capturing");
    commitKeybind();
});

document.addEventListener("click", (e) => {
    if (keyPopup.style.display !== "block") return;
    if (!keyPopup.contains(e.target) && !e.target.classList.contains("key")) closeKeyPopup();
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

    connectWebSocket();
    applyAccentColor(accentColor);
    applyKeyBgColor(keyBgColor);
    updateOverlayScale();
    updateOverlayOpacity();
})();
