import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { hideAddMesh, addMesh } from '../actions'

const mapStateToProps = state => ({
  show: state.screen === 'addMesh'
})

const mapDispatchToProps = dispatch => ({
  add: (input, username) => dispatch(addMesh({input, username})),
  hide: () => dispatch(hideAddMesh())
})

class addMeshScreen extends Component {
  constructor (props) {
    super(props)
    this.onkeydown = this.onkeydown.bind(this)
  }

  onkeydown (ev) {
    const value = ev.target.value
    if (ev.key !== 'Enter' || !value) return
    ev.target.value = ''
    console.log('adding mesh', value)
    this.props.add(value)
    this.props.hide()
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
        <h1>Join a Chat Mesh</h1>
        <input type='text'
          name='add-mesh'
          className='input-reset f7 f6-l'
          onKeyDown={this.onkeydown}
          placeholder='Put Address Here' />
      </div>
    )
  }
}

const AddMeshContainer = connect(mapStateToProps, mapDispatchToProps)(addMeshScreen)

export default AddMeshContainer
