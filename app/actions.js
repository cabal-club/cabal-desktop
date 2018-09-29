import { homedir } from 'os'
import { decode, encode } from 'dat-encoding'
import Cabal from 'cabal-core'
import catnames from 'cat-names'
import collect from 'collect-stream'
import del from 'del'
import fs from 'fs'
import path from 'path'
import Swarm from 'cabal-core/swarm'
import commander from './commander'

const {
  readFile,
  writeFile,
  readdir,
  mkdir
} = fs.promises

const DEFAULT_CHANNEL = 'default'
const HOME_DIR = homedir()
const DATA_DIR = path.join(HOME_DIR, '.cabal-desktop')
const TEMP_DIR = path.join(DATA_DIR, '.tmp')
const STATE_FILE = path.join(DATA_DIR, 'cabals.json')
const DEFAULT_USERNAME = 'conspirator'
const NOOP = function () {}

const cabals = {}

export const viewCabal = ({addr}) => dispatch => {
  const cabal = cabals[addr]
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
  dispatch(commander(cabals[addr], message))
}

export const updateCabal = (opts) => dispatch => {
  const cabal = cabals[opts.addr]
  cabal[opts.addr] = {
    ...cabal,
    ...opts
  }
  storeOnDisk()
  dispatch({type: 'UPDATE_CABAL', ...opts})
}
export const joinChannel = ({addr, channel}) => dispatch => {
  if (channel.length > 0) {
    dispatch(addChannel({addr, channel}))
    dispatch(viewChannel({addr, channel}))
  }
}

export const leaveChannel = ({addr, channel}) => dispatch => {
  if (channel.length > 0) {
    // TODO
    // var currentCabal = cabals[addr]
    // currentCabal.leaveChannel(channel)
    // dispatch({type: 'UPDATE_CABAL', addr, channels: currentCabal.channels})
  }
}

export const changeUsername = ({addr, username}) => dispatch => {
  const currentCabal = cabals[addr]
  currentCabal.username = username
  currentCabal.publishNick(username)
  dispatch({ type: 'UPDATE_CABAL', addr, username })
}

export const getMessages = ({addr, channel, count}) => dispatch => {
  if (channel.length === 0) return
  const cabal = cabals[addr]
  const rs = cabal.messages.read(channel, {limit: count, lt: '~'})
  collect(rs, (err, msgs) => {
    if (err) return
    msgs.reverse()
    cabal.client.channelMessages[channel] = []
    msgs.forEach((msg) => {
      const author = cabal.client.users[msg.key] ? cabal.client.users[msg.key].name : DEFAULT_USERNAME
      const {type, timestamp, content} = msg.value
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
  const cabal = cabals[addr]
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

export const changeScreen = ({screen, addr}) => ({ type: 'CHANGE_SCREEN', screen, addr })

export const addCabal = ({addr, input, username}) => dispatch => {
  if (!addr) {
    try {
      const key = decode(input)
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
    const newCabal = Cabal(TEMP_DIR, null, {username})
    newCabal.getLocalKey((err, key) => {
      initializeCabal({addr: key, username, dispatch})
      del(TEMP_DIR, {force: true})
    })
  }
}

export const addChannel = ({addr, channel}) => dispatch => {
  const cabal = cabals[addr]
  const onMessage = (message) => {
    const {type, timestamp, content} = message.value
    const channel = content.channel
    if (cabal.client.users[message.key]) {
      const author = cabal.client.users[message.key] ? cabal.client.users[message.key].name : DEFAULT_USERNAME
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
  if (!cabal.client.channels.includes(channel)) {
    cabal.client.channels.push(channel)
    if (!cabal.client.channelListeners[channel]) {
      cabal.messages.events.on(channel, onMessage)
      cabal.client.channelListeners[channel] = onMessage
    }
  }
}

export const addMessage = ({ message, addr }) => dispatch => {
  cabals[addr].publish(message)
}

const initializeCabal = ({addr, username, dispatch}) => {
  username = username || DEFAULT_USERNAME
  const dir = path.join(DATA_DIR, addr)
  const cabal = Cabal(dir, addr ? 'cabal://' + addr : null, {username})

  // Add an object to place client data onto the
  // Cabal instance to keep the client somewhat organized
  // and distinct from the class funcationality.
  cabal.client = {}

  cabal.db.ready(function (err) {
    if (err) return console.error(err)
    cabal.key = addr
    const swarm = Swarm(cabal)

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

    cabal.channels.events.on('add', (channel) => {
      dispatch(addChannel({addr, channel}))
    })
    cabal.channels.get((err, channels) => {
      if (err) return console.error(err)
      if (channels.length === 0) {
        channels.push(DEFAULT_CHANNEL)
      }
      channels.forEach((channel) => {
        dispatch(addChannel({addr, channel}))
      })
      dispatch(joinChannel({addr, channel: DEFAULT_CHANNEL}))
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
              name: cabal.client.user.name || DEFAULT_USERNAME
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
          cabal.client.users[key].name = cabal.client.users[key].name || DEFAULT_USERNAME
          if (cabal.client.user && key === cabal.client.user.key) cabal.client.user = cabal.client.users[key]
          if (!cabal.client.user) updateLocalKey()
          dispatch({type: 'UPDATE_CABAL', addr, users: cabal.client.users})
        })
      })
      cabal.on('peer-added', (key) => {
        let found = false
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
  })
  cabals[addr] = cabal
}

async function lskeys () {
  let list
  try {
    list = filterForKeys(await readdir(DATA_DIR))
  } catch (_) {
    list = []
    await mkdir(DATA_DIR)
  }
  return list
}

function encodeStateForKey (key) {
  const username = (cabals[key] && cabals[key].username) || DEFAULT_USERNAME
  return `{"username":"${username}","addr":"${key}"}`
}

async function readstate () {
  let state
  try {
    state = JSON.parse(await readFile(STATE_FILE, 'utf8'))
  } catch (_) {
    state = {}
  }
  const keys = await lskeys()
  let l = keys.length
  while (--l > 0) {
    const key = keys[l]
    if (state[key] === undefined) {
      state[key] = encodeStateForKey(key)
    }
  }
  return state
}

function iterateCabals (state, fn) {
  const statekeys = Object.keys(state)
  for (const key of statekeys) {
    fn(JSON.parse(state[key]))
  }
  return statekeys.length
}

// TODO: consolidate closure pattern
let _dispatch = NOOP
function _dispatch_add_cabal (opts) {
  _dispatch(addCabal(opts))
}

export const loadFromDisk = () => async dispatch => {
  const state = await readstate()
  _dispatch = dispatch
  const cabalsLength = iterateCabals(state, _dispatch_add_cabal)
  dispatch({type: 'CHANGE_SCREEN', screen: cabalsLength ? 'main' : 'addCabal'})
  _dispatch = NOOP
}

const storeOnDisk = async () => {
  const cabalsState = Object.keys(cabals).reduce(
    (acc, addr) => {
      // if (cabals[addr].client.addr !== addr) debugger
      return ({
        ...acc,
        [addr]: encodeStateForKey(addr)
      })
    },
    {}
  )
  await writeFile(STATE_FILE, JSON.stringify(cabalsState))
}

// removes non-key items via unordered insertion & length clamping
// monomorphic, zero closure & arr allocs
// hoisting var declarations to respect v8 deopt edgecases with let & unary ops
function filterForKeys (arr) {
  var l = arr.length
  var last = --l
  while (l > -1) {
    const charcount = arr[l].length
    if (charcount !== 64) {
      if (l !== last) {
        arr[l] = arr[last]
      }
      arr.length = last
      last--
    }
    l--
  }
  return arr
}
