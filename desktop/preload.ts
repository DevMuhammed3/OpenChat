import { contextBridge, ipcRenderer } from "electron";

const apiArgPrefix = "--openchat-api-url=";
const apiUrlArg = process.argv.find((arg) => arg.startsWith(apiArgPrefix));
const apiUrl = apiUrlArg ? decodeURIComponent(apiUrlArg.slice(apiArgPrefix.length)) : undefined;

function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Expose a minimal API to the renderer process
contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
  send: (channel: string, data: any) => {
    // Whitelist channels for security
    const validChannels = ["toMain"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ["fromMain"];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (_event: any, ...args: any[]) => func(...args));
    }
  },
});

contextBridge.exposeInMainWorld("openchatConfig", {
  apiUrl,
});

// Only for local error/offline pages shipped with the app (file:// origin).
contextBridge.exposeInMainWorld("openchatDesktop", {
  openExternal: (url: unknown) => {
    if (globalThis.location?.protocol !== "file:") return;
    if (!isSafeHttpUrl(url)) return;
    ipcRenderer.send("openchat:open-external", url);
  },
});
