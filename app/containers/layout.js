import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'

import { getMessages } from '../actions'
import Sidebar from './sidebar'
import WriteContainer from './write'
import MessagesContainer from './messages'

const mapStateToProps = state => ({
  show: state.screen === 'main',
  addr: state.currentCabal,
  cabal: state.cabales[state.currentCabal]
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
    const { show, cabal } = this.props
    var self = this

    if (!show || !cabal) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }

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
            <MessagesContainer
              cabal={cabal}
              composerHeight={self.composerHeight}
              onscroll={onscroll.bind(self)} />
            <WriteContainer />
          </div>
        </div>
      </div>
    )
  }
}

const Layout = connect(mapStateToProps, mapDispatchToProps)(LayoutScreen)

export default Layout
