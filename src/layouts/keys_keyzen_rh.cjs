// RH Keyzen — horizontally mirrored LH Keyzen layout.
// Mirror formula: new_left = 566 - original_left  (contentWidth 631, button width 65)
// +80px right offset to clear options buttons. +10px down for breathing room.
// Joystick moves to left side. Solo top button moves to top-left.

module.exports = [

    // Row 0: solo button (top left — mirrored from top-right)
    { id: "kz-rh-r0c7",  label: "", keybind: "", top:  10, left: 149 },

    // Row 1: Right, T, Left + C, V, X
    { id: "kz-rh-r1c8",  label: "", keybind: "", top:  97, left:  80 },
    { id: "kz-rh-r1c7",  label: "", keybind: "", top:  97, left: 149 },
    { id: "kz-rh-r1c6",  label: "", keybind: "", top:  97, left: 218 },
    { id: "kz-rh-r1c4",  label: "", keybind: "", top:  97, left: 356 },
    { id: "kz-rh-r1c3",  label: "", keybind: "", top:  97, left: 425 },
    { id: "kz-rh-r1c2",  label: "", keybind: "", top:  97, left: 494 },

    // Row 2: Down + F, E, R, G, Q
    { id: "kz-rh-r2c7",  label: "", keybind: "", top: 184, left: 149 },
    { id: "kz-rh-r2c5",  label: "", keybind: "", top: 184, left: 287 },
    { id: "kz-rh-r2c4",  label: "", keybind: "", top: 184, left: 356 },
    { id: "kz-rh-r2c3",  label: "", keybind: "", top: 184, left: 425 },
    { id: "kz-rh-r2c2",  label: "", keybind: "", top: 184, left: 494 },
    { id: "kz-rh-r2c1",  label: "", keybind: "", top: 184, left: 563 },

    // Row 3: = + A, Space, 3, 2, 1, Z
    { id: "kz-rh-r3c8",  label: "", keybind: "", top: 271, left:  80 },
    { id: "kz-rh-r3c5",  label: "", keybind: "", top: 271, left: 287 },
    { id: "kz-rh-r3c4",  label: "", keybind: "", top: 271, left: 356 },
    { id: "kz-rh-r3c3",  label: "", keybind: "", top: 271, left: 425 },
    { id: "kz-rh-r3c2",  label: "", keybind: "", top: 271, left: 494 },
    { id: "kz-rh-r3c1",  label: "", keybind: "", top: 271, left: 563 },
    { id: "kz-rh-r3c0",  label: "", keybind: "", top: 271, left: 632 },

    // Row 4: B, Ctrl, Shift, Alt, A, O
    { id: "kz-rh-r4c5",  label: "", keybind: "", top: 358, left: 287 },
    { id: "kz-rh-r4c4",  label: "", keybind: "", top: 358, left: 356 },
    { id: "kz-rh-r4c3",  label: "", keybind: "", top: 358, left: 425 },
    { id: "kz-rh-r4c2",  label: "", keybind: "", top: 358, left: 494 },
    { id: "kz-rh-r4c1",  label: "", keybind: "", top: 358, left: 563 },
    { id: "kz-rh-r4c0",  label: "", keybind: "", top: 358, left: 632 },

    // Row 5: Esc, Z2 + M, I, L, P
    { id: "kz-rh-r5c8",  label: "", keybind: "", top: 445, left:  80 },
    { id: "kz-rh-r5c7",  label: "", keybind: "", top: 445, left: 149 },
    { id: "kz-rh-r5c4",  label: "", keybind: "", top: 445, left: 356 },
    { id: "kz-rh-r5c3",  label: "", keybind: "", top: 445, left: 425 },
    { id: "kz-rh-r5c2",  label: "", keybind: "", top: 445, left: 494 },
    { id: "kz-rh-r5c1",  label: "", keybind: "", top: 445, left: 563 },
];
