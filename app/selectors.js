import { createSelector } from '@reduxjs/toolkit'

export const currentCabalSelector = createSelector(
  state => state.currentCabal,
  state => state.cabals,
  (currentCabal, cabals) => cabals[currentCabal]
)

function sortUsers (users = []) {
  if (Array.isArray(users)) {
    return users.sort((a, b) => {
      if (a.online && !b.online) return -1
      if (b.online && !a.online) return 1
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
