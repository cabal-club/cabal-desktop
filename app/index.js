import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose } from 'redux'
import reducer from './reducer'
import { loadFromDisk, addMessage, addMesh, viewMesh } from './actions'
import App from './app'
import logger from 'redux-logger'
import thunk from 'redux-thunk'
import { ipcRenderer as ipc } from 'electron'

const store = createStore(
  reducer,
  compose(applyMiddleware(thunk, logger))
)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('div')
)

store.dispatch(loadFromDisk())

ipc.on('addMessage', message => store.dispatch(addMessage({ message })))
ipc.on('addMesh', (link, username) => store.dispatch(addMesh({ link, username })))
ipc.on('viewMesh', (addr) => store.dispatch(viewMesh({addr})))
