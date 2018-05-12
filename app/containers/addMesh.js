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
    ev.preventDefault()
    ev.stopPropagation()
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
      <div>
        <input type='text'
          id='add-mesh'
          className='input-reset f7 f6-l'
          onKeyDown={this.joinMesh.bind(this)}
          placeholder='Put Address Here' />
        <button onClick={this.joinClick.bind(this)}>Join Mesh</button>
        <button onClick={this.newMeshPress.bind(this)}>Create a New Mesh</button>
      </div>
    )
  }
}

const AddMeshContainer = connect(mapStateToProps, mapDispatchToProps)(addMeshScreen)

export default AddMeshContainer
