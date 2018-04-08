import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { addMessage } from '../actions'

const mapStateToProps = state => ({
  show: state.screen === 'main',
  mesh: state.meshes[state.currentMesh]
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

    if (!show || !mesh) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }
    console.log(mesh.messages)

    return (
      <div>
        <div>{mesh.addr}</div>
        {mesh.messages.map((key) => {
          console.log(key)

        })}
      </div>
    )
  }
}

const MessagesContainer = connect(mapStateToProps, mapDispatchToProps)(messagesScreen)

export default MessagesContainer
