import { homedir } from 'os'
import strftime from 'strftime'
import { decode, encode } from 'dat-encoding'
import Swarm from 'cabal-node/swarm'
import Cabal from 'cabal-node'
import catnames from 'cat-names'
import path from 'path'
import promisify from 'util-promisify'
import fs from 'fs'

import commander from './commander'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

var cabals = {}
var stream = null

export const viewCabal = ({addr}) => dispatch => {
  var cabal = cabals[addr]
  if (cabal) {
    dispatch({type: 'VIEW_CABAL', addr})
    //storeOnDisk()
  }
}

export const cancelDeleteCabal = () => ({ type: 'DIALOGS_DELETE_CLOSE' })
export const deleteCabal = addr => ({ type: 'DIALOGS_DELETE_OPEN', addr })
export const confirmDeleteCabal = addr => dispatch => {
  const { cabal } = cabals[addr]

  if (cabal.swarm) {
    for (const con of cabal.swarm.connections) {
      con.removeAllListeners()
    }
  }
  // obj.cabal.db.close()
  delete cabals[addr]
  //storeOnDisk()
  dispatch({ type: 'DELETE_CABAL', addr })
  dispatch({ type: 'DIALOGS_DELETE_CLOSE' })
}

export const onCommand = ({addr, message}) => dispatch => {
  var cabal = cabals[addr]
  dispatch(commander(cabal, message))
}

export const joinChannel = ({addr, channel}) => dispatch => {
  if (channel.length > 0) {
    var cabal = cabals[addr]
    cabal.joinChannel(channel)
    dispatch(viewChannel({addr, channel}))
  }
}

export const leaveChannel = ({addr, channel}) => dispatch => {
  if (channel.length > 0) {
    var currentCabal = cabals[addr]
    currentCabal.leaveChannel(channel)
    dispatch({type: 'UPDATE_CABAL', addr, channels: currentCabal.channels})
  }
}

export const changeUsername = ({addr, username}) => dispatch => {
  var currentCabal = cabals[addr]
  var existingUsername = currentCabal.username
  currentCabal.username = username
  delete currentCabal.users[existingUsername]
  dispatch({ type: 'UPDATE_CABAL', addr, username })
}

export const getMessages = ({addr, channel, count}) => dispatch => {
  if (channel.length === 0) return
  var cabal = cabals[addr]
  if (!cabal.messages) cabal.messages = []
  cabal.getMessages(channel, count, onMessages)

  function onMessages (err, rows) {
    if (err) return console.trace(err)
    rows.map((arr) => {
      arr.map((row) => {
        if (!document.hasFocus()) {
          window.Notification.requestPermission()
          new window.Notification(row.value.author, {
            body: row.value.content
          })
        }
        cabal.messages.push({
          type: row.value.type,
          time: strftime('%H:%M', new Date(row.value.time)),
          author: row.value.author,
          content: row.value.content
        })
      })
    })
    dispatch({type: 'UPDATE_CABAL', addr, messages: cabal.messages})
  }
}

export const viewChannel = ({addr, channel}) => dispatch => {
  if (channel.length === 0) return
  var cabal = cabals[addr]
  cabal.channel = channel
  cabal.messages = []
  if (cabal.watcher) cabal.watcher.destroy()
  //storeOnDisk()
  cabal.on('join', function (username) {
    dispatch({type: 'UPDATE_CABAL', addr, users: cabal.users})
  })
  cabal.on('leave', function (username) {
    dispatch({type: 'UPDATE_CABAL', addr, users: cabal.users})
  })
  // dont pass around swarm and watcher, only the things that matter.
  dispatch({type: 'ADD_CABAL',
    addr,
    messages: cabal.messages,
    username: cabal.username,
    users: cabal.users,
    channel: cabal.channel,
    channels: cabal.channels
  })
  dispatch({type: 'VIEW_CABAL', addr})
  dispatch(getMessages({addr, channel, count: 25}))
  cabal.watcher = cabal.watch(channel, () => {
    dispatch(getMessages({addr, channel, count: 1}))
  })
}

export const showAddCabal = () => ({ type: 'SHOW_ADD_CABAL' })
export const hideAddCabal = () => ({ type: 'HIDE_ADD_CABAL' })
export const addCabal = ({input, username}) => dispatch => {
  try {
    var key = decode(input)
    var addr = encode(key)
  } catch (err) {
  }
  username = username || catnames.random()

  if (cabals[addr]) return console.error('cabal already exists')
  var dir = path.join(homedir(), '.cabal-desktop', addr || username)
  var cabal = Cabal(dir, addr ? 'cabal://' + addr : null, {username})
  cabal.db.ready(function (err) {
    if (err) return console.error(err)
    if (!addr) addr = cabal.db.key.toString('hex')
    var swarm = Swarm(cabal)
    cabal.swarm = swarm
    cabal.addr = addr
    cabals[addr] = cabal
    cabal.getChannels((err, channels) => {
      if (err) return console.error(err)
      cabal.channels = channels
      dispatch(joinChannel({addr, channel: 'default'}))
    })
  })
}

export const addMessage = ({ message, addr }) => dispatch => {
  var cabal = cabals[addr]
  cabal.message(cabal.channel, message, function (err) {
    if (err) console.log(err)
  })
}

export const loadFromDisk = () => async dispatch => {
  var blob
  try {
    await mkdir(`${homedir()}/.cabal-desktop`)
  } catch (_) {}

  try {
    blob = await readFile(`${homedir()}/.cabal-desktop/cabals.json`, 'utf8')
  } catch (_) {
    return
  }

  const pastcabals = JSON.parse(blob)

  for (const key of Object.keys(pastcabals)) {
    const opts = JSON.parse(pastcabals[key])
    addCabal(opts)(dispatch)
  }
}

const storeOnDisk = async () => {
  const dir = `${homedir()}/.cabal-desktop`
  const cabalsState = Object.keys(cabals).reduce(
    (acc, key) => ({
      ...acc,
      [key]: JSON.stringify({
        username: cabals[key].username,
        addr: cabals[key].addr
      })
    }),
    {}
  )
  await writeFile(`${dir}/cabals.json`, JSON.stringify(cabalsState))
}
