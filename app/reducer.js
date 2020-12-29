import { createReducer } from '@reduxjs/toolkit'
import { setAutoFreeze } from 'immer'
import settings from './settings'

// set auto freeze to false to prevent freezing the object.
// currently data is shared between cabal-client lib and redux.
// so if frozen, it will cause issues since lib is mutating some code.-
setAutoFreeze(false)

let darkMode = settings.get('darkMode')
// if its not explicitly set, set it in darkMode
if (typeof darkMode === 'undefined') darkMode = true

const defaultState = {
  cabals: {},
  cabalSettings: {},
  cabalSettingsVisible: false,
  channelMembers: [],
  channelPanelVisible: {},
  currentCabal: null,
  currentChannel: 'default',
  emojiPickerVisible: false,
  profilePanelUser: {},
  profilePanelVisible: {},
  screen: 'main',
  screenViewHistory: [],
  screenViewHistoryPosition: 0,
  globalSettings: {
    darkMode
  }
}

const reducer = createReducer(defaultState, {
  CHANGE_DARK_MODE: (state, { darkMode }) => {
    state.globalSettings.darkMode = darkMode
  },
  CHANGE_SCREEN: (state, { screen, addr }) => {
    state.screen = screen
    state.addr = addr
  },
  VIEW_CABAL: (state, { channel, addr }) => {
    state.currentCabal = addr
    state.currentChannel = channel || state.currentChannel
  },
  ADD_CABAL: (state, action) => {
    state.cabals[action.addr] = {
      ...state.cabals[action.addr],
      messages: [],
      ...action
    }
  },
  UPDATE_CABAL: (state, action = {}) => {
    state.cabals[action.addr] = {
      ...state.cabals[action.addr],
      ...action
    }
  },
  UPDATE_CABAL_SETTINGS: (state, { addr, settings }) => {
    state.cabalSettings[addr] = {
      ...state.cabalSettings[addr],
      ...settings
    }
  },
  UPDATE_TOPIC: (state, { addr, topic }) => {
    state.cabals[addr].topic = topic
  },
  DELETE_CABAL: (state, { addr }) => {
    delete state.cabals[addr]
  },
  SHOW_CHANNEL_BROWSER: (state) => {
    state.channelBrowserVisible = true
    // state.profilePanelVisible[addr] = false
  },
  UPDATE_CHANNEL_BROWSER: (state, { channelsData }) => {
    state.channelBrowserChannelsData = channelsData
  },
  SHOW_CABAL_SETTINGS: (state) => {
    state.cabalSettingsVisible = true
    state.emojiPickerVisible = false
    // state.profilePanelVisible[addr] = false
  },
  HIDE_CABAL_SETTINGS: state => { state.cabalSettingsVisible = false },
  HIDE_ALL_MODALS: state => {
    state.cabalSettingsVisible = false
    state.emojiPickerVisible = false
    state.channelBrowserVisible = false
  },
  UPDATE_WINDOW_BADGE: (state, { badgeCount }) => { state.badgeCount = badgeCount },
  SHOW_EMOJI_PICKER: (state) => { state.emojiPickerVisible = true },
  HIDE_EMOJI_PICKER: state => { state.emojiPickerVisible = false },
  SHOW_PROFILE_PANEL: (state, { addr, userKey }) => {
    state.profilePanelVisible[addr] = true
    state.profilePanelUser[addr] = userKey
  },
  HIDE_PROFILE_PANEL: (state, { addr }) => {
    state.profilePanelVisible[addr] = false
  },
  SHOW_CHANNEL_PANEL: (state, { addr }) => {
    state.channelPanelVisible[addr] = true
  },
  HIDE_CHANNEL_PANEL: (state, { addr }) => {
    state.channelPanelVisible[addr] = false
  },
  UPDATE_SCREEN_VIEW_HISTORY: (state, { addr, channel }) => {
    state.screenViewHistory.push({ addr, channel })
    state.screenViewHistoryPosition = state.screenViewHistory.length - 1
  },
  SET_SCREEN_VIEW_HISTORY_POSITION: (state, { index }) => {
    state.screenViewHistoryPosition = index
  }
})

export default reducer
