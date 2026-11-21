export function getStorage(key, fallback = null) {
  try {
    const val = window.localStorage.getItem(key);
    return val === null ? fallback : val;
  } catch {
    return fallback;
  }
}

export function setStorage(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export function getJsonStorage(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setJsonStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
