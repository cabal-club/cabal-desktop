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
  channel = channel || client.getCurrentChannel()
  dispatch({ addr, channel, type: 'VIEW_CABAL' })
  dispatch(viewChannel({ addr, channel }))
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

export const restoreCabalSettings = ({ addr, settings }) => dispatch => {
  dispatch({ type: 'UPDATE_CABAL_SETTINGS', addr, settings })
}

export const saveCabalSettings = ({ addr, settings }) => dispatch => {
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
  dispatch(hideAllModals())
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
  const currentChannel = client.getCurrentChannel()
  if (!channel || !channel.length) {
    channel = currentChannel
  }
  if (channel === currentChannel) {
    dispatch(viewNextChannel({ addr }))
  }
  const cabalDetails = client.getDetails(addr)
  cabalDetails.leaveChannel(channel)
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

export const setUsername = ({ username, addr }) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  const currentUsername = cabalDetails.getLocalName()
  if (username !== currentUsername) {
    cabalDetails.publishNick(username)
    dispatch({ type: 'UPDATE_CABAL', addr: cabalDetails.key, username })
    dispatch(addStatusMessage({
      addr: cabalDetails.key,
      channel: cabalDetails.getCurrentChannel(),
      text: `Nick set to: ${username}`
    }))
  }
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
  client.focusCabal(addr)
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

export const onIncomingMessage = ({ addr, channel, message }, callback) => (dispatch, getState) => {
  const cabalDetails = client.getDetails(addr)
  const currentChannel = cabalDetails.getCurrentChannel()
  if ((channel === currentChannel) && (addr === client.getCurrentCabal().key)) {
    const users = cabalDetails.getUsers()
    const author = users[message.key] ? users[message.key].name : message.key.substr(0, 6)
    const { type, timestamp, content } = message.value
    const enrichedMessage = enrichMessage({
      author,
      content: content && content.text,
      key: message.key + timestamp,
      time: timestamp,
      type
    })
    const messages = [
      ...getState()?.cabals[addr].messages,
      enrichedMessage
    ]
    dispatch({ type: 'UPDATE_CABAL', addr, messages })
  } else {
    dispatch(updateUnreadCounts({ addr }))
  }
}

export const viewChannel = ({ addr, channel }) => (dispatch) => {
  if (!channel || channel.length === 0) return

  if (client.getChannels().includes(channel)) {
    client.focusChannel(channel)
    client.markChannelRead(channel)
  } else {
    dispatch(joinChannel({ addr, channel }))
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

  dispatch(saveCabalSettings({ addr, settings: { currentChannel: channel } }))
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
      dispatch(setUsername({ addr, username }))
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
  }, 5000)

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
  if (allChannelsUnreadCount !== getState()?.cabals[addr]?.allChannelsUnreadCount) {
    dispatch({ type: 'UPDATE_CABAL', addr, allChannelsUnreadCount, channelMessagesUnread })
    dispatch(updateAppIconBadge())
  }
}

export const updateUnreadCounts = ({ addr }) => (dispatch) => {
  const cabalDetails = client.getDetails(addr)
  const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)
  dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))
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

const initializeCabal = ({ addr, username, settings }) => async dispatch => {
  const isNew = !addr
  const cabalDetails = isNew ? await client.createCabal() : await client.addCabal(addr)
  addr = cabalDetails.key

  const cabalDetailsEvents = [
    {
      name: 'cabal-focus',
      action: () => {}
    }, {
      name: 'channel-focus',
      action: () => {
        const channelsJoined = cabalDetails.getJoinedChannels()
        const channelMembers = cabalDetails.getChannelMembers()
        const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)
        const currentChannel = cabalDetails.getCurrentChannel()
        const username = cabalDetails.getLocalName()
        const users = cabalDetails.getUsers()
        dispatch({ type: 'UPDATE_CABAL', addr, channelMembers, channelMessagesUnread, channelsJoined, currentChannel, username, users })
        dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))
      }
    }, {
      name: 'channel-join',
      action: () => {
        const channelMembers = cabalDetails.getChannelMembers()
        const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)
        const channelsJoined = cabalDetails.getJoinedChannels()
        const currentChannel = cabalDetails.getCurrentChannel()
        dispatch({ type: 'UPDATE_CABAL', addr, channelMembers, channelMessagesUnread, channelsJoined, currentChannel })
        dispatch(getMessages({ addr, amount: 1000, channel: currentChannel }))
        dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))
      }
    }, {
      name: 'channel-leave',
      action: () => {
        const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)
        const channelsJoined = cabalDetails.getJoinedChannels()
        dispatch({ type: 'UPDATE_CABAL', addr, channelMessagesUnread, channelsJoined })
        dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))
      }
    }, {
      name: 'init',
      action: () => {
        setTimeout(() => {
          const users = cabalDetails.getUsers()
          const username = cabalDetails.getLocalName()
          const channels = cabalDetails.getChannels()
          const channelsJoined = cabalDetails.getJoinedChannels() || []
          const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)
          const currentChannel = cabalDetails.getCurrentChannel()
          const channelMembers = cabalDetails.getChannelMembers()
          dispatch({ type: 'UPDATE_CABAL', initialized: true, addr, channelMessagesUnread, users, username, channels, channelsJoined, currentChannel, channelMembers })
          dispatch(getMessages({ addr, amount: 1000, channel: currentChannel }))
          dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))

          dispatch(viewCabal({ addr, channel: settings.currentChannel }))
          client.focusCabal(addr)     
        }, 2000) 
      }
    }, {
      name: 'new-channel',
      action: () => {
        const channels = cabalDetails.getChannels()
        const channelMembers = cabalDetails.getChannelMembers()
        dispatch({ type: 'UPDATE_CABAL', addr, channels, channelMembers })
      }
    }, {
      name: 'new-message',
      action: (data) => {
        const channel = data.channel
        const message = data.message
        dispatch(onIncomingMessage({ addr, channel, message }))        
      }
    }, {
      name: 'publish-message',
      action: () => {
        const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)
        const currentChannel = cabalDetails.getCurrentChannel()
        dispatch(getMessages({ addr, amount: 1000, channel: currentChannel }))
        dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))
      }
    }, {
      name: 'publish-nick',
      action: () => {
        const users = cabalDetails.getUsers()
        dispatch({ type: 'UPDATE_CABAL', addr, users })
      }
    }, {
      name: 'started-peering',
      throttleDelay: 1000,
      action: () => {
        const users = cabalDetails.getUsers()
        dispatch({ type: 'UPDATE_CABAL', addr, users })
      }
    }, {
      name: 'status-message',
      action: () => {
        const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)
        const currentChannel = cabalDetails.getCurrentChannel()
        dispatch(getMessages({ addr, amount: 1000, channel: currentChannel }))
        dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))
      }
    }, {
      name: 'stopped-peering',
      throttleDelay: 1000,
      action: () => {
        const users = cabalDetails.getUsers()
        dispatch({ type: 'UPDATE_CABAL', addr, users })
      }
    }, {
      name: 'topic',
      action: () => {
        const topic = cabalDetails.getTopic()
        dispatch({ type: 'UPDATE_TOPIC', addr, topic })
      }
    }, {
      name: 'user-updated',
      action: () => {
        const users = cabalDetails.getUsers()
        dispatch({ type: 'UPDATE_CABAL', addr, users })
      }
    }
  ]
  cabalDetailsEvents.forEach((event) => {
    cabalDetails.on(event.name, throttle((data) => {
      event.action(data)
    }), event.throttleDelay || 200)
  })

  // if creating a new cabal, set a default username.
  if (isNew || username) {
    dispatch(setUsername({ username: username || generateUniqueName(), addr }))
  }
}

export const loadFromDisk = () => async dispatch => {
  let state
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  } catch (_) {
    state = {}
  }
  const stateKeys = Object.keys(state)
  // Restore previous settings state into store before initializing cabals
  stateKeys.forEach((key) => {
    const { addr, settings } = JSON.parse(state[key])
    dispatch(restoreCabalSettings({ addr, settings }))
  })
  // Initialize all of the cabals
  stateKeys.forEach((key) => {
    const { addr, settings } = JSON.parse(state[key])
    dispatch(addCabal({ addr, settings }))
  })
  dispatch({ type: 'CHANGE_SCREEN', screen: stateKeys.length ? 'main' : 'addCabal' })
}

const storeOnDisk = () => (dispatch, getState) => {
  const cabalKeys = client.getCabalKeys()
  const { cabalSettings } = getState()
  let state = {}
  cabalKeys.forEach((addr) => {
    state[addr] = JSON.stringify({
      addr,
      settings: cabalSettings[addr] || {}
    })
  })
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

const generateUniqueName = () => {
  const adjectives = ['ancient', 'whispering', 'hidden', 'emerald', 'occult', 'obscure', 'wandering', 'ephemeral', 'eccentric', 'singing']
  const nouns = ['lichen', 'moss', 'shadow', 'stone', 'ghost', 'friend', 'spore', 'fungi', 'mold', 'mountain', 'compost', 'conspirator']
  
  const randomItem = (array) => array[Math.floor(Math.random() * array.length)]
  return `${randomItem(adjectives)}-${randomItem(nouns)}`
}
