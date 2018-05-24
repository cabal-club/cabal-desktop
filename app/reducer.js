const defaultState = {
  screen: 'addCabal',
  currentCabal: null,
  currentChannel: '#general',
  dialogs: {
    delete: {
      cabal: null
    }
  },
  cabales: {}
}

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'SHOW_ADD_CABAL':
      return {
        ...state,
        screen: 'addcabal'
      }
    case 'HIDE_ADD_CABAL':
      return {
        ...state,
        screen: 'main'
      }
    case 'VIEW_CABAL':
      return {
        ...state,
        currentCabal: action.addr
      }
    case 'ADD_CABAL':
      return {
        ...state,
        cabales: {
          ...state.cabales,
          [action.addr]: {
            ...action,
            messages: {}
          }
        }
      }
    case 'UPDATE_CABAL':
      var cabal = state.cabales[action.addr]
      return {
        ...state,
        cabales: {
          ...state.cabales,
          [action.addr]: {
            ...cabal,
            ...action
          }
        }
      }
    case 'ADD_LINE':
      var cabal = state.cabales[action.addr]
      if (!cabal.messages) cabal.messages = {}
      return {
        ...state,
        cabales: {
          ...state.cabales,
          [action.addr]: {
            ...cabal,
            messages: {
              ...cabal.messages,
              [action.row.key]: {
                utcDate: action.utcDate,
                username: action.row.value.author,
                message: action.row.value.content
              }
            }
          }
        }
      }
    case 'DELETE_CABAL':
      const { [action.addr]: del, ...cabales } = state.cabales
      return {...state, cabales}
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
