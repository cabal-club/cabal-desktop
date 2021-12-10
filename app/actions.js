import { homedir } from 'os'
import { ipcRenderer } from 'electron'
import Client from 'cabal-client'
import CustomLink from './containers/customLink'
import fs from 'fs'
import githubSanitize from 'hast-util-sanitize/lib/github'
import merge from 'deepmerge'
import path from 'path'
import remark from 'remark'
import remarkAltProt from 'remark-altprot'
import remarkEmoji from 'remark-emoji'
import remarkReact from 'remark-react'
import { throttle } from 'lodash'
import User from 'cabal-client/src/user'

const { dialog } = require('electron').remote

const cabalComponents = {
  remarkReactComponents: {
    a: CustomLink
  }
}

const cabalSanitize = {
  sanitize: merge(githubSanitize, { protocols: { href: ['hyper', 'dat', 'cabal', 'hypergraph', 'hypermerge'] } })
}

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
  },
  commands: {
    help: {
      help: () => 'display this help message',
      call: (cabal, res, arg) => {
        const commands = client.getCommands()
        let helpContent = ''
        for (var key in commands) {
          helpContent = helpContent + `/${key} - ${commands[key].help()} \n`
        }
        addStatusMessage({ addr: cabal.key, text: helpContent })
      }
    }
  }
})
// Disable a few slash commands for now
// TODO: figure out why cabal-client's removeCommand doesn't work?
// tracked by: https://github.com/cabal-club/cabal-desktop/issues/306
// const removedCommands = ['add', 'channels', 'clear', 'ids', 'names', 'new', 'qr', 'whoami', 'whois']
// removedCommands.forEach((command) => {
//   client.removeCommand(command)
// })

// On exit, close the cabals to cleanly leave the hyperswarms
window.onbeforeunload = (e) => {
  for (const cabal of client.cabals.values()) {
    cabal._destroy(() => {})
  }
}

export const viewCabal = ({ addr, channel, skipScreenHistory }) => dispatch => {
  client.focusCabal(addr)
  channel = channel || client.getCurrentChannel()
  dispatch({ addr, channel, type: 'VIEW_CABAL' })
  dispatch(viewChannel({ addr, channel, skipScreenHistory }))
}

export const showProfilePanel = ({ addr, userKey }) => (dispatch) => {
  dispatch(hideChannelPanel({ addr }))
  dispatch({ type: 'SHOW_PROFILE_PANEL', addr, userKey })
}

export const hideProfilePanel = ({ addr }) => (dispatch) => {
  dispatch({ type: 'HIDE_PROFILE_PANEL', addr })
}

export const showChannelPanel = ({ addr }) => (dispatch) => {
  dispatch(hideProfilePanel({ addr }))
  dispatch({ type: 'SHOW_CHANNEL_PANEL', addr })
}

export const hideChannelPanel = ({ addr }) => (dispatch) => {
  dispatch({ type: 'HIDE_CHANNEL_PANEL', addr })
}

export const updateScreenViewHistory = ({ addr, channel }) => (dispatch) => {
  dispatch({ type: 'UPDATE_SCREEN_VIEW_HISTORY', addr, channel })
}

export const setScreenViewHistoryPostion = ({ index }) => (dispatch) => {
  dispatch({ type: 'SET_SCREEN_VIEW_HISTORY_POSITION', index })
}

export const showChannelBrowser = ({ addr }) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  const channelsData = Object.values(cabalDetails.channels).filter((channel) => {
    // Omit private message channels
    return !channel.isPrivate
  }).map((channel) => {
    return {
      ...channel,
      memberCount: channel.members.size
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
  }).then((response) => {
    if (response.response === 1) {
      dispatch(confirmRemoveCabal({ addr }))
    }
  })
}

// remove cabal
export const confirmRemoveCabal = ({ addr }) => async dispatch => {
  client.removeCabal(addr)
  // dispatch({ type: 'DELETE_CABAL', addr })
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

export const listCommands = () => dispatch => {
  return client.getCommands()
}

export const joinChannel = ({ addr, channel }) => dispatch => {
  if (channel.length > 0) {
    const cabalDetails = client.getDetails(addr)
    // Catch new private message channels
    const users = cabalDetails.getUsers()
    const user = users[channel]
    const pmChannels = cabalDetails.getPrivateMessageList()
    const isNewPmChannel = user && !pmChannels.includes(channel)
    if (isNewPmChannel) {
      dispatch(hideAllModals())
      dispatch({ type: 'VIEW_CABAL', addr, channel })
      dispatch({ type: 'UPDATE_CABAL', addr, channel, messages: [], isChannelPrivate: true })
    } else {
      cabalDetails.joinChannel(channel)
      dispatch(addChannel({ addr, channel }))
      dispatch(viewChannel({ addr, channel }))
    }
  }
}

export const confirmArchiveChannel = ({ addr, channel }) => dispatch => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Cancel', 'Archive'],
    message: `Are you sure you want to archive this channel, ${channel}?`
  }).then((response) => {
    if (response.response === 1) {
      dispatch(archiveChannel({ addr }))
    }
  })
}

export const archiveChannel = ({ addr, channel }) => dispatch => {
  const currentChannel = client.getCurrentChannel()
  if (!channel || !channel.length) {
    channel = currentChannel
  }
  if (channel === currentChannel) {
    dispatch(viewNextChannel({ addr }))
  }
  const cabalDetails = client.getDetails(addr)
  cabalDetails.leaveChannel(channel)
  cabalDetails.archiveChannel(channel)
  const channels = cabalDetails.getChannels({ includePM: false })
  const pmChannels = cabalDetails.getPrivateMessageList()
  const channelsJoined = cabalDetails.getJoinedChannels() || []
  const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)
  dispatch({ type: 'UPDATE_CABAL', initialized: true, addr, channelMessagesUnread, channels, channelsJoined, pmChannels })
}

export const unarchiveChannel = ({ addr, channel }) => dispatch => {
  const currentChannel = client.getCurrentChannel()
  if (!channel || !channel.length) {
    channel = currentChannel
  }
  const cabalDetails = client.getDetails(addr)
  cabalDetails.unarchiveChannel(channel)
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
    cabalDetails.publishNick(username, () => {
      dispatch({ type: 'UPDATE_CABAL', addr: cabalDetails.key, username })
      addStatusMessage({
        addr: cabalDetails.key,
        channel: cabalDetails.getCurrentChannel(),
        text: `Nick set to: ${username}`
      })
    })
  }
}

const enrichMessage = (message) => {
  return Object.assign({}, message, {
    enriched: {
      time: message.time,
      content: remark()
        .use(remarkAltProt)
        .use(remarkReact, { ...cabalSanitize, ...cabalComponents })
        .use(remarkEmoji).processSync(message.content)
        .result
    }
  })
}

export const getMessages = ({ addr, channel, amount }, callback) => dispatch => {
  client.focusCabal(addr)
  if (client.getChannels().includes(channel)) {
    client.getMessages({ amount, channel }, (messages) => {
      messages = messages.map((message) => {
        const user = dispatch(getUser({ key: message.key }))
        const { type, timestamp, content } = message.value
        return enrichMessage({
          content: content && content.text,
          key: message.key,
          message,
          time: timestamp,
          type,
          user
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
  const cabalKey = client.getCurrentCabal().key
  const currentChannel = cabalDetails.getCurrentChannel()
  const pmChannels = cabalDetails.getPrivateMessageList()

  // Ignore incoming message from channels you're not in
  if (!message.value.private && !cabalDetails.getJoinedChannels().includes(channel)) {
    return
  }

  const user = dispatch(getUser({ key: message.key }))

  // Ignore incoming messages from hidden users
  if (user && user.isHidden()) return

  // Add incoming message to message list if you're viewing that channel
  if ((channel === currentChannel) && (addr === cabalKey)) {
    const { type, timestamp, content } = message.value
    const enrichedMessage = enrichMessage({
      content: content && content.text,
      key: message.key,
      message,
      time: timestamp,
      type,
      user
    })
    const messages = [
      ...getState()?.cabals[addr].messages,
      enrichedMessage
    ]
    dispatch({ type: 'UPDATE_CABAL', addr, messages, pmChannels })
  } else {
    if (message.value.private === (addr === cabalKey)) {
      dispatch({ type: 'UPDATE_CABAL', addr, pmChannels })
    }
    // Skip adding to message list if not viewing that channel, instead update unread count
    dispatch(updateUnreadCounts({ addr }))
  }

  const settings = getState().cabalSettings[addr]
  if (!!settings.enableNotifications && !document.hasFocus()) {
    dispatch(sendDesktopNotification({
      addr,
      user,
      channel,
      content: message.value.content
    }))
  }
}

export const getUsers = () => (dispatch) => {
  const cabalDetails = client.getCurrentCabal()
  return cabalDetails.getUsers()
}

export const getUser = ({ key }) => (dispatch) => {
  const cabalDetails = client.getCurrentCabal()
  const users = cabalDetails.getUsers()
  // TODO: This should be inside cabalDetails.getUser(...)
  var user = users[key]
  if (!user) {
    user = new User({
      name: key.substr(0, 6),
      key: key
    })
  }
  if (!user.name) user.name = key.substr(0, 6)

  return user
}

export const viewChannel = ({ addr, channel, skipScreenHistory }) => (dispatch, getState) => {
  if (!channel || channel.length === 0) return

  if (client.getChannels().includes(channel)) {
    client.focusChannel(channel)
    client.markChannelRead(channel)
  } else {
    // TODO: After the lastest cabal-client update, this line which throws the app into a loading loop.
    // But, it seems that joinChannel may not be needed here as things seem to work as expected without it.
    // Next step: investigate why this loops and if there's regression from removing this line:
    // dispatch(joinChannel({ addr, channel }))
  }

  const cabalDetails = client.getCurrentCabal()
  const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)

  dispatch(hideAllModals())
  dispatch({
    addr,
    channel: cabalDetails.getCurrentChannel(),
    channelMessagesUnread,
    channels: cabalDetails.getChannels({ includePM: false }),
    channelsJoined: cabalDetails.getJoinedChannels(),
    isChannelPrivate: cabalDetails.isChannelPrivate(cabalDetails.getCurrentChannel()),
    pmChannels: cabalDetails.getPrivateMessageList(),
    type: 'ADD_CABAL',
    username: cabalDetails.getLocalName(),
    users: cabalDetails.getUsers()
  })
  dispatch({
    addr,
    channel: cabalDetails.getCurrentChannel(),
    type: 'VIEW_CABAL'
  })
  dispatch(getMessages({ addr, channel, amount: 100 }))

  const topic = cabalDetails.getTopic()
  dispatch({ type: 'UPDATE_TOPIC', addr, topic })
  dispatch(updateChannelMessagesUnread({ addr, channel, unreadCount: 0 }))

  // When a user is walking through history by using screen history navigation commands,
  // `skipScreenHistory=true` does not add that navigation event to the end of the history
  // stack so that navigating again forward through history works.
  if (!skipScreenHistory) {
    dispatch(updateScreenViewHistory({ addr, channel }))
  }

  dispatch(saveCabalSettings({ addr, settings: { currentChannel: channel } }))
}

export const changeScreen = ({ screen, addr }) => ({ type: 'CHANGE_SCREEN', screen, addr })

export const addCabal = ({ addr, isNewlyAdded, settings, username }) => async (dispatch) => {
  if (addr) {
    // Convert domain keys to cabal keys
    addr = await client.resolveName(addr)
  }
  if (client._keyToCabal[addr]) {
    // Show cabal if already added to client
    dispatch(viewCabal({ addr }))
    if (username) {
      dispatch(setUsername({ addr, username }))
    }
  } else {
    // Add the cabal to the client using the default per cabal user settings
    settings = {
      alias: '',
      enableNotifications: false,
      currentChannel: DEFAULT_CHANNEL,
      ...settings
    }
    dispatch(initializeCabal({ addr, isNewlyAdded, settings, username }))
  }
}

export const sendDesktopNotification = throttle(({ addr, user, channel, content }) => (dispatch) => {
  window.Notification.requestPermission()
  const notification = new window.Notification(user.name, {
    body: content.text
  })
  notification.onclick = () => {
    dispatch(viewCabal({ addr, channel }))
  }
}, 5000, { leading: true, trailing: true })

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
      const user = dispatch(getUser({ key: message.key }))

      const settings = getState().cabalSettings[addr]
      if (!!settings.enableNotifications && !document.hasFocus()) {
        dispatch(sendDesktopNotification({ addr, user, channel, content }))
      }

      return enrichMessage({
        content: content.text,
        key: message.key,
        message,
        time: timestamp,
        type,
        user
      })
    })
    if (cabalDetails.getCurrentChannel() === channel) {
      dispatch({ type: 'UPDATE_CABAL', addr, messages, topic })
    }
  })
}

export const processLine = ({ message, addr }) => dispatch => {
  const channel = message.content.channel
  const cabalDetails = client.getDetails(addr)
  const users = cabalDetails.getUsers()
  const pmChannels = cabalDetails.getPrivateMessageList()
  const isNewPmChannel = users[channel] && !pmChannels.includes(channel)

  const text = message.content.text
  if (text?.startsWith('/')) {
    const cabal = client.getCurrentCabal()
    cabal.processLine(text)
  } else {
    if (isNewPmChannel) {
      // this creates the channel by sending a private message (PMs are not initiated until posting a message)
      cabalDetails.publishPrivateMessage(message, channel)
      dispatch(joinChannel({ addr, channel }))
    } else {
      cabalDetails.publishMessage(message)
    }
  }
}

export const addStatusMessage = ({ addr, channel, text }) => {
  const cabalDetails = addr ? client.getDetails(addr) : client.getCurrentCabal()
  client.addStatusMessage({ text }, channel, cabalDetails._cabal)
}

export const setChannelTopic = ({ topic, channel, addr }) => dispatch => {
  const cabalDetails = client.getDetails(addr)
  cabalDetails.publishChannelTopic(channel, topic)
  dispatch({ type: 'UPDATE_TOPIC', addr, topic })
  addStatusMessage({
    addr,
    channel,
    text: `Topic set to: ${topic}`
  })
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
  const channels = [...cabalDetails.getJoinedChannels(), ...cabalDetails.getPrivateMessageList()]
  channels.map((channel) => {
    channelMessagesUnread[channel] = client.getNumberUnreadMessages(channel, cabalCore)
  })
  return channelMessagesUnread
}

const initializeCabal = ({ addr, isNewlyAdded, username, settings }) => async dispatch => {
  const isNew = !addr
  const cabalDetails = isNew ? await client.createCabal() : await client.addCabal(addr)
  addr = cabalDetails.key

  console.log('---> initializeCabal', { addr, settings })

  function initialize () {
    const users = cabalDetails.getUsers()
    const userkey = cabalDetails.getLocalUser().key
    const username = cabalDetails.getLocalName()
    const channels = cabalDetails.getChannels({ includePM: false })
    const pmChannels = cabalDetails.getPrivateMessageList()
    const channelsJoined = cabalDetails.getJoinedChannels() || []
    const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)
    const currentChannel = cabalDetails.getCurrentChannel()
    const channelMembers = cabalDetails.getChannelMembers()
    dispatch({ type: 'UPDATE_CABAL', initialized: false, addr, channelMessagesUnread, users, userkey, username, channels, channelsJoined, currentChannel, channelMembers, pmChannels })
    dispatch(getMessages({ addr, amount: 1000, channel: currentChannel }))
    dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))
    client.focusCabal(addr)
    dispatch(viewCabal({ addr, channel: settings.currentChannel }))
  }

  const cabalDetailsEvents = [
    {
      name: 'update',
      action: (data) => {
        // console.log('update event', data)
      }
    },
    {
      name: 'cabal-focus',
      action: () => { }
    }, {
      name: 'command',
      action: (data) => {
        console.log('COMMAND', data)
      }
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
        dispatch(viewChannel({ addr, channel: currentChannel }))
      }
    }, {
      name: 'channel-leave',
      action: (data) => {
        const currentChannel = client.getCurrentChannel()
        const channelMessagesUnread = getCabalUnreadMessagesCount(cabalDetails)
        const channelsJoined = cabalDetails.getJoinedChannels()
        dispatch({ type: 'UPDATE_CABAL', addr, channelMessagesUnread, channelsJoined })
        dispatch(updateAllsChannelsUnreadCount({ addr, channelMessagesUnread }))
        dispatch(viewChannel({ addr, channel: currentChannel }))
      }
    }, {
      name: 'command',
      action: ({ arg, command, data }) => {
        console.warn('command', { arg, command, data })
      }
    }, {
      name: 'info',
      action: (info) => {
        console.log('info', info)
        if (info?.text?.startsWith('whispering on')) {
          const currentChannel = client.getCurrentChannel()
          client.addStatusMessage({ text: info.text }, currentChannel, cabalDetails._cabal)
        }
      }
    }, {
      name: 'init',
      action: initialize
    }, {
      name: 'new-channel',
      action: () => {
        const channels = cabalDetails.getChannels({ includePM: false })
        const pmChannels = cabalDetails.getPrivateMessageList()
        const channelMembers = cabalDetails.getChannelMembers()
        dispatch({ type: 'UPDATE_CABAL', addr, channels, channelMembers, pmChannels })
      }
    }, {
      name: 'new-message',
      throttleDelay: 500,
      action: (data) => {
        const channel = data.channel
        const message = data.message
        dispatch(onIncomingMessage({ addr, channel, message }))
      }
    }, {
      name: 'private-message',
      throttleDelay: 500,
      action: (data) => {
        console.log('private-message', data)
      }
    },
    {
      name: 'publish-message',
      action: () => {
        // don't do anything on publish message (new-message takes care of it)
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
      action: (data) => {
        const cabal = client.getCurrentCabal()
        const channel = data.channel
        const topic = cabalDetails.getTopic()
        dispatch({ type: 'UPDATE_TOPIC', addr, topic })
        if (addr === cabal.key && channel === cabalDetails.getCurrentChannel()) {
          addStatusMessage({
            addr,
            channel,
            text: `Topic set to: ${topic}`
          })
        }
      }
    }, {
      name: 'user-updated',
      action: (data) => {
        const users = cabalDetails.getUsers()
        dispatch({ type: 'UPDATE_CABAL', addr, users })
        // Update local user
        const cabal = client.getCurrentCabal()
        if (data.key === cabal.getLocalUser().key) {
          const username = data.user?.name
          dispatch({ type: 'UPDATE_CABAL', addr: cabalDetails.key, username })
          addStatusMessage({
            addr: cabalDetails.key,
            channel: cabalDetails.getCurrentChannel(),
            text: `Nick set to: ${username}`
          })
        }
      }
    }
  ]
  setTimeout(() => {
    cabalDetailsEvents.forEach((event) => {
      const action = throttle((data) => {
        // console.log('Event:', event.name, data)
        event.action(data)
      }, event.throttleDelay, { leading: true, trailing: true })
      cabalDetails.on(event.name, action)
    })
    initialize()
    dispatch({ type: 'UPDATE_CABAL', initialized: true, addr })
  }, isNewlyAdded ? 10000 : 0)

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
  // if (stateKeys.length) {
  //   setTimeout(() => {
  //     const firstCabal = JSON.parse(state[stateKeys[0]])
  //     dispatch(viewCabal({ addr: firstCabal.addr, channel: firstCabal.settings.currentChannel }))
  //     client.focusCabal(firstCabal.addr)
  //   }, 5000)
  // }
  dispatch({ type: 'CHANGE_SCREEN', screen: stateKeys.length ? 'main' : 'addCabal' })
}

const storeOnDisk = () => (dispatch, getState) => {
  const cabalKeys = client.getCabalKeys()
  const { cabalSettings } = getState()
  const state = {}
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

export const moderationHide = (props) => async dispatch => {
  dispatch(moderationAction('hide', props))
}

export const moderationUnhide = (props) => async dispatch => {
  dispatch(moderationAction('unhide', props))
}

export const moderationBlock = (props) => async dispatch => {
  dispatch(moderationAction('block', props))
}

export const moderationUnblock = (props) => async dispatch => {
  dispatch(moderationAction('unblock', props))
}

export const moderationAddMod = (props) => async dispatch => {
  dispatch(moderationAction('addMod', props))
}

export const moderationRemoveMod = (props) => async dispatch => {
  dispatch(moderationAction('removeMod', props))
}

export const moderationAddAdmin = (props) => async dispatch => {
  dispatch(moderationAction('addAdmin', props))
}

export const moderationRemoveAdmin = (props) => async dispatch => {
  dispatch(moderationAction('removeAdmin', props))
}

export const moderationAction = (action, { addr, channel, reason, userKey }) => async dispatch => {
  const cabalDetails = client.getDetails(addr)
  await cabalDetails.moderation[action](userKey, { channel, reason })
  setTimeout(() => {
    const users = cabalDetails.getUsers()
    dispatch({ type: 'UPDATE_CABAL', addr, users })
  }, 500)
}
