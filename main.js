const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const net = require("net");

// Simple JSON file store (replaces electron-store to avoid ESM issues)
class SimpleStore {
  constructor() {
    this.filePath = path.join(app.getPath("userData"), "config.json");
    this.data = {};
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        this.data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      }
    } catch {
      this.data = {};
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error("Failed to save config:", err);
    }
  }
}

let store;
let mainWindow;
let serverProcess;
let serverPort = 3000;

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function startNextServer() {
  serverPort = await findAvailablePort(3000);

  const apiKey = store.get("apiKey") || "";
  const env = {
    ...process.env,
    PORT: String(serverPort),
    ANTHROPIC_API_KEY: apiKey,
  };

  const isPacked = app.isPackaged;
  let serverDir;
  let command;
  let args;

  if (isPacked) {
    // Production: use standalone server
    serverDir = path.join(process.resourcesPath, "standalone");

    // Find node.exe
    command = "node.exe";
    const nodePaths = [
      "C:\\Program Files\\nodejs\\node.exe",
      path.join(process.env.LOCALAPPDATA || "", "Programs\\nodejs\\node.exe"),
      path.join(process.resourcesPath, "node.exe"),
    ];

    for (const nodePath of nodePaths) {
      try {
        fs.accessSync(nodePath);
        command = nodePath;
        break;
      } catch {}
    }

    args = [path.join(serverDir, "server.js")];
  } else {
    // Development: use next dev
    serverDir = __dirname;
    command = "npx.cmd";
    args = ["next", "dev", "--port", String(serverPort)];
  }

  console.log(`Starting server on port ${serverPort}...`);
  console.log(`Command: ${command} ${args.join(" ")}`);
  console.log(`Working dir: ${serverDir}`);

  serverProcess = spawn(command, args, {
    cwd: serverDir,
    env,
    stdio: "pipe",
    shell: true,
  });

  serverProcess.stdout.on("data", (data) => {
    console.log(`[Next.js] ${data.toString()}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`[Next.js] ${data.toString()}`);
  });

  serverProcess.on("error", (err) => {
    console.error("Failed to start server:", err);
  });

  // Wait for server to be ready
  await waitForServer(serverPort, 60000);
}

function waitForServer(port, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function tryConnect() {
      if (Date.now() - startTime > timeout) {
        reject(new Error("Server startup timeout"));
        return;
      }

      const client = net.createConnection({ port, host: "127.0.0.1" }, () => {
        client.end();
        resolve();
      });

      client.on("error", () => {
        setTimeout(tryConnect, 500);
      });
    }

    tryConnect();
  });
}

function createWindow() {
  const preloadPath = app.isPackaged
    ? path.join(app.getAppPath(), "preload.js")
    : path.join(__dirname, "preload.js");

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "상품페이지 빌더",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    show: false,
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  // Initialize store after app is ready (userData path available)
  store = new SimpleStore();

  // IPC handlers
  ipcMain.handle("get-api-key", () => {
    return store.get("apiKey") || "";
  });

  ipcMain.handle("set-api-key", (event, key) => {
    store.set("apiKey", key);
    // Restart server with new key
    if (serverProcess) {
      serverProcess.kill();
      startNextServer().catch(console.error);
    }
    return true;
  });

  ipcMain.handle("has-api-key", () => {
    const key = store.get("apiKey");
    return !!(key && key.length > 0);
  });

  try {
    const hasKey = store.get("apiKey") && store.get("apiKey").length > 0;

    if (!hasKey) {
      await dialog.showMessageBox({
        type: "question",
        title: "API 키 설정",
        message: "Anthropic API 키를 입력해주세요.",
        detail:
          "상품페이지 빌더를 사용하려면 Anthropic API 키가 필요합니다.\n확인을 누른 후 우측 상단의 API 키 버튼에서 입력해주세요.",
        buttons: ["확인"],
      });
    }

    await startNextServer();
    createWindow();
  } catch (error) {
    console.error("Failed to start:", error);
    dialog.showErrorBox(
      "시작 실패",
      `서버를 시작하지 못했습니다.\n${error.message}`
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
