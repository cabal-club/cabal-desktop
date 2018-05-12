import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { addMessage } from '../actions'

const mapStateToProps = state => ({
  show: state.screen === 'main',
  addr: state.currentMesh
})

const mapDispatchToProps = dispatch => ({
  addMessage: ({addr, message}) => dispatch(addMessage({addr, message}))
})

class writeScreen extends Component {
  constructor (props) {
    super(props)
    this.onkeydown = this.onkeydown.bind(this)
  }

  onkeydown (e) {
    const message = e.target.value
    if (e.key !== 'Enter' || !message) return
    e.target.value = ''
    const {addr, addMessage} = this.props
    addMessage({message, addr})
  }

  componentWillMount () {
    window.addEventListener('keydown', this.onkeydown)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onkeydown)
  }

  render () {
    const { show, addr } = this.props

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
