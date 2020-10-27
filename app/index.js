import React from 'react'
import { config } from 'dotenv'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose } from 'redux'
import reducer from './reducer'
import App from './app'
import logger from 'redux-logger'
import thunk from 'redux-thunk'

// load env variables from .env
config()

// Disable debug console.log messages coming from dependencies
window.localStorage.removeItem('debug')

const middlewares = [thunk]

if (process.env.ENABLE_APP_LOG) {
  middlewares.push(logger)
}

const store = createStore(
  reducer,
  compose(applyMiddleware(...middlewares))
)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#root')
)
