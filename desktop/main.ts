import { app, BrowserWindow, shell, Menu, ipcMain } from "electron";
import path from "path";
import fs from "fs";

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
const START_PATH = "/auth";
const WEB_ORIGIN = "https://openchat.qzz.io";
const DEFAULT_API_URL = "https://api.openchat.qzz.io";
let isShowingOfflinePage = false;

function normalizeAndValidateApiUrl(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function getApiUrl() {
  return (
    normalizeAndValidateApiUrl(process.env.OPENCHAT_API_URL || process.env.NEXT_PUBLIC_API_URL) ??
    DEFAULT_API_URL
  );
}

type WindowState = { width: number; height: number; x?: number; y?: number };
const defaultWindowState: WindowState = { width: 1200, height: 800 };

function getWindowStatePath(): string {
  return path.join(app.getPath("userData"), "window-state.json");
}

function readWindowState(): WindowState {
  try {
    const raw = fs.readFileSync(getWindowStatePath(), "utf8");
    const parsed = JSON.parse(raw) as WindowState;
    return {
      width: typeof parsed.width === "number" ? parsed.width : defaultWindowState.width,
      height: typeof parsed.height === "number" ? parsed.height : defaultWindowState.height,
      x: typeof parsed.x === "number" ? parsed.x : undefined,
      y: typeof parsed.y === "number" ? parsed.y : undefined,
    };
  } catch {
    return { ...defaultWindowState };
  }
}

function writeWindowState(bounds: { width: number; height: number; x: number; y: number }) {
  try {
    const state: WindowState = { width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y };
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(state), "utf8");
  } catch {
    // Best-effort persistence only.
  }
}

function resolveAppFile(relPath: string): string {
  const candidates = [
    path.join(app.getAppPath(), relPath),
    path.join(__dirname, relPath),
    path.join(__dirname, "..", relPath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[0];
}

function buildStartUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  url.pathname = START_PATH;
  return url.toString();
}

function isAllowedNavigation(targetUrl: string) {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol === "file:") return true; // offline page
    if (parsed.protocol === "devtools:") return true;
    if (parsed.protocol === "about:") return true;
    if (isDev && parsed.origin === "http://localhost:3000") return true;
    return parsed.origin === WEB_ORIGIN;
  } catch {
    return false;
  }
}

function getRemoteAuthUrl() {
  return buildStartUrl(WEB_ORIGIN);
}

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

async function showOfflinePage(error?: { code?: number; description?: string; url?: string }) {
  if (!mainWindow) return;
  isShowingOfflinePage = true;

  const offlinePath = resolveAppFile(path.join("ui", "offline.html"));
  const query: Record<string, string> = {
    url: error?.url ?? getRemoteAuthUrl(),
    code: typeof error?.code === "number" ? String(error.code) : "",
    desc: error?.description ?? "",
  };

  await mainWindow.loadFile(offlinePath, { query });
}

async function loadRemote() {
  if (!mainWindow) return;
  isShowingOfflinePage = false;
  await mainWindow.loadURL(getRemoteAuthUrl());
}

async function createWindow() {
  const windowState = readWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    ...(process.platform === "darwin"
      ? { titleBarStyle: "hidden", trafficLightPosition: { x: 15, y: 15 } }
      : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: resolveAppFile("preload.cjs"),
      additionalArguments: [`--openchat-api-url=${encodeURIComponent(getApiUrl())}`],
    },
    icon: resolveAppFile("icon.png"),
    autoHideMenuBar: false,
  });

  if (process.platform !== "darwin") {
    mainWindow.setMenuBarVisibility(true);
  }

  mainWindow.on("resize", () => {
    if (!mainWindow) return;
    const { width, height, x, y } = mainWindow.getBounds();
    writeWindowState({ width, height, x, y });
  });

  mainWindow.on("move", () => {
    if (!mainWindow) return;
    const { width, height, x, y } = mainWindow.getBounds();
    writeWindowState({ width, height, x, y });
  });

  try {
    await loadRemote();
  } catch (err) {
    if (isDev) throw err;
    await showOfflinePage({ description: err instanceof Error ? err.message : String(err), url: getRemoteAuthUrl() });
  }

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) return;
      if (!validatedURL || !validatedURL.startsWith(WEB_ORIGIN)) return;
      if (isShowingOfflinePage) return;
      void showOfflinePage({ code: errorCode, description: errorDescription, url: validatedURL });
    },
  );

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    if (isAllowedNavigation(url) && mainWindow) {
      void mainWindow.loadURL(url);
      return { action: "deny" };
    }

    void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  mainWindow.webContents.on("will-redirect", (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    if (isDev) return;
    void showOfflinePage({
      description: `Renderer crashed (${details.reason}). Please restart the app.`,
      url: getRemoteAuthUrl(),
    });
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function setAppMenu() {
  const isMac = process.platform === "darwin";
  const template: any[] = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            await shell.openExternal("https://openchat.io");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
}

app.whenReady().then(() => {
  setAppMenu();
  void createWindow();
});

ipcMain.on("openchat:open-external", (event, url) => {
  if (!event.senderFrame?.url?.startsWith("file:")) return;
  if (!isSafeHttpUrl(url)) return;
  void shell.openExternal(url);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    void createWindow();
  }
});
