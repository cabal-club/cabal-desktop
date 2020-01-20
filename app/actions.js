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
  const cabalDetails = client.getDetails(addr)
  const channelsData = Object.values(cabalDetails.channels).map((channel) => {
    return {
      joined: channel.joined,
      memberCount: channel.members.size,
      name: channel.name,
      topic: channel.topic
    }
  })
  dispatch({ type: 'UPDATE_CHANNEL_BROWSER', addr, channelsData })
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

export const updateCabalSettings = ({ addr, settings }) => dispatch => {
  dispatch({ type: 'UPDATE_CABAL_SETTINGS', addr, settings })
  dispatch(storeOnDisk())
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

// remove cabal
export const confirmRemoveCabal = ({ addr }) => async dispatch => {
  client.removeCabal(addr)
  dispatch({ type: 'DELETE_CABAL', addr })
  // update the local file to reflect while restarting the app
  dispatch(storeOnDisk())
  const allCabals = client.getCabalKeys()

  // switch to the first cabal, else in case of no remaning cabals
  // show the add-cabal screen
  if (allCabals.length) {
    const toCabal = allCabals[0]
    client.focusCabal(toCabal)
    const cabalDetails = client.getDetails(toCabal)
    dispatch({
      addr: toCabal,
      channel: cabalDetails.getCurrentChannel(),
      type: 'VIEW_CABAL'
    })
  } else {
    dispatch({ type: 'CHANGE_SCREEN', screen: 'addCabal' })
  }
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
  const channels = cabalDetails.getJoinedChannels()
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
  const channels = cabalDetails.getJoinedChannels()
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
        diff: t.fromNow(),
        short: t.format('h:mm A'),
        full: t.format('LL')
      },
      content: remark().use(remarkReact).use(remarkEmoji).processSync(message.content).contents
    }
  })
}

export const getMessages = ({ addr, channel, amount }, callback) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  const users = cabalDetails.getUsers()
  if (client.getChannels().includes(channel)) {
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
}

export const viewChannel = ({ addr, channel }) => (dispatch, getState) => {
  if (!channel || channel.length === 0) return

  if (client.getChannels().includes(channel)) { client.focusChannel(channel) }

  const cabalDetails = client.getCurrentCabal()
  dispatch({
    addr,
    channel: cabalDetails.getCurrentChannel(),
    channels: cabalDetails.getChannels(),
    channelsJoined: cabalDetails.getJoinedChannels(),
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

  const topic = cabalDetails.getTopic()
  dispatch({ type: 'UPDATE_TOPIC', addr, topic })
  // TODO
  // dispatch(updateChannelMessagesUnread({ addr, channel, unreadCount: 0 }))

  dispatch(updateCabalSettings({ addr, settings: { currentChannel: channel } }))
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
  // Default per cabal user settings
  settings = {
    alias: '',
    enableNotifications: false,
    currentChannel: DEFAULT_CHANNEL,
    ...settings
  }
  dispatch(initializeCabal({ addr, username, dispatch, settings }))
}

export const addChannel = ({ addr, channel }) => (dispatch, getState) => {
  dispatch(hideAllModals())
  const cabalDetails = client.getCurrentCabal()

  client.focusChannel(channel)
  const topic = cabalDetails.getTopic()

  const opts = {}
  opts.newerThan = opts.newerThan || null
  opts.olderThan = opts.olderThan || Date.now()
  opts.amount = opts.amount || DEFAULT_PAGE_SIZE * 2.5

  client.getMessages(opts, (messages) => {
    messages = messages.map((message) => {
      const { type, timestamp, content = {} } = message.value
      const channel = content.channel
      const author = 'testing'

      const settings = getState().cabalSettings[addr]
      if (!!settings.enableNotifications && !document.hasFocus()) {
        window.Notification.requestPermission()
        const notification = new window.Notification(author, {
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
  //     if (!!settings.enableNotifications && !document.hasFocus()) {
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
  // TODO
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
  // TODO
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

const initializeCabal = ({ addr, username, dispatch, settings }) => async (dispatch, getState) => {
  const cabal = addr ? await client.addCabal(addr) : await client.createCabal()
  // if creating a new cabal, addr will be undefined.
  const { key: cabalKey } = cabal
  let firstUpdate = true
  cabal.on('update', (details) => {
    console.warn('CABAL update', details)
    const users = details.getUsers()
    const username = details.getLocalName()
    const channels = details.getChannels()
    const channelsJoined = details.getJoinedChannels()
    const currentChannel = details.getCurrentChannel()
    const channelMembers = details.getChannelMembers()
    dispatch({ type: 'UPDATE_CABAL', addr: cabalKey, users, username, channels, channelsJoined, currentChannel, channelMembers })
    dispatch(getMessages({ addr: cabalKey, amount: 100, channel: currentChannel }))
    if (firstUpdate) {
      firstUpdate = false
      dispatch(viewCabal({ addr: cabalKey, currentChannel: settings.currentChannel }))
      // Focus default or last channel viewed
      dispatch(viewChannel({ addr: cabalKey, channel: settings.currentChannel }))
    }
  })

  settings = settings || getState().cabalSettings[addr] || {}
  dispatch(updateCabalSettings({ addr, settings }))
}

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

const storeOnDisk = () => (dispatch, getState) => {
  const cabalKeys = client.getCabalKeys()
  const state = cabalKeys.reduce(
    (acc, addr) => {
      const settings = getState().cabalSettings[addr] || {}
      return ({
        ...acc,
        [addr]: JSON.stringify({ addr, settings })
      })
    },
    {}
  )
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}
