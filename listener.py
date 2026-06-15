import asyncio
import ctypes
import json
import keyboard
import websockets

MODIFIER_NAMES = {
    "shift", "left shift", "right shift",
    "ctrl", "left ctrl", "right ctrl",
    "alt", "left alt", "right alt",
}

connected_clients = set()
pending_combos = {}  # scan_code -> combo string sent on first key-down
loop = None

async def websocket_handler(websocket):
    connected_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)

async def send_key_event(key, action):
    if connected_clients:
        message = json.dumps({"key": key, "action": action})
        await asyncio.gather(
            *[client.send(message) for client in connected_clients]
        )

def get_base_key_name(event):
    """Return the physical key name independent of shift/ctrl character mapping."""
    vk = ctypes.windll.user32.MapVirtualKeyW(event.scan_code, 1)
    if 0x30 <= vk <= 0x39:
        return chr(vk)       # digit 0-9
    if 0x41 <= vk <= 0x5A:
        return chr(vk + 32)  # letter a-z
    return event.name        # space, f1, enter, arrows, etc.

def build_key_combo(key):
    """Build modifier+key string using live Windows key state."""
    gaks = ctypes.windll.user32.GetAsyncKeyState
    combo = []
    if gaks(0x11) & 0x8000: combo.append("ctrl")   # VK_CONTROL
    if gaks(0x10) & 0x8000: combo.append("shift")  # VK_SHIFT
    if gaks(0x12) & 0x8000: combo.append("alt")    # VK_MENU
    combo.append(key)
    return "+".join(combo)

def on_key_event(event):
    if event.name in MODIFIER_NAMES:
        return

    key = get_base_key_name(event)

    if event.event_type == "down":
        if event.scan_code in pending_combos:
            return  # auto-repeat: key already active, ignore
        combo_key = build_key_combo(key)
        pending_combos[event.scan_code] = combo_key
    else:
        combo_key = pending_combos.pop(event.scan_code, build_key_combo(key))

    print(combo_key, flush=True)
    if loop and loop.is_running():
        asyncio.run_coroutine_threadsafe(
            send_key_event(combo_key, event.event_type),
            loop
        )

async def main():
    global loop
    loop = asyncio.get_running_loop()
    keyboard.hook(on_key_event)
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
