const { autoUpdater } = require('electron-updater')

class AutoUpdater {
  constructor () {
    this.interval = false
  }

  start () {
    const FOUR_HOURS = 60 * 60 * 1000
    try {
      this.interval = setInterval(() => autoUpdater.checkForUpdatesAndNotify(), FOUR_HOURS)
      autoUpdater.checkForUpdatesAndNotify()
    } catch (err) {
      // If offline, the auto updater will throw an error.
      console.error(err)
    }
  }

  stop () {
    clearInterval(this.interval)
  }
}

module.exports = AutoUpdater
