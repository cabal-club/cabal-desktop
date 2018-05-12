import styled from 'styled-components'
import React, { Fragment, Component } from 'react'
import strftime from 'strftime'
import { connect } from 'react-redux'

const MessagesPane = styled.div`
  display: flex;
  margin-top: 40px;
`
const MessagesList = styled.div`
`
const UserListItem = styled.div`
  padding: 5px;
`
const UserList = styled.div`
  min-width: 100px;
`
const Address = styled.div`
  border-bottom: 1px solid darkgrey;
  position: fixed;
  top: 0;
  padding: 10px;
  background-color: aliceblue;
  width: 100%;
`
const Message = styled.div`
  padding: 5px;
  min-height: 20px;

  &.me {
    background-color: wheat;
  }

  .message {
    display: flex;
    justify-content: space-between;
  }

  .date {
    font-size: 12px;
    color: #aaa;
  }
  .username {
    padding: 5px 0px 10px 0px;
    font-weight: bold;
  }

`
const mapStateToProps = state => ({
  show: state.screen === 'main',
  meshes: state.meshes,
  mesh: state.meshes[state.currentMesh]
})

const mapDispatchToProps = dispatch => ({})

class messagesScreen extends Component {
  render () {
    const { show, mesh } = this.props

    if (!show || !mesh) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }
    var messageKeys = Object.keys(mesh.messages)
    var userKeys = Object.keys(mesh.users)
    var lastAuthor = null

    return (
      <div>
        <Address>{mesh.addr}</Address>
        <MessagesPane>
          <MessagesList>
            {messageKeys.map((key) => {
              var message = mesh.messages[key]
              var date = strftime('%H:%M', message.utcDate)
              var repeatedAuthor = message.username === lastAuthor
              var me = message.username === mesh.username
              lastAuthor = message.username
              return (<Message className={me ? 'me' : ''}>
                {!repeatedAuthor && <div className='username'>{message.username}</div>}
                <div className='message'>
                  <div className='text'>{message.message}</div>
                  <div className='date'>{date}</div>
                </div>
              </Message>)
            })}
          </MessagesList>
          <UserList>
            {userKeys.map((username) => <UserListItem>{username}</UserListItem>)}
          </UserList>
        </MessagesPane>
      </div>
    )
  }
}

const MessagesContainer = connect(mapStateToProps, mapDispatchToProps)(messagesScreen)

export default MessagesContainer
