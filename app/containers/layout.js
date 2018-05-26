import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'

import { getMessages } from '../actions'
import Sidebar from './sidebar'
import WriteContainer from './write'

const mapStateToProps = state => ({
  addr: state.currentCabal,
  cabal: state.cabals[state.currentCabal]
})

const mapDispatchToProps = dispatch => ({
  getMessages: ({addr, channel, count}) => dispatch(getMessages({addr, channel, count}))
})

class LayoutScreen extends Component {
  constructor (props) {
    super(props)
    this.shouldAutoScroll = true
    this.scrollTop = 0
    this.composerHeight = 55
  }

  componentDidMount () {
    var messagesDiv = document.querySelector('.messages')
    if (messagesDiv) messagesDiv.scrollTop = this.scrollTop
  }

  componentDidUpdate () {
    this.scrollToBottom()
  }

  scrollToBottom (force) {
    if (!force && !this.shouldAutoScroll) return
    var messagesDiv = document.querySelector('.messages')
    if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight
  }

  render () {
    const { cabal } = this.props
    var self = this

    if (!cabal) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }
    var lastAuthor = null
    var messages = cabal.messages

    function onscroll (event) {
      var node = event.target
      if (node.scrollHeight <= node.clientHeight + node.scrollTop) self.shouldAutoScroll = true
      else self.shouldAutoScroll = false
    }

    return (
      <div className='layout'>
        <Sidebar />
        <div className='content'>
          <div className='messages-container'>
            <div className='top-bar'>
              <div className='channel-name'>{cabal.channel}</div>
            </div>
            {messages.length === 0 &&
              <div className='messages starterMessage'>
              'This is a new channel. Send a message to start things off!'
              </div>
            }
            {messages.length > 0 &&
              <div className='messages'
                onScroll={onscroll}
                style={{paddingBottom: self.composerHeight}}>
                {messages.map((message) => {
                  var repeatedAuthor = message.author === lastAuthor
                  var me = message.author === cabal.username
                  lastAuthor = message.author
                  if (message.type === 'local/system') {
                    return (<li className='system message clearfix'>
                      <div className='author'>System</div>
                      <pre>{message.content}</pre>
                    </li>)
                  }
                  if (message.type === 'chat/text') {
                    return (<li className={(me ? 'me' : '') + ' message clearfix'}>
                      {!repeatedAuthor && <div className='author'>{message.author}</div>}
                      <div className='message-meta'>
                        <div className='text'>{message.content}</div>
                        <span className='timestamp'>{message.time}</span>
                      </div>
                    </li>)
                  }
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

const Layout = connect(mapStateToProps, mapDispatchToProps)(LayoutScreen)

export default Layout
