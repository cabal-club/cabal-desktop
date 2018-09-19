import React, { Component } from 'react'
import { connect } from 'react-redux'
// import { addCabal } from '../actions'

const mapStateToProps = state => state

const mapDispatchToProps = dispatch => ({
  hide: () => dispatch({type: 'CHANGE_SCREEN', screen: 'main'})
})

class settingsScreen extends Component {
  onClickClose () {
    this.props.hide()
  }

  render () {
    return (
      <div className='modalScreen'>
        <button className={'modalScreen__close'} onClick={this.onClickClose.bind(this)}>✖️</button>
        <h1>Settings</h1>
      </div>
    )
  }
}

const SettingsContainer = connect(mapStateToProps, mapDispatchToProps)(settingsScreen)

export default SettingsContainer
