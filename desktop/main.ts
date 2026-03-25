import { app, BrowserWindow, shell, Menu } from "electron";
import path from "path";
import isDev from "electron-is-dev";

import Store from "electron-store";

const store = new Store();
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const windowState = store.get("windowState", {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
  }) as { width: number; height: number; x: number | undefined; y: number | undefined };

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: "hidden", 
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "icon.png"),
  });

  mainWindow.on("resize", () => {
    if (!mainWindow) return;
    const { width, height, x, y } = mainWindow.getBounds();
    store.set("windowState", { width, height, x, y });
  });

  mainWindow.on("move", () => {
    if (!mainWindow) return;
    const { width, height, x, y } = mainWindow.getBounds();
    store.set("windowState", { width, height, x, y });
  });

  const url = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../apps/frontend/out/index.html")}`;

  mainWindow.loadURL(url);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: "deny" };
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

app.whenReady().then(() => {
  setAppMenu();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
