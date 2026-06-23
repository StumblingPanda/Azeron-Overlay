// LH Cyro — horizontally mirrored RH Cyro layout.
// Mirror formula: new_left = 516 - original_left  (contentWidth 581, button width 65)
// Joystick moves to right side. 5-way cluster moves to top-right.

module.exports = [

    // Solo button (top right)
    { id: "cy-lh-r0c1",  label: "", keybind: "", top:  30, left: 363 },

    // Row 1: 3 buttons (right side)
    { id: "cy-lh-r1c2",  label: "", keybind: "", top: 117, left: 294 },
    { id: "cy-lh-r1c1",  label: "", keybind: "", top: 117, left: 363 },
    { id: "cy-lh-r1c0",  label: "", keybind: "", top: 117, left: 432 },

    // Row 2: 4 left + 1 right
    { id: "cy-lh-r2c6",  label: "", keybind: "", top: 204, left:  69 },
    { id: "cy-lh-r2c5",  label: "", keybind: "", top: 204, left: 138 },
    { id: "cy-lh-r2c4",  label: "", keybind: "", top: 204, left: 207 },
    { id: "cy-lh-r2c3",  label: "", keybind: "", top: 204, left: 276 },
    { id: "cy-lh-r2c1",  label: "", keybind: "", top: 204, left: 363 },

    // Row 3: 4 left (joystick on right)
    { id: "cy-lh-r3c6",  label: "", keybind: "", top: 291, left:  69 },
    { id: "cy-lh-r3c5",  label: "", keybind: "", top: 291, left: 138 },
    { id: "cy-lh-r3c4",  label: "", keybind: "", top: 291, left: 207 },
    { id: "cy-lh-r3c3",  label: "", keybind: "", top: 291, left: 276 },

    // Row 4: 4 left + scroll encoder (green row)
    { id: "cy-lh-r4c7",  label: "", keybind: "", top: 378, left:   0 },
    { id: "cy-lh-r4c6",  label: "", keybind: "", top: 378, left:  69 },
    { id: "cy-lh-r4c5",  label: "", keybind: "", top: 378, left: 138 },
    { id: "cy-lh-r4c4",  label: "", keybind: "", top: 378, left: 207 },
    { id: "cy-lh-r4c3",  label: "", keybind: "", type: "scroll", top: 378, left: 276 },

    // Row 5: 4 left + 1 right (pink row)
    { id: "cy-lh-r5c7",  label: "", keybind: "", top: 465, left:   0 },
    { id: "cy-lh-r5c6",  label: "", keybind: "", top: 465, left:  69 },
    { id: "cy-lh-r5c5",  label: "", keybind: "", top: 465, left: 138 },
    { id: "cy-lh-r5c4",  label: "", keybind: "", top: 465, left: 207 },
    { id: "cy-lh-r5c1",  label: "", keybind: "", top: 465, left: 363 },
];
