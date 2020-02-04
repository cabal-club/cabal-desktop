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
import throttle from 'lodash.throttle'
import commander from './commander'
const { dialog } = require('electron').remote

const DEFAULT_CHANNEL = 'default'
const HOME_DIR = homedir()
const DATA_DIR = path.join(HOME_DIR, '.cabal-desktop', `v${Client.getDatabaseVersion()}`)
const STATE_FILE = path.join(DATA_DIR, 'cabals.json')
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

export const changeUsername = ({ username, addr }) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  cabalDetails.publishNick(username)
  dispatch({ type: 'UPDATE_CABAL', addr: cabalDetails.key, username })
  dispatch(addStatusMessage({
    addr: cabalDetails.key,
    channel: cabalDetails.getCurrentChannel(),
    text: `Nick set to: ${username}`
  }))
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
        const author = users[message.key] ? users[message.key].name : message.key.substr(0, 6)
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

  if (client.getChannels().includes(channel)) {
    client.focusChannel(channel)
  }

  const cabalDetails = client.getCurrentCabal()
  const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)

  dispatch(hideAllModals())
  dispatch({
    addr,
    channel: cabalDetails.getCurrentChannel(),
    channels: cabalDetails.getChannels(),
    channelsJoined: cabalDetails.getJoinedChannels(),
    channelMessagesUnread,
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
  dispatch(updateChannelMessagesUnread({ addr, channel, unreadCount: 0 }))

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
  const users = cabalDetails.getUsers()

  const opts = {}
  opts.newerThan = opts.newerThan || null
  opts.olderThan = opts.olderThan || Date.now()
  opts.amount = opts.amount || DEFAULT_PAGE_SIZE * 2.5

  const sendDesktopNotification = throttle(({ author, content }) => {
    window.Notification.requestPermission()
    const notification = new window.Notification(author, {
      body: content.text
    })
    notification.onclick = () => {
      dispatch(viewCabal({
        addr,
        channel
      }))
    }
  }, 50000)

  client.getMessages(opts, (messages) => {
    messages = messages.map((message) => {
      const { type, timestamp, content = {} } = message.value
      const author = users[message.key] ? users[message.key].name : message.key.substr(0, 6)

      const settings = getState().cabalSettings[addr]
      if (!!settings.enableNotifications && !document.hasFocus()) {
        sendDesktopNotification({ author, content })
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
}

export const addMessage = ({ message, addr }) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  cabalDetails.publishMessage(message)
}

export const addStatusMessage = ({ addr, channel, text }) => dispatch => {
  const cabalDetails = addr ? client.getDetails(addr) : client.getCurrentCabal()
  client.addStatusMessage({ text }, channel, cabalDetails._cabal)
}

export const setChannelTopic = ({ topic, channel, addr }) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  cabalDetails.publishChannelTopic(channel, topic)
  dispatch({ type: 'UPDATE_TOPIC', addr, topic })
  dispatch(addStatusMessage({
    addr,
    channel,
    text: `Topic set to: ${topic}`
  }))
}

export const updateChannelMessagesUnread = ({ addr, channel, unreadCount }) => (dispatch, getState) => {
  const cabals = getState().cabals || {}
  const cabal = cabals[addr] || {}
  const channelMessagesUnread = getState().cabals[addr].channelMessagesUnread || {}
  if (unreadCount !== undefined) {
    channelMessagesUnread[channel] = unreadCount
  } else {
    channelMessagesUnread[channel] = (cabal.channelMessagesUnread && cabal.channelMessagesUnread[channel]) || 0
  }
  dispatch({ type: 'UPDATE_CABAL', addr, channelMessagesUnread })
  dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))
}

export const updateAllsChannelsUnreadCount = ({ addr, channelMessagesUnread }) => (dispatch, getState) => {
  const allChannelsUnreadCount = Object.values(channelMessagesUnread).reduce((total, value) => {
    return total + (value || 0)
  }, 0)
  if (allChannelsUnreadCount !== getState().cabals[addr].allChannelsUnreadCount) {
    dispatch({ type: 'UPDATE_CABAL', addr, allChannelsUnreadCount })
    dispatch(updateAppIconBadge())
  }
}

export const updateAppIconBadge = (badgeCount) => (dispatch, getState) => {
  // TODO: if (!!app.settings.enableBadgeCount) {
  const cabals = getState().cabals || {}
  badgeCount = badgeCount || Object.values(cabals).reduce((total, cabal) => {
    return total + (cabal.allChannelsUnreadCount || 0)
  }, 0)
  ipcRenderer.send('update-badge', { badgeCount, showCount: false }) // TODO: app.settings.showBadgeCountNumber
  dispatch({ type: 'UPDATE_WINDOW_BADGE', badgeCount })
}

export const showEmojiPicker = () => dispatch => {
  dispatch({ type: 'SHOW_EMOJI_PICKER' })
}

export const hideEmojiPicker = () => dispatch => {
  dispatch({ type: 'HIDE_EMOJI_PICKER' })
}

const getCabalUnreadMessagesCount = (cabalDetails) => {
  const cabalCore = client._keyToCabal[cabalDetails.key]
  const channelMessagesUnread = {}
  // fetch unread message count only for joined channels.
  cabalDetails.getJoinedChannels().map((channel) => {
    channelMessagesUnread[channel] = client.getNumberUnreadMessages(channel, cabalCore)
  })
  return channelMessagesUnread
}

const initializeCabal = ({ addr, username, dispatch, settings }) => async (dispatch, getState) => {
  const cabalDetails = addr ? await client.addCabal(addr) : await client.createCabal()
  client.focusCabal(addr)
  // if creating a new cabal, addr will be undefined.
  const { key: cabalKey } = cabalDetails
  let firstUpdate = true

  if (username) dispatch(changeUsername({ username, addr }))
  cabalDetails.on('update', throttle((details) => {
    const users = details.getUsers()
    const username = details.getLocalName()
    const channels = details.getChannels()
    const channelsJoined = details.getJoinedChannels()
    const channelMessagesUnread = getCabalUnreadMessagesCount(details)
    const currentChannel = details.getCurrentChannel()
    const channelMembers = details.getChannelMembers()
    dispatch({ type: 'UPDATE_CABAL', addr: cabalKey, channelMessagesUnread, users, username, channels, channelsJoined, currentChannel, channelMembers })
    dispatch(getMessages({ addr: cabalKey, amount: 1000, channel: currentChannel }))
    dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))
    if (firstUpdate) {
      firstUpdate = false
      dispatch(viewCabal({ addr: cabalKey, currentChannel: settings.currentChannel }))
      // Focus default or last channel viewed
      dispatch(viewChannel({ addr: cabalKey, channel: settings.currentChannel }))

      settings = settings || getState().cabalSettings[addr] || {}
      dispatch(updateCabalSettings({ addr, settings, channelMessagesUnread }))
    }
  }, 500))
}

export const loadFromDisk = () => async dispatch => {
  let state
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  } catch (_) {
    state = {}
  }
  console.log('sadf')
  const stateKeys = Object.keys(state)
  for (const key of stateKeys) {
    const cabalState = JSON.parse(state[key])
    dispatch(addCabal(cabalState))
  }
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
