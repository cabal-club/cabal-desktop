const defaultState = {
  screen: 'addMesh',
  currentMesh: null,
  dialogs: {
    delete: {
      mesh: null
    }
  },
  meshes: {}
}

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'SHOW_ADD_MESH':
      return {
        ...state,
        screen: 'addMesh'
      }
    case 'HIDE_ADD_MESH':
      return {
        ...state,
        screen: 'main'
      }
    case 'VIEW_MESH':
      return {
        ...state,
        currentMesh: action.mesh
      }
    case 'ADD_MESH':
      return {
        ...state,
        meshes: {
          ...state.meshes,
          [action.addr]: action.mesh
        }
      }
    case 'DELETE_MESH':
      const { [action.addr]: del, ...meshes } = state.meshes
      return {...state, meshes}
    case 'DIALOGS_DELETE_CLOSE':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          delete: {
            mesh: null
          }
        }
      }
    case 'DIALOGS_DELETE_OPEN':
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          delete: {
            mesh: action.addr
          }
        }
      }
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.key]: action.value
        }
      }
  }
}

export default reducer
