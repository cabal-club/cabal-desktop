import ReactDOM from 'react-dom'
import React, { Fragment, Component } from 'react'
import strftime from 'strftime'
import { connect } from 'react-redux'

import WriteContainer from './write'

const mapStateToProps = state => ({
  show: state.screen === 'main',
  addr: state.currentMesh,
  mesh: state.meshes[state.currentMesh]
})

const mapDispatchToProps = dispatch => ({})

class messagesScreen extends Component {
  constructor (props) {
    super(props)
    this.shouldAutoScroll = true
    this.scrollTop = 0
    this.composerHeight = 48
  }
  selectChannel (channel) {
    console.log('hehehe wowww scorrree')
  }

  componentDidMount () {
    var messagesDiv = document.querySelector('.messages')
    if (messagesDiv) messagesDiv.scrollTop = this.scrollTop
  }
  
  componentDidUpdate() {
    this.scrollToBottom()
  }

  scrollToBottom (force) {
    if (!force && !this.shouldAutoScroll) return
    var messagesDiv = document.querySelector('.messages')
    if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight
  }

  render () {
    const { show, mesh } = this.props
    var self = this

    if (!show || !mesh) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }
    var messageKeys = Object.keys(mesh.messages)
    var userKeys = Object.keys(mesh.users)
    var channels = ['#general']
    var channelKeys = Object.keys(channels)
    var lastAuthor = null

    function onscroll (event) {
      var node = event.target
      if (node.scrollHeight <= node.clientHeight + node.scrollTop) self.shouldAutoScroll = true
      else self.shouldAutoScroll = false
    }

    return (
      <div className='layout'>
        <div className='sidebar'>
          <div className='sidebar-scroll'>
            <div className='channels'>
              <div className='heading'>Channels</div>
              <ul>
                {
                  channelKeys.map((channel) =>
                    <li className='active'>
                      <button onClick={self.selectChannel.bind(channel, this)}>
                        {channel}
                      </button>
                    </li>
                  )
                }
              </ul>
            </div>
            <div className='users-container'>
              <div className='heading'>Users</div>
              <ul className='users'>
                {
                  userKeys.map((username) =>
                    <li className=''>
                      {username}
                    </li>
                  )
                }
              </ul>
            </div>
          </div>
        </div>
        <div class='content'>
          <div className='messages-container'>
            <div className='top-bar'>
              <div className='channel-name'>{mesh.addr} {mesh.users.length}</div>
            </div>
            {messageKeys.length === 0 &&
              <div className='messages starterMessage'>
              'This is a new channel. Send a message to start things off!'
              </div>
            }
            {messageKeys.length > 0 &&
              <div className='messages'
                onScroll={onscroll}
                style={{paddingBottom: self.composerHeight}}>
                {messageKeys.map((key) => {

                  var message = mesh.messages[key]
                  var date = strftime('%H:%M', message.utcDate)
                  var repeatedAuthor = message.username === lastAuthor
                  var me = message.username === mesh.username
                  lastAuthor = message.username

                  return (<li className={(me ? 'me' : '') + ' message clearfix'}>
                    {!repeatedAuthor && <div className='username'>{message.username}</div>}
                    <div className='message-meta'>
                      <div className='text'>{message.message}</div>
                      <span className='timestamp'>{date}</span>
                    </div>
                  </li>)
                })}
              </div>
            }
            <WriteContainer />
          </div>
        </div>
      </div>
    )
  }
}

const MessagesContainer = connect(mapStateToProps, mapDispatchToProps)(messagesScreen)

export default MessagesContainer
