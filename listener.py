import asyncio
import ctypes
import ctypes.wintypes as wintypes
import json
import threading
import websockets

AZERON_VID       = "VID_16D0"
MODIFIER_VKS     = frozenset([0x10, 0x11, 0x12, 0xA0, 0xA1, 0xA2, 0xA3, 0xA4, 0xA5])
MODIFIER_NAMES   = {
    0x10: "shift", 0xA0: "shift", 0xA1: "shift",
    0x11: "ctrl",  0xA2: "ctrl",  0xA3: "ctrl",
    0x12: "alt",   0xA4: "alt",   0xA5: "alt",
}

VK_NAMES = {
    0x08: "backspace", 0x09: "tab",    0x0D: "enter",  0x1B: "esc",
    0x20: "space",     0x25: "left",   0x26: "up",     0x27: "right",
    0x28: "down",      0x2D: "insert", 0x2E: "delete",
    0x21: "pgup",      0x22: "pgdn",   0x23: "end",    0x24: "home",
    0x60: "num0",  0x61: "num1",  0x62: "num2",  0x63: "num3",  0x64: "num4",
    0x65: "num5",  0x66: "num6",  0x67: "num7",  0x68: "num8",  0x69: "num9",
    0x6A: "num*",  0x6B: "num+",  0x6D: "num-",  0x6E: "num.",  0x6F: "num/",
    0x70: "f1",  0x71: "f2",  0x72: "f3",  0x73: "f4",
    0x74: "f5",  0x75: "f6",  0x76: "f7",  0x77: "f8",
    0x78: "f9",  0x79: "f10", 0x7A: "f11", 0x7B: "f12",
    0xBA: ";",   0xBB: "=",   0xBC: ",",   0xBD: "-",   0xBE: ".",   0xBF: "/",
    0xC0: "`",   0xDB: "[",   0xDC: "\\",  0xDD: "]",   0xDE: "'",
}

# Win32 constants
WM_INPUT         = 0x00FF
RIM_TYPEMOUSE    = 0
RIM_TYPEKEYBOARD = 1
RIDI_DEVICENAME  = 0x20000007
RID_INPUT        = 0x10000003
RIDEV_INPUTSINK  = 0x00000100
RI_KEY_BREAK     = 0x0001
RI_KEY_E0        = 0x0002
# Numpad keys send navigation VK codes when NumLock is off, but lack the E0 flag.
# Dedicated nav cluster keys always have E0. Use MakeCode + no-E0 to identify true numpad.
MAKECODE_TO_NUMPAD = {
    0x47: "num7", 0x48: "num8", 0x49: "num9",
    0x4B: "num4", 0x4C: "num5", 0x4D: "num6",
    0x4F: "num1", 0x50: "num2", 0x51: "num3",
    0x52: "num0", 0x53: "num.",
}
# (down_flag, up_flag, name)
MOUSE_BUTTONS    = [
    (0x0001, 0x0002, "mouse1"),
    (0x0004, 0x0008, "mouse2"),
    (0x0010, 0x0020, "mouse3"),
    (0x0040, 0x0080, "mouse4"),
    (0x0100, 0x0200, "mouse5"),
]

# Win32 structs
class RAWINPUTDEVICELIST(ctypes.Structure):
    _fields_ = [("hDevice", ctypes.c_void_p), ("dwType", wintypes.DWORD)]

class RAWINPUTDEVICE(ctypes.Structure):
    _fields_ = [
        ("usUsagePage", ctypes.c_ushort),
        ("usUsage",     ctypes.c_ushort),
        ("dwFlags",     wintypes.DWORD),
        ("hwndTarget",  wintypes.HWND),
    ]

class RAWKEYBOARD(ctypes.Structure):
    _fields_ = [
        ("MakeCode",         ctypes.c_ushort),
        ("Flags",            ctypes.c_ushort),
        ("Reserved",         ctypes.c_ushort),
        ("VKey",             ctypes.c_ushort),
        ("Message",          wintypes.UINT),
        ("ExtraInformation", wintypes.ULONG),
    ]

class RAWINPUTHEADER(ctypes.Structure):
    _fields_ = [
        ("dwType",  wintypes.DWORD),
        ("dwSize",  wintypes.DWORD),
        ("hDevice", ctypes.c_void_p),
        ("wParam",  wintypes.WPARAM),
    ]

class _RAWMOUSE_BUTTONS(ctypes.Structure):
    _fields_ = [("usButtonFlags", ctypes.c_ushort), ("usButtonData", ctypes.c_ushort)]

class _RAWMOUSE_UNION(ctypes.Union):
    _fields_ = [("ulButtons", wintypes.ULONG), ("s", _RAWMOUSE_BUTTONS)]

class RAWMOUSE(ctypes.Structure):
    _anonymous_ = ("_u",)
    _fields_ = [
        ("usFlags",            ctypes.c_ushort),
        ("_u",                 _RAWMOUSE_UNION),
        ("ulRawButtons",       wintypes.ULONG),
        ("lLastX",             wintypes.LONG),
        ("lLastY",             wintypes.LONG),
        ("ulExtraInformation", wintypes.ULONG),
    ]

class _RAWINPUT_DATA(ctypes.Union):
    _fields_ = [("keyboard", RAWKEYBOARD), ("mouse", RAWMOUSE), ("_pad", ctypes.c_byte * 40)]

class RAWINPUT(ctypes.Structure):
    _anonymous_ = ("data",)
    _fields_    = [("header", RAWINPUTHEADER), ("data", _RAWINPUT_DATA)]

WNDPROC = ctypes.WINFUNCTYPE(ctypes.c_long, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)

class WNDCLASSEXW(ctypes.Structure):
    _fields_ = [
        ("cbSize",        wintypes.UINT),
        ("style",         wintypes.UINT),
        ("lpfnWndProc",   WNDPROC),
        ("cbClsExtra",    ctypes.c_int),
        ("cbWndExtra",    ctypes.c_int),
        ("hInstance",     wintypes.HINSTANCE),
        ("hIcon",         ctypes.c_void_p),
        ("hCursor",       ctypes.c_void_p),
        ("hbrBackground", ctypes.c_void_p),
        ("lpszMenuName",  wintypes.LPCWSTR),
        ("lpszClassName", wintypes.LPCWSTR),
        ("hIconSm",       ctypes.c_void_p),
    ]

class MSG(ctypes.Structure):
    _fields_ = [
        ("hwnd",    wintypes.HWND),
        ("message", wintypes.UINT),
        ("wParam",  wintypes.WPARAM),
        ("lParam",  wintypes.LPARAM),
        ("time",    wintypes.DWORD),
        ("pt",      wintypes.POINT),
    ]

connected_clients = set()
pending_combos    = {}
async_loop        = None
device_info       = {"pids": []}


def find_azeron_handles():
    """Return (kb_handles, mouse_handles) for all Azeron raw input devices."""
    import re
    user32  = ctypes.windll.user32
    num     = wintypes.UINT(0)
    user32.GetRawInputDeviceList(None, ctypes.byref(num), ctypes.sizeof(RAWINPUTDEVICELIST))
    if not num.value:
        return set(), set()
    devices = (RAWINPUTDEVICELIST * num.value)()
    user32.GetRawInputDeviceList(devices, ctypes.byref(num), ctypes.sizeof(RAWINPUTDEVICELIST))
    kb_handles    = set()
    mouse_handles = set()
    for dev in devices:
        if dev.dwType not in (RIM_TYPEKEYBOARD, RIM_TYPEMOUSE):
            continue
        sz = wintypes.UINT(0)
        user32.GetRawInputDeviceInfoW(dev.hDevice, RIDI_DEVICENAME, None, ctypes.byref(sz))
        if not sz.value:
            continue
        buf = ctypes.create_unicode_buffer(sz.value)
        user32.GetRawInputDeviceInfoW(dev.hDevice, RIDI_DEVICENAME, buf, ctypes.byref(sz))
        if AZERON_VID.upper() not in buf.value.upper():
            continue
        print(f"Azeron device found: {buf.value}", flush=True)
        m = re.search(r'PID_([0-9A-Fa-f]+)', buf.value, re.IGNORECASE)
        if m:
            pid = m.group(1).upper()
            if pid not in device_info["pids"]:
                device_info["pids"].append(pid)
            print(f"Azeron PID: {pid}", flush=True)
        if dev.dwType == RIM_TYPEKEYBOARD:
            kb_handles.add(dev.hDevice)
        else:
            mouse_handles.add(dev.hDevice)
    return kb_handles, mouse_handles


def vkey_to_name(vk, flags=0, mcode=0):
    if 0x41 <= vk <= 0x5A: return chr(vk + 32)
    if 0x30 <= vk <= 0x39: return chr(vk)
    # Numpad key with NumLock off: no E0 flag, MakeCode matches numpad range
    if not (flags & RI_KEY_E0) and mcode in MAKECODE_TO_NUMPAD:
        return MAKECODE_TO_NUMPAD[mcode]
    return VK_NAMES.get(vk)


def build_combo(key):
    gaks  = ctypes.windll.user32.GetAsyncKeyState
    parts = []
    if gaks(0x11) & 0x8000: parts.append("ctrl")
    if gaks(0x10) & 0x8000: parts.append("shift")
    if gaks(0x12) & 0x8000: parts.append("alt")
    parts.append(key)
    return "+".join(parts)


async def websocket_handler(websocket):
    connected_clients.add(websocket)
    try:
        await websocket.send(json.dumps({"type": "device_info", "pids": device_info["pids"]}))
        await websocket.wait_closed()
    finally:
        connected_clients.discard(websocket)


async def send_key_event(key, action):
    if connected_clients:
        msg = json.dumps({"key": key, "action": action})
        await asyncio.gather(*[c.send(msg) for c in connected_clients])


def run_raw_input_loop(kb_handles, mouse_handles):
    user32    = ctypes.windll.user32
    kernel32  = ctypes.windll.kernel32
    hinstance = kernel32.GetModuleHandleW(None)

    def wnd_proc(hwnd, msg, wparam, lparam):
        if msg == WM_INPUT:
            sz = wintypes.UINT(0)
            user32.GetRawInputData(lparam, RID_INPUT, None, ctypes.byref(sz), ctypes.sizeof(RAWINPUTHEADER))
            buf = ctypes.create_string_buffer(sz.value)
            user32.GetRawInputData(lparam, RID_INPUT, buf, ctypes.byref(sz), ctypes.sizeof(RAWINPUTHEADER))
            raw = ctypes.cast(buf, ctypes.POINTER(RAWINPUT)).contents

            if raw.header.hDevice in kb_handles and raw.header.dwType == RIM_TYPEKEYBOARD:
                vk    = raw.keyboard.VKey
                mcode = raw.keyboard.MakeCode
                is_up = bool(raw.keyboard.Flags & RI_KEY_BREAK)

                if vk in MODIFIER_VKS:
                    name = MODIFIER_NAMES.get(vk)
                    if name and async_loop and async_loop.is_running():
                        action = "up" if is_up else "down"
                        print(f"{name}:{action}", flush=True)
                        asyncio.run_coroutine_threadsafe(
                            send_key_event(name, action), async_loop
                        )
                else:
                    key = vkey_to_name(vk, raw.keyboard.Flags, mcode)
                    if key:
                        if not is_up:
                            if mcode in pending_combos:
                                return 0  # auto-repeat, ignore
                            combo  = build_combo(key)
                            pending_combos[mcode] = combo
                            action = "down"
                        else:
                            combo  = pending_combos.pop(mcode, build_combo(key))
                            action = "up"
                        print(combo, flush=True)
                        if async_loop and async_loop.is_running():
                            asyncio.run_coroutine_threadsafe(
                                send_key_event(combo, action), async_loop
                            )

            elif raw.header.hDevice in mouse_handles and raw.header.dwType == RIM_TYPEMOUSE:
                flags = raw.mouse.usButtonFlags
                for down_flag, up_flag, btn_name in MOUSE_BUTTONS:
                    if flags & down_flag:
                        print(f"{btn_name}:down", flush=True)
                        if async_loop and async_loop.is_running():
                            asyncio.run_coroutine_threadsafe(
                                send_key_event(btn_name, "down"), async_loop
                            )
                    elif flags & up_flag:
                        print(f"{btn_name}:up", flush=True)
                        if async_loop and async_loop.is_running():
                            asyncio.run_coroutine_threadsafe(
                                send_key_event(btn_name, "up"), async_loop
                            )
        return user32.DefWindowProcW(hwnd, msg, wparam, lparam)

    wnd_proc_cb = WNDPROC(wnd_proc)

    wc               = WNDCLASSEXW()
    wc.cbSize        = ctypes.sizeof(WNDCLASSEXW)
    wc.lpfnWndProc   = wnd_proc_cb
    wc.hInstance     = hinstance
    wc.lpszClassName = "AzeronRawInput"

    if not user32.RegisterClassExW(ctypes.byref(wc)):
        print("Failed to register window class", flush=True)
        return

    hwnd = user32.CreateWindowExW(
        0, "AzeronRawInput", "", 0,
        0, 0, 0, 0,
        wintypes.HWND(-3),  # HWND_MESSAGE — no visible window needed
        None, hinstance, None
    )
    if not hwnd:
        print(f"Failed to create message window (error {kernel32.GetLastError()})", flush=True)
        return

    num_rid  = 2 if mouse_handles else 1
    rids     = (RAWINPUTDEVICE * num_rid)()
    rids[0].usUsagePage = 0x01
    rids[0].usUsage     = 0x06  # Keyboard
    rids[0].dwFlags     = RIDEV_INPUTSINK
    rids[0].hwndTarget  = hwnd
    if mouse_handles:
        rids[1].usUsagePage = 0x01
        rids[1].usUsage     = 0x02  # Mouse
        rids[1].dwFlags     = RIDEV_INPUTSINK
        rids[1].hwndTarget  = hwnd

    if not user32.RegisterRawInputDevices(rids, num_rid, ctypes.sizeof(RAWINPUTDEVICE)):
        print("Failed to register raw input devices", flush=True)
        return

    print("Raw input listener active", flush=True)
    msg_struct = MSG()
    while user32.GetMessageW(ctypes.byref(msg_struct), None, 0, 0) != 0:
        user32.TranslateMessage(ctypes.byref(msg_struct))
        user32.DispatchMessageW(ctypes.byref(msg_struct))


async def main():
    global async_loop
    async_loop = asyncio.get_running_loop()

    kb_handles, mouse_handles = find_azeron_handles()
    if not kb_handles:
        print("No Azeron device found — make sure it is connected and try again.", flush=True)
        return
    if mouse_handles:
        print(f"Azeron mouse interface found ({len(mouse_handles)} handle(s))", flush=True)

    threading.Thread(target=run_raw_input_loop, args=(kb_handles, mouse_handles), daemon=True).start()

    print("WebSocket server starting...", flush=True)
    try:
        async with websockets.serve(websocket_handler, "localhost", 8765):
            print("WebSocket server running on ws://localhost:8765", flush=True)
            await asyncio.Future()
    except Exception as e:
        import traceback
        print(f"WebSocket server failed: {e}", flush=True)
        traceback.print_exc()


asyncio.run(main())
