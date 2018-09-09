import { homedir } from 'os'
import { decode, encode } from 'dat-encoding'
import Cabal from 'cabal-core'
import catnames from 'cat-names'
import collect from 'collect-stream'
import del from 'del'
import fs from 'fs'
import path from 'path'
import promisify from 'util-promisify'
import Swarm from 'cabal-core/swarm'

import commander from './commander'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

const DEFAULT_CHANNEL = 'default'

var cabals = {}

export const viewCabal = ({addr}) => dispatch => {
  var cabal = cabals[addr]
  if (cabal) {
    dispatch({type: 'VIEW_CABAL', addr})
    storeOnDisk()
  }
}

export const cancelDeleteCabal = () => ({ type: 'DIALOGS_DELETE_CLOSE' })
export const deleteCabal = addr => ({ type: 'DIALOGS_DELETE_OPEN', addr })
export const confirmDeleteCabal = addr => dispatch => {
  const { cabal } = cabals[addr]

  if (cabal.client.swarm) {
    for (const con of cabal.client.swarm.connections) {
      con.removeAllListeners()
    }
  }
  delete cabals[addr]
  storeOnDisk()
  dispatch({ type: 'DELETE_CABAL', addr })
  dispatch({ type: 'DIALOGS_DELETE_CLOSE' })
}

export const onCommand = ({addr, message}) => dispatch => {
  var cabal = cabals[addr]
  dispatch(commander(cabal, message))
}

export const updateCabal = (opts) => dispatch => {
  var cabal = cabals[opts.addr]
  cabal[opts.addr] = {
    ...cabal,
    ...opts
  }
  storeOnDisk()
  dispatch({type: 'UPDATE_CABAL', ...opts})
}
export const joinChannel = ({addr, channel}) => dispatch => {
  if (channel.length > 0) {
    dispatch(viewChannel({addr, channel}))
  }
}

export const leaveChannel = ({addr, channel}) => dispatch => {
  if (channel.length > 0) {
    // var currentCabal = cabals[addr]
    // currentCabal.leaveChannel(channel)
    // dispatch({type: 'UPDATE_CABAL', addr, channels: currentCabal.channels})
  }
}

export const changeUsername = ({addr, username}) => dispatch => {
  var currentCabal = cabals[addr]
  currentCabal.username = username
  currentCabal.publishNick(username)
  dispatch({ type: 'UPDATE_CABAL', addr, username })
}

export const getMessages = ({addr, channel, count}) => dispatch => {
  if (channel.length === 0) return
  var cabal = cabals[addr]
  let rs = cabal.messages.read(channel, {limit: count, lt: '~'})
  collect(rs, (err, msgs) => {
    if (err) return
    msgs.reverse()
    cabal.client.channelMessages[channel] = []
    msgs.forEach((msg) => {
      let author = cabal.client.users[msg.key].name
      let {type, timestamp, content} = msg.value
      cabal.client.channelMessages[channel].push({
        author,
        content: content.text,
        key: msg.key + timestamp,
        time: timestamp,
        type
      })
    })
    dispatch({type: 'UPDATE_CABAL', addr, messages: cabal.client.channelMessages[channel]})
  })
}

export const viewChannel = ({addr, channel}) => dispatch => {
  if (channel.length === 0) return
  var cabal = cabals[addr]
  cabal.client.channel = channel
  cabal.client.channelMessagesUnread[channel] = 0
  storeOnDisk()

  // dont pass around swarm and watcher, only the things that matter.
  dispatch({type: 'ADD_CABAL',
    addr,
    messages: cabal.client.channelMessages[channel],
    username: cabal.username,
    users: cabal.client.users,
    channel: cabal.client.channel,
    channels: cabal.client.channels
  })
  dispatch({type: 'VIEW_CABAL',
    addr,
    channel: cabal.client.channel
  })
  dispatch(getMessages({addr, channel, count: 100}))
}

export const changeScreen = ({screen}) => ({ type: 'CHANGE_SCREEN', screen })

export const addCabal = ({addr, input, username}) => dispatch => {
  if (!addr) {
    try {
      var key = decode(input)
      addr = encode(key)
    } catch (err) {
    }
  }
  if (cabals[addr]) return console.error('cabal already exists')
  if (addr) {
    // Load existing Cabal
    initializeCabal({addr, username, dispatch})
  } else {
    // Create new Cabal
    var tempDir = path.join(homedir(), '.cabal-desktop/.tmp')
    var newCabal = Cabal(tempDir, null, {username})
    newCabal.getLocalKey((err, key) => {
      initializeCabal({addr: key, username, dispatch})
      del(tempDir, {force: true})
    })
  }
}

const initializeCabal = ({addr, username, dispatch}) => {
  username = username || 'conspirator'
  var dir = path.join(homedir(), '.cabal-desktop', addr)
  var cabal = Cabal(dir, addr ? 'cabal://' + addr : null, {username})

  // Add an object to place client data onto the
  // Cabal instance to keep the client somewhat organized
  // and distinct from the class funcationality.
  cabal.client = {}

  cabal.db.ready(function (err) {
    if (err) return console.error(err)
    cabal.key = addr
    var swarm = Swarm(cabal)

    cabal.username = username
    cabal.client.swarm = swarm
    cabal.client.addr = addr
    cabal.client.channel = DEFAULT_CHANNEL
    cabal.client.channels = []
    cabal.client.user = {name: username}
    cabal.client.users = {}
    cabal.client.channelMessages = {}
    cabal.client.channelMessagesUnread = {}
    cabal.client.channelListeners = {}

    const onMessage = (message) => {
      let {type, timestamp, content} = message.value
      let channel = content.channel
      if (cabal.client.users[message.key]) {
        let author = cabal.client.users[message.key].name
        if (!cabal.client.channelMessages[channel]) {
          cabal.client.channelMessages[channel] = []
        }
        cabal.client.channelMessages[channel].push({
          author,
          content: content.text,
          key: message.key + timestamp,
          time: timestamp,
          type
        })
        if (!document.hasFocus()) {
          window.Notification.requestPermission()
          new window.Notification(author, {
            body: content.text
          })
        }
      }
      if (cabal.client.channel === channel) {
        dispatch({type: 'UPDATE_CABAL', addr, messages: cabal.client.channelMessages[channel]})
      } else {
        if (!cabal.client.channelMessagesUnread[channel]) {
          cabal.client.channelMessagesUnread[channel] = 1
        } else {
          cabal.client.channelMessagesUnread[channel] = cabal.client.channelMessagesUnread[channel] + 1
        }
        dispatch({type: 'UPDATE_CABAL', addr, channelMessagesUnread: cabal.client.channelMessagesUnread})
      }
    }

    cabal.channels.events.on('add', (channel) => {
      if (!cabal.client.channels.includes(channel)) {
        cabal.client.channels.push(channel)
        if (!cabal.client.channelListeners[channel]) {
          cabal.messages.events.on(channel, onMessage)
          cabal.client.channelListeners[channel] = onMessage
        }
      }
    })
    cabal.channels.get((err, channels) => {
      if (err) return console.error(err)
      cabal.client.channels = channels
      if (cabal.client.channels.length === 0) {
        cabal.client.channels.push(DEFAULT_CHANNEL)
      }
      dispatch(joinChannel({addr, channel: DEFAULT_CHANNEL}))
      cabal.client.channels.forEach((channel) => {
        if (!cabal.client.channelListeners[channel]) {
          cabal.messages.events.on(channel, onMessage)
          cabal.client.channelListeners[channel] = onMessage
        }
      })
    })

    cabal.users.getAll((err, users) => {
      if (err) return
      cabal.client.users = users
      const updateLocalKey = () => {
        cabal.getLocalKey((err, lkey) => {
          if (err) return
          if (!Object.keys(cabal.client.users).includes(lkey)) {
            cabal.client.users[lkey] = {
              local: true,
              online: true,
              key: lkey,
              name: cabal.client.user.name || 'conspirator'
            }
          }
          Object.keys(cabal.client.users).forEach((key) => {
            if (key === lkey) {
              cabal.client.user = cabal.client.users[key]
              cabal.client.user.local = true
              cabal.client.user.online = true
              cabal.client.user.key = key
              cabal.username = cabal.client.user.name
              cabal.publishNick(cabal.username)
            }
          })
          dispatch({type: 'UPDATE_CABAL', addr, users: cabal.client.users, username: cabal.username})
        })
      }
      updateLocalKey()

      cabal.users.events.on('update', (key) => {
        // TODO: rate-limit
        cabal.users.get(key, (err, user) => {
          if (err) return
          cabal.client.users[key] = Object.assign(cabal.client.users[key] || {}, user)
          if (cabal.client.user && key === cabal.client.user.key) cabal.client.user = cabal.client.users[key]
          if (!cabal.client.user) updateLocalKey()
          dispatch({type: 'UPDATE_CABAL', addr, users: cabal.client.users})
        })
      })
      cabal.on('peer-added', (key) => {
        var found = false
        Object.keys(cabal.client.users).forEach((k) => {
          if (k === key) {
            cabal.client.users[k].online = true
            found = true
          }
        })
        if (!found) {
          cabal.client.users[key] = {
            key: key,
            online: true
          }
        }
        dispatch({type: 'UPDATE_CABAL', addr, users: cabal.client.users})
      })
      cabal.on('peer-dropped', (key) => {
        Object.keys(cabal.client.users).forEach((k) => {
          if (k === key) {
            cabal.client.users[k].online = false
            dispatch({type: 'UPDATE_CABAL', addr, users: cabal.client.users})
          }
        })
      })
    })

    cabals[addr] = cabal
  })
}

export const addMessage = ({ message, addr }) => dispatch => {
  var cabal = cabals[addr]
  cabal.publish(message)
}

export const loadFromDisk = () => async dispatch => {
  var blob
  try {
    await mkdir(`${homedir()}/.cabal-desktop`)
  } catch (_) {}

  try {
    blob = await readFile(`${homedir()}/.cabal-desktop/cabals.json`, 'utf8')
  } catch (_) {
    blob = '{}'
  }

  const pastcabals = JSON.parse(blob)
  const cabalkeys = Object.keys(pastcabals)

  for (const key of cabalkeys) {
    const opts = JSON.parse(pastcabals[key])
    dispatch(addCabal(opts))
  }
  dispatch({type: 'CHANGE_SCREEN', screen: cabalkeys.length ? 'main' : 'addCabal'})
}

const storeOnDisk = async () => {
  const dir = `${homedir()}/.cabal-desktop`
  const cabalsState = Object.keys(cabals).reduce(
    (acc, addr) => ({
      ...acc,
      [addr]: JSON.stringify({
        username: cabals[addr].username || 'conspirator',
        addr: cabals[addr].client.addr
      })
    }),
    {}
  )
  await writeFile(`${dir}/cabals.json`, JSON.stringify(cabalsState))
}
