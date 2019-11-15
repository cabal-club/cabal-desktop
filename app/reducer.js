const defaultState = {
  screen: 'main',
  cabalSettingsVisible: false,
  currentCabal: null,
  currentChannel: 'default',
  channelMembers: [],
  cabals: {},
  emojiPickerVisible: false
}

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'CHANGE_SCREEN':
      return {
        ...state,
        screen: action.screen,
        addr: action.addr
      }
    case 'VIEW_CABAL':
      return {
        ...state,
        cabalSettingsVisible: false,
        currentCabal: action.addr,
        currentChannel: action.channel || 'default',
        emojiPickerVisible: false
      }
    case 'ADD_CABAL':
      return {
        ...state,
        cabals: {
          ...state.cabals,
          [action.addr]: {
            ...action,
            messages: []
          }
        },
        cabalSettingsVisible: false
      }
    case 'UPDATE_CABAL':
      var cabal = state.cabals[action.addr]
      return {
        ...state,
        cabals: {
          ...state.cabals,
          [action.addr]: {
            ...cabal,
            ...action
          }
        }
      }
    case 'UPDATE_TOPIC':
      var cabal = state.cabals[action.addr]
      return {
        ...state,
        cabals: {
          ...state.cabals,
          [action.addr]: {
            ...cabal,
            topic: action.topic
          }
        }
      }
    case 'DELETE_CABAL':
      var cabals = state.cabals
      delete cabals[action.addr]
      return ({
        ...state,
        ...cabals
      })
    case 'SHOW_CABAL_SETTINGS':
      return {
        ...state,
        cabalSettingsVisible: true,
        emojiPickerVisible: false
      }
    case 'HIDE_CABAL_SETTINGS':
      return {
        ...state,
        cabalSettingsVisible: false
      }
    case 'UPDATE_WINDOW_BADGE':
      return {
        ...state,
        badgeCount: action.badgeCount
      }
    case 'SHOW_EMOJI_PICKER':
      return {
        ...state,
        emojiPickerVisible: true
      }
    case 'HIDE_EMOJI_PICKER':
      return {
        ...state,
        emojiPickerVisible: false
      }
    default:
      return defaultState
  }
}

export default reducer
