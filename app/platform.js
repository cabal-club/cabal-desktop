function isMac () {
    if (typeof window === 'undefined'){
        const process = require('process')
        return process.platform === 'darwin'
    } else {
        return window.navigator.platform.toLowerCase().indexOf('mac') >= 0
    }
}

var platform = {
    mac: isMac()
}

module.exports = platform