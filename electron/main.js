const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const fs = require('fs')
const PearRuntime = require('pear-runtime') // spawn Bare workers from Node

const topic = crypto
  .createHash('sha256')
  .update('pear-getting-started-chat:' + os.userInfo().username)
  .digest('hex')

const storePath = path.join(app.getPath('userData'), 'profile.json')
let worker = null

ipcMain.handle('store:getProfile', () => {
  try {
    return JSON.parse(fs.readFileSync(storePath, 'utf8'))
  } catch (err) {
    return null
  }
})

ipcMain.handle('store:setProfile', (_evt, profile) => {
  fs.writeFileSync(storePath, JSON.stringify(profile))
})

ipcMain.handle('chat:start', (_evt, opts) => {
  if (worker) return
  const { seedHex, name } = opts
  const workerPath = path.join(__dirname, '..', 'workers', 'main.mjs')
  worker = PearRuntime.run(workerPath, [topic, seedHex, name])

  worker.on('data', (data) => {
    BrowserWindow.getAllWindows().forEach(w => {
      if (!w.isDestroyed()) w.webContents.send('chat:from-worker', data.toString())
    })
  })

  worker.stderr.on('data', (data) => {
    console.error('[worker]', data.toString())
  })
})

ipcMain.handle('chat:send', (_evt, text) => {
  if (worker) worker.write(Buffer.from(text))
})

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (worker) worker.destroy()
  app.quit()
})
