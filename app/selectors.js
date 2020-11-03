import { createSelector } from '@reduxjs/toolkit'
import { prop } from 'lodash/fp'
export const currentCabalSelector = createSelector(
  state => state.currentCabal,
  state => state.cabals || {},
  (currentCabal, cabals) => cabals[currentCabal] || {}
)

function sortUsers(users = []) {
  if (Array.isArray(users)) {
    return users.sort((a, b) => {
      if (a.isHidden() && !b.isHidden()) return 1
      if (b.isHidden() && !a.isHidden()) return -1
      if (a.online && !b.online) return -1
      if (b.online && !a.online) return 1
      if (a.isAdmin() && !b.isAdmin()) return -1
      if (b.isAdmin() && !a.isAdmin()) return 1
      if (a.isModerator() && !b.isModerator()) return -1
      if (b.isModerator() && !a.isModerator()) return 1
      if (a.name && !b.name) return -1
      if (b.name && !a.name) return 1
      if (a.name && b.name) return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
      return a.key < b.key ? -1 : 1
    })
  }
}

export const currentChannelMembersSelector = createSelector(
  currentCabalSelector,
  cabal => sortUsers(cabal.channelMembers)
)

export const currentChannelMemberCountSelector = createSelector(
  currentChannelMembersSelector,
  (members = []) => members.length
)

// check if all cabals are initialized and current one is set
export const isCabalsInitializedSelector = createSelector(
  state => state.currentCabal,
  state => state.cabals || {},
  (current, cabals) => {
    const cabalsInitialized = Object.values(cabals).every(prop('initialized'))
    return cabalsInitialized && !!current
  }
)


// current cabals settings
export const cabalSettingsSelector = createSelector(
  state => state?.currentCabal || "",
  state => state.cabalSettings,
  (addr, settings) => settings[addr] || {}
)

// messages of current cabal
export const currentChannelMessagesSelector = createSelector(
  currentCabalSelector,
  cabal => cabal?.messages || []
)


// select current channel
export const currentChannelSelector = createSelector(
  currentCabalSelector,
  cabal => cabal?.channel
)
