const defaultState = {
  screen: 'main',
  currentCabal: null,
  currentChannel: 'default',
  cabals: {}
}

const reducer = (state = defaultState, action) => {
  state.cabalSettingsVisible = false
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
        currentCabal: action.addr,
        currentChannel: action.channel || 'default'
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
        }
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
    case 'UPDATE_MESSAGES':
      var cabal = state.cabals[action.addr]
      if (!cabal.messages) cabal.messages = []
      return {
        ...state,
        cabals: {
          ...state.cabals,
          [action.addr]: {
            ...cabal,
            messages: action.messages
          }
        }
      }
    case 'DELETE_CABAL':
      var cabals = state.cabals
      delete cabals[action.key]
      return ({
        ...state,
        ...cabals
      })
    case 'SHOW_CABAL_SETTINGS':
      return {
        ...state,
        cabalSettingsVisible: true
      }
    case 'HIDE_CABAL_SETTINGS':
      return {
        ...state,
        cabalSettingsVisible: false
      }
    default:
      return defaultState
  }
}

export default reducer
