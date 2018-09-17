import React, { Component } from 'react'
import { connect } from 'react-redux'
import { addCabal } from '../actions'

const mapStateToProps = state => state

const mapDispatchToProps = dispatch => ({
  add: (input, username) => dispatch(addCabal({input, username})),
  newCabal: (username) => dispatch(addCabal({username})),
  hide: () => dispatch({type: 'CHANGE_SCREEN', screen: 'main'})
})

class addCabalScreen extends Component {
  onClickCancel () {
    this.props.hide()
  }

  newCabalPress (ev) {
    this.props.newCabal()
    this.props.hide()
  }

  joinClick (ev) {
    var cabal = document.getElementById('add-cabal')
    var nickname = document.getElementById('nickname')
    if (ev.key !== 'Enter') return
    if (cabal.value) {
      this.props.add(cabal.value, nickname.value)
      this.props.hide()
    }
    if (ev) {
      ev.preventDefault()
      ev.stopPropagation()
    }
  }

  render () {
    return (
      <div className='heading add-cabal'>
        <h1>Cabal</h1>
        <p className='starterMessage'>
          open-source decentralized private chat
        </p>
        <input type='text'
          className='fun'
          id='add-cabal'
          onKeyDown={this.joinClick.bind(this)}
          placeholder='Paste cabal:// link and hit Enter'
          defaultValue={this.props.addr}
        />
        <input type='text'
          className='fun'
          id='nickname'
          onKeyDown={this.joinClick.bind(this)}
          name='nickname'
          placeholder='Pick a nickname' />
        <h2>
          Don't have a swarm to join yet?<br /><br />
          <a href='#' onClick={this.newCabalPress.bind(this)}>
            Create a Cabal
          </a>
        </h2>
        <button onClick={this.onClickCancel.bind(this)}>Cancel</button>
      </div>
    )
  }
}

const AddCabalContainer = connect(mapStateToProps, mapDispatchToProps)(addCabalScreen)

export default AddCabalContainer
