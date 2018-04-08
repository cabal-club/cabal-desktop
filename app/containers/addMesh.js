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
  constructor (props) {
    super(props)
  }

  render () {
    const { hide, show, add, newMesh } = this.props
    if (!show) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }

    function joinMesh (ev) {
      const value = ev.target.value
      if (ev.key !== 'Enter' || !value) return
      ev.target.value = ''
      add(value)
      hide()
    }

    function newMeshPress (ev) {
      newMesh()
      hide()
    }

    return (
      <div>
        <h1>Join Existing Mesh</h1>
        <input type='text'
          name='add-mesh'
          className='input-reset f7 f6-l'
          onKeyDown={joinMesh}
          placeholder='Put Address Here' />
        <h2>Create New Mesh</h2>
        <button onClick={newMeshPress}>Create a New Mesh</button>
      </div>
    )
  }
}

const AddMeshContainer = connect(mapStateToProps, mapDispatchToProps)(addMeshScreen)

export default AddMeshContainer
