import React, { Component } from 'react'
import { connect } from 'react-redux'
// import { addCabal } from '../actions'

import { version } from '../../package.json'

const mapStateToProps = state => state

const mapDispatchToProps = dispatch => ({
  hide: () => dispatch({ type: 'CHANGE_SCREEN', screen: 'main' })
})

class AppSettingsScreen extends Component {
  onClickClose () {
    this.props.hide()
  }

  render () {
    return (
      <div className='modalScreen app-settings'>
        <div className='modalScreen__header'>
          <button className='modalScreen__close' onClick={this.onClickClose.bind(this)}>✖️</button>
          <h1>Cabal Desktop Settings</h1>
        </div>

        <div className='modalScreen__body body'>
          Nothing to set at the moment. 🤷‍♀️
        </div>

        <div className='footer'>
          Version {version}
        </div>
      </div>
    )
  }
}

const AppSettingsContainer = connect(mapStateToProps, mapDispatchToProps)(AppSettingsScreen)

export default AppSettingsContainer
