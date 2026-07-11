import { BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createMainWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    backgroundColor: "#1a1a1a",
    webPreferences: {
      // Attach our bridge securely
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
    },
  });

  win.loadURL("http://localhost:5173");
  return win;
};

export default createMainWindow;
