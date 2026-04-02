import { app, BrowserWindow, shell, Menu, dialog } from "electron";
import path from "path";
import fs from "fs";
import net from "net";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let nextServerProcess: ChildProcessWithoutNullStreams | null = null;
let nextServerPort: number | null = null;
const START_PATH = "/auth";
const DEFAULT_WEB_URL = "https://openchat.qzz.io";
const DEFAULT_API_URL = "https://api.openchat.qzz.io";

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

function getWebUrl() {
  return normalizeAndValidateApiUrl(process.env.OPENCHAT_WEB_URL) ?? DEFAULT_WEB_URL;
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

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.unref();
    tester.on("error", () => resolve(false));
    tester.listen(port, "127.0.0.1", () => {
      tester.close(() => resolve(true));
    });
  });
}

async function pickPort(startPort = 3000, maxTries = 50): Promise<number> {
  for (let i = 0; i < maxTries; i++) {
    const port = startPort + i;
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port;
  }
  throw new Error(`Could not find a free port starting at ${startPort}.`);
}

function waitForTcp(host: string, port: number, timeoutMs = 20_000): Promise<void> {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const socket = net.connect({ host, port });
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }
        setTimeout(tryOnce, 200);
      });
    };

    tryOnce();
  });
}

async function ensureNextServerStarted(): Promise<number> {
  if (nextServerPort !== null) return nextServerPort;

  const rendererDirCandidates = [
    path.join(app.getAppPath(), "renderer"),
    path.join(process.resourcesPath, "app.asar.unpacked", "renderer"),
  ];
  const rendererDir = rendererDirCandidates.find((p) => fs.existsSync(p)) ?? rendererDirCandidates[0];
  const serverEntryCandidates = [
    path.join(rendererDir, "server.js"),
    path.join(rendererDir, "apps", "frontend", "server.js"),
  ];
  const serverEntry = serverEntryCandidates.find((p) => fs.existsSync(p));
  if (!serverEntry) {
    throw new Error(
      `Missing Next server entry under ${rendererDir}. Build the desktop app first (pnpm build:desktop).`,
    );
  }

  nextServerPort = await pickPort(3000);

  nextServerProcess = spawn(
    process.execPath,
    ["--runAsNode", serverEntry],
    {
      cwd: rendererDir,
      env: {
        ...process.env,
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: String(nextServerPort),
        NEXT_PUBLIC_API_URL: getApiUrl(),
      },
      stdio: "pipe",
    },
  );

  nextServerProcess.on("exit", (code, signal) => {
    if (isDev) return;
    console.error(`Next server exited (code=${code}, signal=${signal})`);
  });

  nextServerProcess.stdout.on("data", (buf) => console.log(String(buf).trimEnd()));
  nextServerProcess.stderr.on("data", (buf) => console.error(String(buf).trimEnd()));

  await waitForTcp("127.0.0.1", nextServerPort);
  return nextServerPort;
}

async function resolveAppUrl(): Promise<string> {
  if (isDev) return "http://localhost:3000";
  return getWebUrl();
}

function buildStartUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  url.pathname = START_PATH;
  return url.toString();
}

function isAllowedNavigation(targetUrl: string) {
  try {
    const origin = new URL(targetUrl).origin;
    if (origin === "http://localhost:3000") return true;
    if (origin.startsWith("http://127.0.0.1:")) return true;
    return origin === new URL(getWebUrl()).origin;
  } catch {
    return false;
  }
}

async function loadMainUrl() {
  if (!mainWindow) return;

  const primaryUrl = buildStartUrl(await resolveAppUrl());
  try {
    await mainWindow.loadURL(primaryUrl);
    return;
  } catch (err) {
    if (isDev) throw err;
    const port = await ensureNextServerStarted();
    await mainWindow.loadURL(buildStartUrl(`http://127.0.0.1:${port}`));
  }
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
    await loadMainUrl();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    dialog.showErrorBox("OpenChat failed to start", message);
    app.quit();
    return;
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
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

app.on("before-quit", () => {
  if (nextServerProcess && !nextServerProcess.killed) {
    nextServerProcess.kill();
  }
});
