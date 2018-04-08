import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { addMessage } from '../actions'

const mapStateToProps = state => ({
  show: state.screen === 'main',
  mesh: state.currentMesh
})

const mapDispatchToProps = dispatch => ({
  addMessage: (message) => addMessage(message)
})

class writeScreen extends Component {
  constructor (props) {
    super(props)
    this.onkeydown = this.onkeydown.bind(this)
  }

  onkeydown (e) {
    const value = e.target.value
    if (e.key !== 'Enter' || !value) return
    e.target.value = ''
    this.props.addMessage(value)
  }

  componentWillMount () {
    window.addEventListener('keydown', this.onkeydown)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onkeydown)
  }

  render () {
    const { show, mesh } = this.props
    console.log(mesh)

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
          name='add-message'
          className='input-reset f7 f6-l'
          onKeyDown={this.onkeydown}
          placeholder='Say something..' />
      </div>
    )
  }
}

const WriteContainer = connect(mapStateToProps, mapDispatchToProps)(writeScreen)

export default WriteContainer
