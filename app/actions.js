import { homedir } from 'os'
import { decode, encode } from 'dat-encoding'
import { ipcRenderer } from 'electron'
import Client from 'cabal-client'
import fs from 'fs'
import path from 'path'
import moment from 'moment'
import remark from 'remark'
import remarkEmoji from 'remark-emoji'
import remarkReact from 'remark-react'
import commander from './commander'
const { dialog } = require('electron').remote

const DEFAULT_CHANNEL = 'default'
const HOME_DIR = homedir()
const DATA_DIR = path.join(HOME_DIR, '.cabal-desktop', `v${Client.getDatabaseVersion()}`)
const STATE_FILE = path.join(DATA_DIR, 'cabals.json')
const DEFAULT_USERNAME = 'conspirator'
const DEFAULT_PAGE_SIZE = 100
const MAX_FEEDS = 1000

const client = new Client({
  maxFeeds: MAX_FEEDS,
  config: {
    dbdir: DATA_DIR
  }
})

export const viewCabal = ({ addr, channel }) => dispatch => {
  client.focusCabal(addr)
  if (channel) {
    dispatch(viewChannel({ addr, channel }))
  }
  dispatch({ addr, channel, type: 'VIEW_CABAL' })
}

export const showChannelBrowser = ({ addr }) => dispatch => {
  dispatch(hideAllModals())
  dispatch({ type: 'SHOW_CHANNEL_BROWSER', addr })
}

export const showCabalSettings = ({ addr }) => dispatch => {
  dispatch(hideAllModals())
  dispatch({ type: 'SHOW_CABAL_SETTINGS', addr })
}

export const hideCabalSettings = () => dispatch => {
  dispatch({ type: 'HIDE_CABAL_SETTINGS' })
}

export const hideAllModals = () => dispatch => {
  dispatch({ type: 'HIDE_ALL_MODALS' })
}

export const saveCabalSettings = ({ addr, settings }) => dispatch => {
  storeOnDisk()
}

export const removeCabal = ({ addr }) => dispatch => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Cancel', 'Remove'],
    message: `Are you sure you want to remove this cabal (${addr.substr(0, 8)}...) from Cabal Desktop?`
  }, (response) => {
    if (response) {
      dispatch(confirmRemoveCabal({ addr }))
    }
  })
}

export const confirmRemoveCabal = ({ addr }) => dispatch => {
  // TODO
  // const cabal = cabals[addr]
  // if (cabal.client && cabal.client.swarm) {
  //   for (const con of cabal.client.swarm.connections) {
  //     con.removeAllListeners()
  //   }
  // }
  // delete cabals[addr]
  // storeOnDisk()
  // dispatch({ type: 'DELETE_CABAL', addr })

  // var cabalKeys = Object.keys(cabals)
  // if (cabalKeys.length) {
  //   dispatch({
  //     addr: cabalKeys[0],
  //     channel: cabals[cabalKeys[0]].client.channel,
  //     type: 'VIEW_CABAL'
  //   })
  // } else {
  //   dispatch({ type: 'CHANGE_SCREEN', screen: 'addCabal' })
  // }
}

export const onCommand = ({ addr, message }) => dispatch => {
  dispatch(commander(addr, message))
}

export const listCommands = () => dispatch => {
  return dispatch(commander())
}

export const joinChannel = ({ addr, channel }) => dispatch => {
  if (channel.length > 0) {
    const cabalDetails = client.getDetails(addr)
    cabalDetails.joinChannel(channel)
    dispatch(addChannel({ addr, channel }))
    dispatch(viewChannel({ addr, channel }))
  }
}

export const leaveChannel = ({ addr, channel }) => dispatch => {
  if (channel.length > 0) {
    const cabalDetails = client.getDetails(addr)
    cabalDetails.leaveChannel(channel)
    dispatch(viewNextChannel({ addr }))
  }
}

export const viewNextChannel = ({ addr }) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  let channels = cabalDetails.getJoinedChannels()
  if (channels.length) {
    let index = channels.findIndex((channel) => channel === client.getCurrentChannel()) + 1
    if (index > channels.length - 1) {
      index = 0
    }
    dispatch(viewChannel({ addr, channel: channels[index] }))
  }
}

export const viewPreviousChannel = ({ addr }) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  let channels = cabalDetails.getJoinedChannels()
  if (channels.length) {
    let index = channels.findIndex((channel) => channel === client.getCurrentChannel()) - 1
    if (index < 0) {
      index = channels.length - 1
    }
    dispatch(viewChannel({ addr, channel: channels[index] }))
  }
}

export const changeUsername = ({ username }) => dispatch => {
  const cabalDetails = client.getCurrentCabal()
  cabalDetails.publishNick(username)
  dispatch({ type: 'UPDATE_CABAL', addr: cabalDetails.key, username })
  // TODO NICK
  client.addStatusMessage(`Nick set to: ${username}`, cabalDetails.getCurrentChannel())
  // dispatch(addLocalSystemMessage({
  //   addr: cabalDetails.key,
  //   content: `Nick set to: ${username}`
  // }))
}

const enrichMessage = (message) => {
  const t = moment(message.time)
  return Object.assign({}, message, {
    enriched: {
      time: {
        short: t.format('h:mm A'),
        full: t.format('LL')
      },
      content: remark().use(remarkReact).use(remarkEmoji).processSync(message.content).contents
    }
  })
}

export const getMessages = ({ addr, channel, amount }, callback) => dispatch => {
  const cabalDetails = client.getCurrentCabal()
  const users = cabalDetails.getUsers()
  client.getMessages({ amount, channel }, (messages) => {
    messages = messages.map((message) => {
      const author = users[message.key] ? users[message.key].name : DEFAULT_USERNAME
      const { type, timestamp, content } = message.value
      return enrichMessage({
        author,
        content: content && content.text,
        key: message.key + timestamp,
        time: timestamp,
        type
      })
    })
    dispatch({ type: 'UPDATE_CABAL', addr, messages })
    if (callback) {
      callback(messages)
    }
  })
}

export const viewChannel = ({ addr, channel }) => dispatch => {
  if (!channel || channel.length === 0) return
  client.focusChannel(channel)
  storeOnDisk()

  const cabalDetails = client.getCurrentCabal()
  dispatch({
    addr,
    channel: cabalDetails.getCurrentChannel(),
    channels: cabalDetails.getChannels(),
    settings: cabalDetails.settings,
    type: 'ADD_CABAL',
    username: cabalDetails.getLocalName(),
    users: cabalDetails.getUsers()
  })
  dispatch({
    type: 'VIEW_CABAL',
    addr,
    channel: cabalDetails.getCurrentChannel()
  })
  dispatch(getMessages({ addr, channel, amount: 100 }))
  // TODO NICK
  // dispatch(updateChannelMessagesUnread({ addr, channel, unreadCount: 0 }))
}

export const changeScreen = ({ screen, addr }) => ({ type: 'CHANGE_SCREEN', screen, addr })

export const addCabal = ({ addr, input, username, settings }) => dispatch => {
  if (!addr) {
    try {
      const key = decode(input)
      addr = encode(key)
    } catch (err) {
    }
  }
  if (client.getDetails(addr)) {
    // Show cabal if already added to client
    dispatch(viewCabal({ addr }))
    if (username) {
      dispatch(changeUsername({ addr, username }))
    }
    return
  }
  if (!settings) {
    // Default per cabal user settings
    settings = {
      alias: '',
      enableNotifications: false,
      currentChannel: DEFAULT_CHANNEL
    }
  }
  initializeCabal({ addr, username, dispatch, settings })
}

export const addChannel = ({ addr, channel }) => dispatch => {
  dispatch(hideAllModals())
  const cabalDetails = client.getCurrentCabal()

  client.focusChannel(channel)
  let topic = cabalDetails.getTopic()

  let opts = {}
  opts.newerThan = opts.newerThan || null
  opts.olderThan = opts.olderThan || Date.now()
  opts.amount = opts.amount || DEFAULT_PAGE_SIZE * 2.5

  client.getMessages(opts, (messages) => {
    messages = messages.map((message) => {
      const { type, timestamp, content } = message.value
      const channel = content.channel
      const author = 'testing'

      if (!!cabalDetails.settings.enableNotifications && !document.hasFocus()) {
        window.Notification.requestPermission()
        let notification = new window.Notification(author, {
          body: content.text
        })
        notification.onclick = () => {
          dispatch(viewCabal({ addr, channel }))
        }
      }

      return enrichMessage({
        author,
        content: content.text,
        key: message.key + timestamp,
        time: timestamp,
        type
      })
    })
    if (cabalDetails.getCurrentChannel() === channel) {
      dispatch({ type: 'UPDATE_CABAL', addr, messages, topic })
    }
  })

  // const cabal = cabals[addr]
  // const onMessage = (message) => {
  //   const { type, timestamp, content } = message.value
  //   const channel = content.channel
  //   if (cabal.client.users[message.key]) {
  //     const author = cabal.client.users[message.key] ? cabal.client.users[message.key].name : DEFAULT_USERNAME
  //     if (!cabal.client.channelMessages[channel]) {
  //       cabal.client.channelMessages[channel] = []
  //     }
  //     cabal.client.channelMessages[channel].push(enrichMessage({
  //       author,
  //       content: content.text,
  //       key: message.key + timestamp,
  //       time: timestamp,
  //       type
  //     }))
  //     if (!!cabal.settings.enableNotifications && !document.hasFocus()) {
  //       window.Notification.requestPermission()
  //       let notification = new window.Notification(author, {
  //         body: content.text
  //       })
  //       notification.onclick = () => {
  //         dispatch(viewCabal({ addr, channel }))
  //       }
  //     }
  //   }
  //   if (cabal.client.channel === channel) {
  //     dispatch({ type: 'UPDATE_CABAL', addr, messages: cabal.client.channelMessages[channel], topic })
  //   }
  //   const isCurrentCabalAndChannel = (cabal.client.channel === channel) && (cabal.key === currentCabalKey)
  //   if (!isCurrentCabalAndChannel) {
  //     dispatch(updateChannelMessagesUnread({ addr, channel }))
  //   }
  // }
  // if (!cabal.client.channels.includes(channel)) {
  //   cabal.client.channels.push(channel)
  //   if (!cabal.client.channelListeners[channel]) {
  //     cabal.messages.events.on(channel, onMessage)
  //     cabal.client.channelListeners[channel] = onMessage
  //   }
  // }
}

export const addMessage = ({ message, addr }) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  cabalDetails.publishMessage(message)
}

export const addLocalSystemMessage = ({ addr, channel, content }) => dispatch => {
  // TODO NICK
  // var cabal = cabals[addr]
  // channel = channel || cabal.client.channel
  // cabal.client.channelMessages[cabal.client.channel].push(enrichMessage({
  //   content,
  //   type: 'local/system'
  // }))
  // dispatch(updateCabal({ addr, messages: cabal.client.channelMessages[cabal.client.channel] }))
}

export const setChannelTopic = ({ topic, channel, addr }) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  cabalDetails.publishChannelTopic(channel, topic)
  dispatch({ type: 'UPDATE_TOPIC', addr, topic })
  dispatch(addLocalSystemMessage({
    addr,
    content: `Topic set to: ${topic}`
  }))
}

export const updateChannelMessagesUnread = ({ addr, channel, unreadCount }) => dispatch => {
  // const cabal = cabals[addr]
  // if (unreadCount !== undefined) {
  //   cabal.client.channelMessagesUnread[channel] = unreadCount
  // } else {
  //   if (!cabal.client.channelMessagesUnread[channel]) {
  //     cabal.client.channelMessagesUnread[channel] = 1
  //   } else {
  //     cabal.client.channelMessagesUnread[channel] = cabal.client.channelMessagesUnread[channel] + 1
  //   }
  // }
  // let allChannelsUnreadCount = Object.values(cabal.client.channelMessagesUnread).reduce((total, value) => {
  //   return total + (value || 0)
  // }, 0)
  // cabal.client.allChannelsUnreadCount = allChannelsUnreadCount
  // dispatch({ type: 'UPDATE_CABAL', addr, channelMessagesUnread: cabal.client.channelMessagesUnread, allChannelsUnreadCount })
  // dispatch(updateAppIconBadge())
}

export const updateAppIconBadge = (badgeCount) => dispatch => {
  // TODO: if (!!app.settings.enableBadgeCount) {
  // TODO NICK
  // badgeCount = badgeCount || Object.values(cabals).reduce((total, cabal) => {
  //   return total + (cabal.client.allChannelsUnreadCount || 0)
  // }, 0)
  // ipcRenderer.send('update-badge', { badgeCount, showCount: false }) // TODO: app.settings.showBadgeCountNumber
  // dispatch({ type: 'UPDATE_WINDOW_BADGE', badgeCount })
}

export const showEmojiPicker = () => dispatch => {
  dispatch({ type: 'SHOW_EMOJI_PICKER' })
}

export const hideEmojiPicker = () => dispatch => {
  dispatch({ type: 'HIDE_EMOJI_PICKER' })
}

// NICK CONTINUE HERE ---------
const initializeCabal = async ({ addr, username, dispatch, settings }) => {
  let cabal = addr ? await client.addCabal(addr) : await client.createCabal()

  // Add an object to store Desktop's per cabal client settings
  cabal.settings = settings || {}

  cabal.on('update', (details) => {
    console.warn('CABAL update', details)
    let users = details.getUsers()
    let username = details.getLocalName()
    let channels = details.getChannels()
    let channelsJoined = details.getJoinedChannels()
    let currentChannel = details.getCurrentChannel()
    let channelMembers = details.getChannelMembers()

    dispatch({ type: 'UPDATE_CABAL', addr, users, username, channels, channelsJoined, currentChannel, channelMembers })
    dispatch(getMessages({ addr, amount: 100, channel: currentChannel }, (messages) => {
      console.warn('NICK', { messages }, details)
      dispatch(viewCabal({ addr, currentChannel }))
    }))

    // TODO NICK
    // dispatch({ type: 'UPDATE_TOPIC', addr, topic: channelTopic })
  })

  // Focus default or last channel viewed
  dispatch(viewChannel({ addr, channel: cabal.settings.currentChannel }))

  // cabal.ready((err) => {
  //   if (err) return console.error(err)

  //   // cabal.client.users = {}
  //   // cabal.client.channelMessages = {}
  //   // cabal.client.channelMessagesUnread = {}
  //   // cabal.client.channelListeners = {}

  //   cabal.channels.events.on('add', (channel) => {
  //     dispatch(addChannel({ addr, channel }))
  //   })
  //   cabal.channels.get((err, channels) => {
  //     if (err) return console.error(err)
  //     if (channels.length === 0) {
  //       channels.push(DEFAULT_CHANNEL)
  //     }
  //     channels.forEach((channel) => {
  //       dispatch(addChannel({ addr, channel }))
  //     })
  //   })

  //   cabal.users.getAll((err, users) => {
  //     if (err) return
  //     cabal.client.users = users
  //     const updateLocalKey = () => {
  //       cabal.getLocalKey((err, lkey) => {
  //         if (err) return
  //         if (!Object.keys(cabal.client.users).includes(lkey)) {
  //           cabal.client.users[lkey] = {
  //             local: true,
  //             online: true,
  //             key: lkey,
  //             name: cabal.client.user.name || DEFAULT_USERNAME
  //           }
  //         }
  //         Object.keys(cabal.client.users).forEach((key) => {
  //           if (key === lkey) {
  //             cabal.client.user = cabal.client.users[key]
  //             cabal.client.user.local = true
  //             cabal.client.user.online = true
  //             cabal.client.user.key = key
  //             cabal.username = cabal.client.user.name
  //             cabal.publishNick(cabal.username)
  //           }
  //         })
  //         dispatch({ type: 'UPDATE_CABAL', addr, users: cabal.client.users, username: cabal.username })
  //         dispatch(joinChannel({ addr, channel: DEFAULT_CHANNEL }))
  //       })
  //     }
  //     updateLocalKey()

  //     cabal.users.events.on('update', (key) => {
  //       // TODO: rate-limit
  //       cabal.users.get(key, (err, user) => {
  //         if (err) return
  //         cabal.client.users[key] = Object.assign(cabal.client.users[key] || {}, user)
  //         cabal.client.users[key].name = cabal.client.users[key].name || DEFAULT_USERNAME
  //         if (cabal.client.user && key === cabal.client.user.key) cabal.client.user = cabal.client.users[key]
  //         if (!cabal.client.user) updateLocalKey()
  //         dispatch({ type: 'UPDATE_CABAL', addr, users: cabal.client.users })
  //       })
  //     })
  //     cabal.on('peer-added', (key) => {
  //       let found = false
  //       Object.keys(cabal.client.users).forEach((k) => {
  //         if (k === key) {
  //           cabal.client.users[k].online = true
  //           found = true
  //         }
  //       })
  //       if (!found) {
  //         cabal.client.users[key] = {
  //           key: key,
  //           online: true
  //         }
  //       }
  //       dispatch({ type: 'UPDATE_CABAL', addr, users: cabal.client.users })
  //     })
  //     cabal.on('peer-dropped', (key) => {
  //       Object.keys(cabal.client.users).forEach((k) => {
  //         if (k === key) {
  //           cabal.client.users[k].online = false
  //           dispatch({ type: 'UPDATE_CABAL', addr, users: cabal.client.users })
  //         }
  //       })
  //     })
  // })
  // })
}

// async function lskeys () {
//   let list
//   try {
//     list = filterForKeys(fs.readdirSync(DATA_DIR))
//   } catch (_) {
//     list = []
//     await mkdirp(DATA_DIR)
//   }
//   return list
// }

export const loadFromDisk = () => async dispatch => {
  let state
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  } catch (_) {
    state = {}
  }
  const stateKeys = Object.keys(state)
  for (const key of stateKeys) {
    const cabalState = JSON.parse(state[key])
    dispatch(addCabal(cabalState))
  }
  dispatch({ type: 'CHANGE_SCREEN', screen: stateKeys.length ? 'main' : 'addCabal' })
}

const storeOnDisk = async () => {
  const cabalKeys = client.getCabalKeys()
  const state = cabalKeys.reduce(
    (acc, addr) => {
      const cabalDetails = client.getDetails(addr)
      const settings = (cabalDetails && cabalDetails.settings) || {}
      return ({
        ...acc,
        [addr]: JSON.stringify({ addr, settings })
      })
    },
    {}
  )
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}
