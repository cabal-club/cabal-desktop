'use strict'

const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const windowStateKeeper = require('electron-window-state')
const os = require('os')
const path = require('path')
const settings = require('./app/settings')
const AutoUpdater = require('./app/updater')
const platform = require('./app/platform')

const updater = new AutoUpdater()

// the window object
let win

if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  })
}

const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
      {
        label: 'Night Mode',
        type: 'checkbox',
        checked: settings.get('darkMode'),
        click (menuItem) { settings.set('darkMode', menuItem.checked); win.webContents.send('darkMode', menuItem.checked) }
      }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('https://cabal.chat/') }
      },
      {
        label: 'Report Issue',
        click () { require('electron').shell.openExternal('https://github.com/cabal-club/cabal-desktop/issues/new') }
      },
      {
        label: 'Automatically Check for Updates',
        type: 'checkbox',
        checked: settings.get('auto-update'),
        click (menuItem) {
          settings.set('auto-update', menuItem.checked)
          menuItem.checked ? updater.start() : updater.stop()
        }
      }
    ]
  }
]

if (platform.mac) {
  template.unshift({
    label: 'Cabal',
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services', submenu: [] },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  })

  // Edit menu
  template[1].submenu.push(
    { type: 'separator' },
    {
      label: 'Speech',
      submenu: [
        { role: 'startspeaking' },
        { role: 'stopspeaking' }
      ]
    }
  )

  // Window menu
  template[3].submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    { role: 'front' }
  ]
}

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

app.requestSingleInstanceLock()
app.on('second-instance', (event, argv, cwd) => {
  app.quit()
})

app.setAsDefaultProtocolClient('cabal')

app.on('ready', () => {
  updater.start()
  const mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600
  })

  let windowOptions = {
    backgroundColor: '#1e1e1e',
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    titleBarStyle: 'default',
    title: 'Cabal Desktop ' + app.getVersion(),
    webPreferences: {
      nodeIntegration: true
    }
  }

  if(platform.mac){
    windowOptions.titleBarStyle = 'hiddenInset';
  }

  win = new BrowserWindow(windowOptions)
  mainWindowState.manage(win)

  win.loadURL('file://' + path.join(__dirname, 'index.html'))
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))

  win.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })

  // Protocol handler for osx
  app.on('open-url', (event, url) => {
    event.preventDefault()
    win.webContents.send('open-cabal-url', { url })
  })

  ipcMain.on('update-badge', (event, { badgeCount, showCount }) => {
    if (platform.mac) {
      const badge = showCount ? badgeCount : '•'
      app.dock.setBadge(badgeCount > 0 ? ('' + badge) : '')
    } else {
      app.setBadgeCount(badgeCount)
    }
  })

  win.on('close', event => {
    if (!app.quitting) {
      event.preventDefault()
      win.hide()
    }
    if (!platform.mac) {
      app.quit()
    }
  })

  app.on('activate', () => {
    win.show()
  })
})

app.on('window-all-closed', () => {
  if (!platform.mac) {
    app.quit()
  }
})

app.on('before-quit', () => {
  app.quitting = true
})
