import ReactDOM from 'react-dom'
import React, { Fragment, Component } from 'react'
import strftime from 'strftime'
import { connect } from 'react-redux'

import Sidebar from './sidebar'
import WriteContainer from './write'

const mapStateToProps = state => ({
  show: state.screen === 'main',
  addr: state.currentCabal,
  cabal: state.cabales[state.currentCabal]
})

var _tzoffset = new Date().getTimezoneOffset()*60*1000

const mapDispatchToProps = dispatch => ({})

class LayoutScreen extends Component {
  constructor (props) {
    super(props)
    this.shouldAutoScroll = true
    this.scrollTop = 0
    this.composerHeight = 48
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
    const { show, cabal } = this.props
    var self = this

    if (!show || !cabal) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }
    var messageKeys = Object.keys(cabal.messages)
    var lastAuthor = null

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

                  var message = cabal.messages[key]
                  var date = strftime('%H:%M', new Date(message.utcDate + _tzoffset))
                  var repeatedAuthor = message.username === lastAuthor
                  var me = message.username === cabal.username
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

const Layout = connect(mapStateToProps, mapDispatchToProps)(LayoutScreen)

export default Layout
