import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'

const mapStateToProps = state => ({
  show: state.screen === 'main',
  meshes: state.meshes,
  mesh: state.meshes[state.currentMesh]
})

const mapDispatchToProps = dispatch => ({})

class messagesScreen extends Component {
  render () {
    console.log(this.state)
    const { show, mesh } = this.props

    if (!show || !mesh) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }
    var messageKeys = Object.keys(mesh.messages)

    return (
      <div>
        <div>{mesh.addr}</div>
        {messageKeys.map((key) => {
          var message = mesh.messages[key]
          return (<div>
            [{message.utcDate.toString()}] {message.username}: {message.message}
          </div>)
        })}
      </div>
    )
  }
}

const MessagesContainer = connect(mapStateToProps, mapDispatchToProps)(messagesScreen)

export default MessagesContainer
