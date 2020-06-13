import React, { Component } from 'react'
import { connect } from 'react-redux'
import { addCabal } from '../actions'

const mapStateToProps = state => state

const mapDispatchToProps = dispatch => ({
  addCabal: ({ addr, isNewlyAdded, username }) => dispatch(addCabal({ addr, isNewlyAdded, username })),
  newCabal: (username) => dispatch(addCabal({ username })),
  hide: () => dispatch({ type: 'CHANGE_SCREEN', screen: 'main' })
})

class addCabalScreen extends Component {
  onClickClose () {
    this.props.hide()
  }

  newCabalPress (ev) {
    this.props.newCabal()
    this.props.hide()
  }

  onClickJoin () {
    var cabal = document.getElementById('add-cabal')
    var nickname = document.getElementById('nickname')
    if (cabal.value) {
      this.props.addCabal({
        addr: cabal.value,
        isNewlyAdded: true,
        username: nickname.value
      })
      this.props.hide()
    }
  }

  onPressEnter (event) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    event.stopPropagation()
    this.onClickJoin()
  }

  render () {
    return (
      <div className='modalScreen add-cabal'>
        <div className='modalScreen__header'>
          {this.props.cabals && !!Object.keys(this.props.cabals).length &&
            <button className='modalScreen__close' onClick={this.onClickClose.bind(this)}>✖️</button>}
        </div>
        <h1>Cabal</h1>
        <p className='starterMessage'>
          open-source decentralized private chat
        </p>
        <hr />
        <input
          type='text'
          className='fun'
          id='add-cabal'
          onKeyDown={this.onPressEnter.bind(this)}
          placeholder='Paste cabal:// link and hit Enter'
          defaultValue={this.props.addr}
        />
        <input
          type='text'
          className='fun'
          id='nickname'
          onKeyDown={this.onPressEnter.bind(this)}
          name='nickname'
          placeholder='Pick a nickname'
        />
        <a className='button' href='#' onClick={this.onClickJoin.bind(this)}>
          Join
        </a>
        <hr />
        <h2>
          Don't have a swarm to join yet?<br /><br />
          <a className='button' href='#' onClick={this.newCabalPress.bind(this)}>
            Create a Cabal
          </a>
        </h2>
      </div>
    )
  }
}

const AddCabalContainer = connect(mapStateToProps, mapDispatchToProps)(addCabalScreen)

export default AddCabalContainer
