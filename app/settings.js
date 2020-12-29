const Store = require('electron-store')

const store = new Store({ name: 'cabal-desktop-settings' })
const store_defaults = {
  'auto-update': true
}

for (var key in store_defaults) {
  if (store.get(key) === undefined) store.set(key, store_defaults[key])
}

module.exports = store
