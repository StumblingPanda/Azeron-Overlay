import asyncio
import json
import keyboard
import websockets

MODIFIER_MAP = {
    "shift": "shift", "left shift": "shift", "right shift": "shift",
    "ctrl": "ctrl",   "left ctrl": "ctrl",   "right ctrl": "ctrl",
    "alt": "alt",     "left alt": "alt",     "right alt": "alt",
}

connected_clients = set()

pressed_modifiers = {
    "shift": False,
    "ctrl": False,
    "alt": False
}

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

def build_key_combo(key):
    combo = []
    if pressed_modifiers["shift"]:
        combo.append("shift")
    if pressed_modifiers["ctrl"]:
        combo.append("ctrl")
    if pressed_modifiers["alt"]:
        combo.append("alt")
    combo.append(key)
    return "+".join(combo)

def on_key_event(event):
    key = event.name

    modifier = MODIFIER_MAP.get(key)
    if modifier:
        pressed_modifiers[modifier] = event.event_type == "down"
        return

    combo_key = build_key_combo(key)
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

    async with websockets.serve(websocket_handler, "localhost", 8765):
        print("WebSocket server running on ws://localhost:8765", flush=True)
        await asyncio.Future()

asyncio.run(main())
