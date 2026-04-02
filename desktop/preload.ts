import { contextBridge, ipcRenderer } from "electron";

const apiArgPrefix = "--openchat-api-url=";
const apiUrlArg = process.argv.find((arg) => arg.startsWith(apiArgPrefix));
const apiUrl = apiUrlArg ? decodeURIComponent(apiUrlArg.slice(apiArgPrefix.length)) : undefined;

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
