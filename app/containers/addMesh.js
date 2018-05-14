import styled from 'styled-components'
import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { hideAddMesh, addMesh } from '../actions'

const mapStateToProps = state => ({
  show: state.screen === 'addMesh'
})

const mapDispatchToProps = dispatch => ({
  add: (input, username) => dispatch(addMesh({input, username})),
  newMesh: (username) => dispatch(addMesh({username})),
  hide: () => dispatch(hideAddMesh())
})

class addMeshScreen extends Component {
  joinMesh (ev) {
    const value = ev.target.value
    if (ev.key !== 'Enter' || !value) return
    ev.target.value = ''
    this.props.add(value)
    this.props.hide()
  }

  newMeshPress (ev) {
    this.props.newMesh()
    this.props.hide()
  }

  joinClick (ev) {
    var el = document.getElementById('add-mesh')
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
      <div className='heading add-mesh'>
        <h1>chatMESH</h1>
        <p className='starterMessage'>
          open-source decentralized private chat
        </p>
        <input type='text'
          className='fun'
          id='add-mesh'
          onKeyDown={this.joinMesh.bind(this)}
          placeholder='Paste dat:// Link and hit Enter' />
          <h2>Don't have a swarm to join yet? <a href="#" onClick={this.newMeshPress.bind(this)}>Create a New One</a></h2>
      </div>
    )
  }
}

const AddMeshContainer = connect(mapStateToProps, mapDispatchToProps)(addMeshScreen)

export default AddMeshContainer
