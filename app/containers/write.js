import form from 'get-form-data'
import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { addMessage, onCommand } from '../actions'

const mapStateToProps = state => ({
  show: state.screen === 'main',
  addr: state.currentCabal,
  cabal: state.cabales[state.currentCabal]
})

const mapDispatchToProps = dispatch => ({
  addMessage: ({addr, message}) => dispatch(addMessage({addr, message})),
  onCommand: ({addr, message}) => dispatch(onCommand({addr, message}))
})

class writeScreen extends Component {
  constructor (props) {
    super(props)
    this.minimumHeight = 48
    this.defaultHeight = 17 + this.minimumHeight
  }

  onCommand (message) {
  }

  onsubmit (e) {
    const data = form(e.target)
    var el = document.querySelector('#message-bar')
    el.value = ''
    const {addr, addMessage, onCommand} = this.props
    var opts = {message: data.message, addr}
    if (data.message.startsWith('/')) onCommand(opts)
    else addMessage(opts)
    e.preventDefault()
    e.stopPropagation()
  }

  componentWillMount () {
    window.addEventListener('keydown', this.onkeydown)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onkeydown)
  }

  render () {
    const { cabal, show } = this.props

    if (!show || !cabal) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }
    return (
      <form onSubmit={this.onsubmit.bind(this)}>
        <input type='text'
          id='message-bar'
          name='message'
          className='fun composer'
          aria-label='Enter a message and press enter'
          placeholder='Enter a message and press enter' />
      </form>
    )
  }
}

const WriteContainer = connect(mapStateToProps, mapDispatchToProps)(writeScreen)

export default WriteContainer
