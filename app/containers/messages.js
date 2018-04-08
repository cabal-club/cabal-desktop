import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { addMessage } from '../actions'

const mapStateToProps = state => ({
  show: state.screen === 'main',
  messages: ['this', 'is', 'a', 'test']
})

const mapDispatchToProps = dispatch => ({
  addMessage: (message) => addMessage(message)
})

class messagesScreen extends Component {
  constructor (props) {
    super(props)
    this.onkeydown = this.onkeydown.bind(this)
  }

  componentWillMount () {
    window.addEventListener('keydown', this.onkeydown)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onkeydown)
  }

  render () {
    const { show, messages } = this.props

    if (!show) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }

    if (!messages || !messages.length) return <div />

    return (
      <div>
        {messages.map(line => (
          <div>{line}</div>
        ))}
      </div>
    )
  }
}

const MessagesContainer = connect(mapStateToProps, mapDispatchToProps)(messagesScreen)

export default MessagesContainer
