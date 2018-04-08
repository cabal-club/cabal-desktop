import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { hideAddMesh, addMesh } from '../actions'

const mapStateToProps = state => ({
  show: state.screen === 'addMesh'
})

const mapDispatchToProps = dispatch => ({
  addMesh: (link, username) => addMesh(link, username),
  hide: () => dispatch(hideAddMesh())
})

class addMeshScreen extends Component {
  constructor (props) {
    super(props)
    this.onkeydown = this.onkeydown.bind(this)
  }

  onkeydown (ev) {
    if (ev.code !== 'Escape') return
    window.removeEventListener('keydown', this.onkeydown)
    this.props.hide()
  }

  componentWillMount () {
    window.addEventListener('keydown', this.onkeydown)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onkeydown)
  }

  render () {
    const { show, addMesh } = this.props

    const onKeyDown = e => {
      const value = e.target.value
      if (e.key !== 'Enter' || !value) return
      e.target.value = ''
      addMesh(value)
    }

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
        onKeyDown={onKeyDown}
        placeholder='Put Address Here' />
      </div>
    )
  }
}

const AddMeshContainer = connect(mapStateToProps, mapDispatchToProps)(addMeshScreen)

export default AddMeshContainer
