import React, { Component } from 'react'
import { connect } from 'react-redux'
// import { addCabal } from '../actions'

const mapStateToProps = state => state

const mapDispatchToProps = dispatch => ({
  hide: () => dispatch({type: 'CHANGE_SCREEN', screen: 'main'})
})

class AppSettingsScreen extends Component {
  onClickClose () {
    this.props.hide()
  }

  render () {
    return (
      <div className='modalScreen'>
        <div className='modalScreen__header'>
          <button className={'modalScreen__close'} onClick={this.onClickClose.bind(this)}>✖️</button>
          <h1>Cabal Desktop Settings</h1>
        </div>

        <div className='modalScreen__body'>
          
        </div>
      </div>
    )
  }
}

const AppSettingsContainer = connect(mapStateToProps, mapDispatchToProps)(AppSettingsScreen)

export default AppSettingsContainer
