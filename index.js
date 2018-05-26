'use strict'
const { app, BrowserWindow, shell, Menu } = require('electron')
const defaultMenu = require('electron-default-menu')

const menu = defaultMenu(app, shell)

let win

app.on('ready', () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 640,
    minHeight: 395
  })
  win.loadURL(`file://${__dirname}/index.html`)
  if (process.env.DEBUG) win.webContents.openDevTools()
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
})

app.on('window-all-closed', () => app.quit())

const quit = app.makeSingleInstance(() => {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.focus()
})

if (quit) app.quit()
