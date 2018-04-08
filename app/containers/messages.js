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

class messagesScreen extends Component {
  constructor (props) {
    super(props)
  }

  render () {
    const { show, mesh } = this.props

    if (!show) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }

    return (
      <div>
        <div>{mesh}</div>
        <div>my messages</div>
      </div>
    )
  }
}

const MessagesContainer = connect(mapStateToProps, mapDispatchToProps)(messagesScreen)

export default MessagesContainer
