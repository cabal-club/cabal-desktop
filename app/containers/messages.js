import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { addMessage } from '../actions'

const mapStateToProps = state => ({
  show: state.screen === 'main'
})

const mapDispatchToProps = dispatch => ({
  addMessage: (message) => addMessage(message)
})

class messagesScreen extends Component {
  constructor (props) {
    super(props)
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
      my messages
      </div>
    )
  }
}

const MessagesContainer = connect(mapStateToProps, mapDispatchToProps)(messagesScreen)

export default MessagesContainer
