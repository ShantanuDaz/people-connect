const { ipcMain, app } = require('electron')
const path = require('path')
const fs = require('fs')

function setupStoreIpc(cleanupWorker) {
  const storePath = path.join(app.getPath('userData'), 'profile.json')

  ipcMain.handle('store:getProfile', () => {
    try {
      if (fs.existsSync(storePath)) {
        return JSON.parse(fs.readFileSync(storePath, 'utf8'))
      }
      return null
    } catch (err) {
      console.error('Failed to read profile', err)
      return null
    }
  })

  ipcMain.handle('store:setProfile', (_evt, profile) => {
    try {
      if (!profile) {
        if (fs.existsSync(storePath)) {
          fs.unlinkSync(storePath)
        }
      } else {
        fs.writeFileSync(storePath, JSON.stringify(profile))
      }
    } catch (err) {
      console.error('Failed to write profile', err)
    }
  })

  ipcMain.handle('store:resetProfile', async () => {
    try {
      if (cleanupWorker) cleanupWorker()
      
      if (fs.existsSync(storePath)) {
        fs.unlinkSync(storePath)
      }
      
      const dbPath = path.join(app.getPath('userData'), 'hyperbee-data')
      if (fs.existsSync(dbPath)) {
        fs.rmSync(dbPath, { recursive: true, force: true })
      }
      
      return true
    } catch (err) {
      console.error('Failed to reset profile', err)
      return false
    }
  })

  ipcMain.handle('store:clearChatData', async () => {
    try {
      if (cleanupWorker) cleanupWorker()
      
      const dbPath = path.join(app.getPath('userData'), 'hyperbee-data')
      if (fs.existsSync(dbPath)) {
        fs.rmSync(dbPath, { recursive: true, force: true })
      }
      
      return true
    } catch (err) {
      console.error('Failed to clear chat data', err)
      return false
    }
  })
}

module.exports = setupStoreIpc
