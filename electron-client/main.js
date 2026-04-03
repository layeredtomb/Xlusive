const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')

// Replace this with your exact Vercel URL
// Ensure you include https://
const APP_URL = 'https://xlusive.vercel.app' 

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#05030f', // Matches your Galaxy Theme
    show: false, // Don't show until ready to prevent white flashing
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // SCARED MODE IPC HANDLERS
  ipcMain.on('start-scare', () => {
    mainWindow.setFullScreen(true)
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.setSkipTaskbar(true)
  })

  ipcMain.on('stop-scare', () => {
    mainWindow.setFullScreen(false)
    mainWindow.setAlwaysOnTop(false)
    mainWindow.setSkipTaskbar(false)
  })

  // Optional: Remove the top menu bar for a cleaner "app" look
  Menu.setApplicationMenu(null)

  mainWindow.loadURL(APP_URL)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // If you ever want to open developer tools for debugging, uncomment this:
  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
