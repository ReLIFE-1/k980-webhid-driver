import json

with open('keys.json', 'r', encoding='utf-8') as f:
    keys = json.load(f)

code_map = {
    'Esc': 'Escape', 'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6', 'F7': 'F7',
    'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12', 'Delete': 'Delete', 'Home': 'Home', 'End': 'End',
    'PgUp': 'PageUp', 'PgDn': 'PageDown', '`': 'Backquote', '1': 'Digit1', '2': 'Digit2', '3': 'Digit3',
    '4': 'Digit4', '5': 'Digit5', '6': 'Digit6', '7': 'Digit7', '8': 'Digit8', '9': 'Digit9', '0': 'Digit0',
    '-': 'Minus', '=': 'Equal', 'Backspace': 'Backspace', 'Tab': 'Tab', 'Q': 'KeyQ', 'W': 'KeyW', 'E': 'KeyE',
    'R': 'KeyR', 'T': 'KeyT', 'Y': 'KeyY', 'U': 'KeyU', 'I': 'KeyI', 'O': 'KeyO', 'P': 'KeyP', '[': 'BracketLeft',
    ']': 'BracketRight', '\\': 'Backslash', 'CapsLock': 'CapsLock', 'A': 'KeyA', 'S': 'KeyS', 'D': 'KeyD',
    'F': 'KeyF', 'G': 'KeyG', 'H': 'KeyH', 'J': 'KeyJ', 'K': 'KeyK', 'L': 'KeyL', ';': 'Semicolon',
    "'": 'Quote', 'Enter': 'Enter', 'LShift': 'ShiftLeft', 'Z': 'KeyZ', 'X': 'KeyX', 'C': 'KeyC',
    'V': 'KeyV', 'B': 'KeyB', 'N': 'KeyN', 'M': 'KeyM', ',': 'Comma', '.': 'Period', '/': 'Slash',
    'RShift': 'ShiftRight', 'Up': 'ArrowUp', 'LCtrl': 'ControlLeft', 'LWin': 'MetaLeft', 'LAlt': 'AltLeft',
    'Space': 'Space', 'RAlt': 'AltRight', 'Fn': 'Fn', 'Rcrtl': 'ControlRight', 'Left': 'ArrowLeft',
    'Down': 'ArrowDown', 'Right': 'ArrowRight', 'NumLock': 'NumLock', 'Num /': 'NumpadDivide', 'Num*': 'NumpadMultiply',
    'Num-': 'NumpadSubtract', 'Num+': 'NumpadAdd', 'Num7': 'Numpad7', 'Num8': 'Numpad8', 'Num9': 'Numpad9',
    'Num4': 'Numpad4', 'Num5': 'Numpad5', 'Num6': 'Numpad6', 'Num1': 'Numpad1', 'Num2': 'Numpad2', 'Num3': 'Numpad3',
    'Num0': 'Numpad0', 'Num .': 'NumpadDecimal'
}

for k in keys:
    lbl = k['label']
    k['eventCode'] = code_map.get(lbl, lbl)

with open('keys.js', 'w', encoding='utf-8') as f:
    f.write('const K980_KEYS = ' + json.dumps(keys, indent=2, ensure_ascii=False) + ';\n')
print('keys.js created successfully!')