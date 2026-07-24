import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { createAccount } from '../../worker/features/initializeApp/createAccount.js';

// Disable Electron sandbox to prevent SUID sandbox errors on Linux/VM environments
app.commandLine.appendSwitch('no-sandbox');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let profilesDir = '';

async function createWindow() {
  profilesDir = path.join(app.getPath('userData'), 'profiles');
  await fs.mkdir(profilesDir, { recursive: true });

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    title: 'People Connect',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (validatedURL.startsWith('http://localhost:5173')) {
        console.log('Vite server not ready, retrying in 1000ms...');
        setTimeout(() => {
          if (mainWindow) mainWindow.loadURL('http://localhost:5173');
        }, 1000);
      }
    });
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../ui/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Duplex IPC communication bridge (Request-Response)
ipcMain.handle('request', async (event, action, payload) => {
  try {
    switch (action) {
      case 'GET_PROFILES': {
        const profiles = [];
        try {
          const files = await fs.readdir(profilesDir);
          for (const file of files) {
            if (file.endsWith('.json') && file !== 'active.json') {
              const content = await fs.readFile(path.join(profilesDir, file), 'utf-8');
              const data = JSON.parse(content);
              profiles.push({
                name: data.name,
                publicKey: data.publicKey,
              });
            }
          }
        } catch (err) {
          // profiles dir doesn't exist yet or is empty
        }
        return { success: true, profiles };
      }

      case 'CREATE_PROFILE': {
        const { name } = payload;
        if (!name || name.trim() === '') {
          return { success: false, error: 'Name is required' };
        }
        
        const safeName = name.trim();
        const filename = safeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const profilePath = path.join(profilesDir, `${filename}.json`);
        
        try {
          await fs.access(profilePath);
          return { success: false, error: 'Profile with this name already exists' };
        } catch (e) {
          // File does not exist, so it's safe to proceed
        }

        const account = createAccount(); // { mnemonic, publicKey, privateKey }
        const profileData = {
          name: safeName,
          mnemonic: account.mnemonic,
          publicKey: account.publicKey,
          privateKey: account.privateKey,
          createdAt: Date.now()
        };

        await fs.writeFile(profilePath, JSON.stringify(profileData, null, 2));
        
        // Save as active profile
        const activePath = path.join(profilesDir, 'active.json');
        await fs.writeFile(activePath, JSON.stringify({ filename }, null, 2));

        return { 
          success: true, 
          profile: { 
            name: safeName, 
            publicKey: account.publicKey, 
            mnemonic: account.mnemonic 
          } 
        };
      }

      case 'LOGIN_PROFILE': {
        const { name } = payload;
        const filename = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const profilePath = path.join(profilesDir, `${filename}.json`);
        
        try {
          const content = await fs.readFile(profilePath, 'utf-8');
          const data = JSON.parse(content);
          
          // Save as active profile
          const activePath = path.join(profilesDir, 'active.json');
          await fs.writeFile(activePath, JSON.stringify({ filename }, null, 2));

          return { 
            success: true, 
            profile: { 
              name: data.name, 
              publicKey: data.publicKey, 
              mnemonic: data.mnemonic 
            } 
          };
        } catch (err) {
          return { success: false, error: 'Profile not found or failed to load' };
        }
      }

      case 'GET_ACTIVE_PROFILE': {
        try {
          const activePath = path.join(profilesDir, 'active.json');
          const activeContent = await fs.readFile(activePath, 'utf-8');
          const { filename } = JSON.parse(activeContent);
          
          const profilePath = path.join(profilesDir, `${filename}.json`);
          const content = await fs.readFile(profilePath, 'utf-8');
          const data = JSON.parse(content);
          
          return { 
            success: true, 
            profile: { 
              name: data.name, 
              publicKey: data.publicKey, 
              mnemonic: data.mnemonic 
            } 
          };
        } catch (err) {
          return { success: true, profile: null }; // no active profile
        }
      }

      case 'LOGOUT': {
        try {
          const activePath = path.join(profilesDir, 'active.json');
          await fs.unlink(activePath);
        } catch (err) {}
        return { success: true };
      }

      case 'DELETE_PROFILE': {
        const { name } = payload;
        const filename = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const profilePath = path.join(profilesDir, `${filename}.json`);
        
        try {
          await fs.unlink(profilePath);
          
          // If deleted profile was active, clear active
          const activePath = path.join(profilesDir, 'active.json');
          try {
            const activeContent = await fs.readFile(activePath, 'utf-8');
            const activeData = JSON.parse(activeContent);
            if (activeData.filename === filename) {
              await fs.unlink(activePath);
            }
          } catch (e) {}
          
          return { success: true };
        } catch (err) {
          return { success: false, error: 'Failed to delete profile' };
        }
      }

      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  } catch (error) {
    console.error('IPC request error:', error);
    return { success: false, error: error.message };
  }
});
