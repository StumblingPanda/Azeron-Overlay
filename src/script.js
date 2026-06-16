const { ipcRenderer } = require('electron');
const DEFAULT_KEYS = require('./keys.cjs');

const JOYSTICK_DISTANCE = 35;
const POPUP_WIDTH       = 200;
const KEY_W             = 65;   // used for popup positioning
const CONTENT_W         = 665;  // used for popup flip detection

// DOM refs
const overlay           = document.getElementById("overlay-visuals");
const overlayContent    = document.getElementById("overlay-content");
const optionsUi         = document.getElementById("options-ui");
const stick             = document.getElementById("joystick-stick");
const optionsButton     = document.getElementById("options-button");
const optionsPanel      = document.getElementById("options-panel");
const scaleSlider       = document.getElementById("scale-slider");
const opacitySlider     = document.getElementById("opacity-slider");
const colorPicker       = document.getElementById("color-picker");
const keyBgPicker       = document.getElementById("key-bg-picker");
const unlockBtn         = document.getElementById("unlock-btn");
const clickthroughBtn   = document.getElementById("clickthrough-btn");
const resetPositionBtn    = document.getElementById("reset-position-btn");
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
const keyPopup            = document.getElementById("key-popup");
const keyPopupTitle     = document.getElementById("key-popup-title");
const keyPopupClose     = document.getElementById("key-popup-close");
const popupLabelInput   = document.getElementById("popup-label-input");
const popupKeybindInput = document.getElementById("popup-keybind-input");

// Runtime state
const movementState = { w: false, a: false, s: false, d: false };
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

// Key data — merge defaults with any user-saved overrides
const savedKeybinds = JSON.parse(localStorage.getItem("keybinds") || "{}");
const keys = DEFAULT_KEYS.map(k => ({ ...k, ...(savedKeybinds[k.id] || {}) }));
const keyMap = {};



/* -----------------------------
   JOYSTICK
----------------------------- */

function updateJoystick() {
    const x = (movementState.d ? JOYSTICK_DISTANCE : 0) - (movementState.a ? JOYSTICK_DISTANCE : 0);
    const y = (movementState.s ? JOYSTICK_DISTANCE : 0) - (movementState.w ? JOYSTICK_DISTANCE : 0);
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

        const { key, action } = JSON.parse(event.data);

        if (key in movementState) movementState[key] = action === "down";
        updateJoystick();

        const el = document.getElementById(keyMap[key]);
        if (!el) return;
        el.classList.toggle("active", action === "down");
    };
}



/* -----------------------------
   OPTIONS PANEL
----------------------------- */

optionsButton.addEventListener("click", () => {
    const opening = optionsPanel.style.display !== "flex";
    if (opening) {
        const spaceAbove = optionsButton.getBoundingClientRect().top;
        if (spaceAbove < 500) {
            optionsPanel.style.bottom = "";
            optionsPanel.style.top    = "46px";
        } else {
            optionsPanel.style.top    = "";
            optionsPanel.style.bottom = "46px";
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
    // Reset position so the overlay is visible on the new display
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

const PIN_TO_KEY_ID = {
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

const VK_TO_KEY = {
     8: "backspace",  9: "tab",    13: "enter",  27: "esc",   32: "space",
    37: "left",      38: "up",    39: "right",  40: "down",  45: "insert", 46: "delete",
    48: "0",  49: "1",  50: "2",  51: "3",  52: "4",  53: "5",  54: "6",  55: "7",  56: "8",  57: "9",
    65: "a",  66: "b",  67: "c",  68: "d",  69: "e",  70: "f",  71: "g",  72: "h",  73: "i",
    74: "j",  75: "k",  76: "l",  77: "m",  78: "n",  79: "o",  80: "p",  81: "q",  82: "r",
    83: "s",  84: "t",  85: "u",  86: "v",  87: "w",  88: "x",  89: "y",  90: "z",
    112: "f1",  113: "f2",  114: "f3",  115: "f4",  116: "f5",  117: "f6",
    118: "f7",  119: "f8",  120: "f9",  121: "f10", 122: "f11", 123: "f12",
    186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`",
    219: "[", 220: "\\", 221: "]", 222: "'",
};

function buildKeybindString(vk, metaValues) {
    const key = VK_TO_KEY[parseInt(vk)];
    if (!key) return "";
    const mods = new Set();
    for (const mv of metaValues) {
        const m = parseInt(mv);
        if      (m === 16 || m === 160 || m === 161) mods.add("shift");
        else if (m === 17 || m === 162 || m === 163) mods.add("ctrl");
        else if (m === 18 || m === 164 || m === 165) mods.add("alt");
    }
    const parts = [];
    if (mods.has("ctrl"))  parts.push("ctrl");
    if (mods.has("shift")) parts.push("shift");
    if (mods.has("alt"))   parts.push("alt");
    parts.push(key);
    return parts.join("+");
}

function applyAzeronProfile(profile) {
    let count = 0;
    for (const input of profile.inputs) {
        const keyId  = PIN_TO_KEY_ID[input.pinOne];
        if (!keyId) continue;
        const keyObj = keys.find(k => k.id === keyId);
        if (!keyObj) continue;

        const label  = (input.label || "").trim();
        const isKbd  = input.types?.[0] === "1" && input.keyValues?.[0] !== "0";
        if (!label && !isKbd) continue;

        if (label) {
            keyObj.label = label;
            const el = document.getElementById(keyId);
            if (el) el.innerText = label;
        }

        if (isKbd) {
            const keybind = buildKeybindString(input.keyValues[0], input.metaValues || []);
            if (keybind) {
                delete keyMap[keyObj.keybind];
                keyObj.keybind = keybind;
                keyMap[keybind] = keyId;
                if (!label) {
                    keyObj.label = keybind;
                    const el = document.getElementById(keyId);
                    if (el) el.innerText = keybind;
                }
            }
        }
        count++;
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
   KEY BUTTONS
----------------------------- */

keys.forEach(keyData => {
    const el = document.createElement("div");
    el.classList.add("key");
    el.id        = keyData.id;
    el.innerText = keyData.label;
    el.style.top  = keyData.top  + "px";
    el.style.left = keyData.left + "px";
    overlayContent.appendChild(el);
    keyMap[keyData.keybind] = keyData.id;

    el.addEventListener("click", (e) => {
        if (optionsPanel.style.display !== "flex" || isClickthrough) return;
        e.stopPropagation();
        showKeyPopup(keyData);
    });
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

function saveKeybinds() {
    const data = {};
    keys.forEach(k => { data[k.id] = { label: k.label, keybind: k.keybind }; });
    localStorage.setItem("keybinds", JSON.stringify(data));
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
    keyPopupTitle.textContent = keyData.label || keyData.id;
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
    if (e.key === "Enter")  { e.preventDefault(); popupKeybindInput.focus(); }
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
        // Show pending modifier state and wait for the actual key
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
    // Update or clear the pending display as modifiers are released
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

    // Restore the previously used display, fall back to primary
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

    // If the options button (at left+44, top+44) would be off-screen, reset
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

    connectWebSocket();
    applyAccentColor(accentColor);
    applyKeyBgColor(keyBgColor);
    updateOverlayScale();
    updateOverlayOpacity();
})();
