import asyncio
import ctypes
import ctypes.wintypes as wintypes
import json
import threading
import websockets

AZERON_VID       = "VID_16D0"
MODIFIER_VKS     = frozenset([0x10, 0x11, 0x12, 0xA0, 0xA1, 0xA2, 0xA3, 0xA4, 0xA5])

VK_NAMES = {
    0x08: "backspace", 0x09: "tab",    0x0D: "enter",  0x1B: "esc",
    0x20: "space",     0x25: "left",   0x26: "up",     0x27: "right",
    0x28: "down",      0x2D: "insert", 0x2E: "delete",
    0x70: "f1",  0x71: "f2",  0x72: "f3",  0x73: "f4",
    0x74: "f5",  0x75: "f6",  0x76: "f7",  0x77: "f8",
    0x78: "f9",  0x79: "f10", 0x7A: "f11", 0x7B: "f12",
}

# Win32 constants
WM_INPUT         = 0x00FF
RIM_TYPEKEYBOARD = 1
RIDI_DEVICENAME  = 0x20000007
RID_INPUT        = 0x10000003
RIDEV_INPUTSINK  = 0x00000100
RI_KEY_BREAK     = 0x0001

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

class _RAWINPUT_DATA(ctypes.Union):
    _fields_ = [("keyboard", RAWKEYBOARD), ("_pad", ctypes.c_byte * 40)]

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


def find_azeron_handles():
    """Return all raw input device handles whose HID path contains AZERON_VID."""
    user32  = ctypes.windll.user32
    num     = wintypes.UINT(0)
    user32.GetRawInputDeviceList(None, ctypes.byref(num), ctypes.sizeof(RAWINPUTDEVICELIST))
    if not num.value:
        return set()
    devices = (RAWINPUTDEVICELIST * num.value)()
    user32.GetRawInputDeviceList(devices, ctypes.byref(num), ctypes.sizeof(RAWINPUTDEVICELIST))
    handles = set()
    for dev in devices:
        if dev.dwType != RIM_TYPEKEYBOARD:
            continue
        sz = wintypes.UINT(0)
        user32.GetRawInputDeviceInfoW(dev.hDevice, RIDI_DEVICENAME, None, ctypes.byref(sz))
        if not sz.value:
            continue
        buf = ctypes.create_unicode_buffer(sz.value)
        user32.GetRawInputDeviceInfoW(dev.hDevice, RIDI_DEVICENAME, buf, ctypes.byref(sz))
        if AZERON_VID.upper() in buf.value.upper():
            print(f"Azeron device found: {buf.value}", flush=True)
            handles.add(dev.hDevice)
    return handles


def vkey_to_name(vk):
    if 0x41 <= vk <= 0x5A: return chr(vk + 32)
    if 0x30 <= vk <= 0x39: return chr(vk)
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
        await websocket.wait_closed()
    finally:
        connected_clients.discard(websocket)


async def send_key_event(key, action):
    if connected_clients:
        msg = json.dumps({"key": key, "action": action})
        await asyncio.gather(*[c.send(msg) for c in connected_clients])


def run_raw_input_loop(azeron_handles):
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

            if raw.header.hDevice in azeron_handles and raw.header.dwType == RIM_TYPEKEYBOARD:
                vk    = raw.keyboard.VKey
                mcode = raw.keyboard.MakeCode
                is_up = bool(raw.keyboard.Flags & RI_KEY_BREAK)

                if vk not in MODIFIER_VKS:
                    key = vkey_to_name(vk)
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

    rid             = RAWINPUTDEVICE()
    rid.usUsagePage = 0x01  # Generic Desktop Controls
    rid.usUsage     = 0x06  # Keyboard
    rid.dwFlags     = RIDEV_INPUTSINK
    rid.hwndTarget  = hwnd

    if not user32.RegisterRawInputDevices(ctypes.byref(rid), 1, ctypes.sizeof(RAWINPUTDEVICE)):
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

    azeron_handles = find_azeron_handles()
    if not azeron_handles:
        print("No Azeron device found — make sure it is connected and try again.", flush=True)
        return

    threading.Thread(target=run_raw_input_loop, args=(azeron_handles,), daemon=True).start()

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
