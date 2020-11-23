"use strict";

import { app, protocol, BrowserWindow, screen, ipcMain } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
//import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";

import { initExtra, createTray, registerHotKey,unregisterAllHotKey } from "@/utils/backgroundExtra";

import { autoUpdater } from "electron-updater";

import pkg from "../package.json";

let win;

if (app.requestSingleInstanceLock()) {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (win) {
      setPosition();
    }
  });
} else {
  app.quit();
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 600,
    height: 420,
    minWidth: 240,
    minHeight: 320,
    type: "toolbar",
    frame: false,
    title: pkg.name,
    //resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    closable: false,
    //show: false,
    transparent: true,
    alwaysOnTop: true,
    useContentSize: true,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION, 
      devTools:true,//是否开启DevTools
      webSecurity:false//是否禁用同源策略，上线需要删除
    },
  });

  setPosition();

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    // if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
    autoUpdater.checkForUpdatesAndNotify();
  }

  // win.once("ready-to-show", () => {
  //   win.show();
  // });

  win.on("closed", () => {
    win = null;
  });
}

//闪烁问题
app.commandLine.appendSwitch("wm-window-animations-disabled");

//跨域
app.commandLine.appendSwitch("disable-features","OutOfBlinkCors");

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) init();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  // if (isDevelopment && !process.env.IS_TEST) {
  //   // Install Vue Devtools
  //   try {
  //     await installExtension(VUEJS_DEVTOOLS);
  //   } catch (e) {
  //     console.error("Vue Devtools failed to install:", e.toString());
  //   }
  // }

  init();
});

app.on('will-quit',async ()=>{
  // 清空所有快捷键
  unregisterAllHotKey();
  app.exit();
});

function init() {
  createWindow();
  initExtra();
  createTray(showWindow);
  registerHotKey(win);
}

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

function setPosition() {
  const size = screen.getPrimaryDisplay().workAreaSize;
  const winSize = win.getSize();
  win.setPosition(size.width - winSize[0] - 30, 30);
}

function showWindow() {
  if (!win.isVisible()) win.show();
}

ipcMain.handle("setIgnoreMouseEvents", (event, ignore) => {
  if (ignore) win.setIgnoreMouseEvents(true, { forward: true });
  else win.setIgnoreMouseEvents(false);
});

ipcMain.handle("hideWindow", (event) => {
  win.hide();
});

ipcMain.handle("handleClose", (event) => {
  console.log('colose win ');
  win=null;
  app.exit(); 
});
