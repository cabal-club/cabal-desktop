const defaultState = {
  screen: 'main',
  currentCabal: null,
  currentChannel: 'default',
  dialogs: {
    delete: {
      cabal: null
    }
  },
  cabals: {}
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
      const { [action.addr]: del, ...cabals } = state.cabals
      return {...state, cabals}
    case 'DIALOGS_DELETE_CLOSE':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          delete: {
            cabal: null
          }
        }
      }
    case 'DIALOGS_DELETE_OPEN':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          delete: {
            cabal: action.addr
          }
        }
      }
    default:
      return defaultState
  }
}

export default reducer
