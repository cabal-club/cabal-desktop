import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { hideAddCabal, addCabal } from '../actions'

const mapStateToProps = state => ({
  show: state.screen === 'addCabal'
})

const mapDispatchToProps = dispatch => ({
  add: (input, username) => dispatch(addCabal({input, username})),
  newCabal: (username) => dispatch(addCabal({username})),
  hide: () => dispatch(hideAddCabal())
})

class addCabalScreen extends Component {
  joinCabal (ev) {
    const value = ev.target.value
    if (ev.key !== 'Enter' || !value) return
    ev.target.value = ''
    this.props.add(value)
    this.props.hide()
  }

  newCabalPress (ev) {
    this.props.newCabal()
    this.props.hide()
  }

  joinClick (ev) {
    var el = document.getElementById('add-cabal')
    if (el.value) {
      this.props.add(el.value)
      this.props.hide()
    }
    if (ev) {
      ev.preventDefault()
      ev.stopPropagation()
    }
  }

  render () {
    const { show } = this.props
    if (!show) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }

    return (
      <div className='heading add-cabal'>
        <h1>chatCABAL</h1>
        <p className='starterMessage'>
          open-source decentralized private chat
        </p>
        <input type='text'
          className='fun'
          id='add-cabal'
          onKeyDown={this.joinCabal.bind(this)}
          placeholder='Paste dat:// Link and hit Enter' />
          <h2>Don't have a swarm to join yet? <a href="#" onClick={this.newCabalPress.bind(this)}>Create a New One</a></h2>
      </div>
    )
  }
}

const AddCabalContainer = connect(mapStateToProps, mapDispatchToProps)(addCabalScreen)

export default AddCabalContainer
