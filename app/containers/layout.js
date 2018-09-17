import React, { Fragment, Component } from 'react'
import { clipboard, ipcRenderer } from 'electron'
import { connect } from 'react-redux'

import { changeScreen, getMessages, viewCabal } from '../actions'
import CabalsList from './cabalsList'
import Sidebar from './sidebar'
import WriteContainer from './write'
import MessagesContainer from './messages'

const mapStateToProps = state => ({
  addr: state.currentCabal,
  cabal: state.cabals[state.currentCabal],
  cabals: state.cabals
})

const mapDispatchToProps = dispatch => ({
  getMessages: ({addr, channel, count}) => dispatch(getMessages({addr, channel, count})),
  changeScreen: ({screen, addr}) => dispatch(changeScreen({screen, addr})),
  viewCabal: ({addr}) => dispatch(viewCabal({addr}))
})

class LayoutScreen extends Component {
  constructor (props) {
    super(props)
    this.state = {showEmojiPicker: false}
    this.shouldAutoScroll = true
    this.scrollTop = 0
    this.composerHeight = 55
    this.toggleEmoji = this.toggleEmoji.bind(this)
    this.handleOpenCabalUrl = this.handleOpenCabalUrl.bind(this)
  }

  componentDidMount () {
    var messagesDiv = document.querySelector('.messages')
    if (messagesDiv) messagesDiv.scrollTop = this.scrollTop
    ipcRenderer.on('open-cabal-url', (event, arg) => {
      this.handleOpenCabalUrl(arg)
    })
  }

  componentDidUpdate (prevProps) {
    if (prevProps.cabal != this.props.cabal) {
      this.scrollToBottom()
    }
    // if you're in the same cabal and a new message arrives we should show a button prompting a scroll to bottom
  }

  copyClick () {
    clipboard.writeText('cabal://' + this.props.addr)
    alert('Copied cabal:// link to clipboard! Now give it to people you want to join your Cabal. Only people with the link can join.')
  }

  handleOpenCabalUrl ({url = ''}) {
    let addr = url.replace('cabal://', '').trim()
    if (this.props.cabals[addr]) {
      this.props.viewCabal({addr})
    } else {
      this.props.changeScreen({screen: 'addCabal', addr: url})
    }
  }

  scrollToBottom (force) {
    if (!force && !this.shouldAutoScroll) return
    var messagesDiv = document.querySelector('.window__main')
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight
    }
  }

  toggleEmoji (bool) {
    this.setState({showEmojiPicker: bool === false ? false : !this.state.showEmojiPicker})
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

    var onscroll = (event) => {
      var node = event.target
      if (node.scrollHeight <= node.clientHeight + node.scrollTop) {
        self.shouldAutoScroll = true
      } else {
        self.shouldAutoScroll = false
      }
    }

    return (
      <div className='client'>
        <CabalsList toggleEmojis={this.toggleEmoji} />
        <Sidebar toggleEmojis={this.toggleEmoji} />
        <div className='client__main'>
          <div className='window'>
            <div className='window__header'>
              <div className='channel-meta'>
                <div className='channel-meta__data'>
                  <div className='channel-meta__data__details'>
                    <h1>#{cabal.channel}</h1>
                    {/* <h2>{Object.keys(cabal.users).length} peers connected</h2> */}
                  </div>
                </div>
                <div className='channel-meta__other'>
                  <div className='channel-meta__other__share' onClick={self.copyClick.bind(self)}>Share Cabal</div>
                  {/* <div className='channel-meta__other__more'><img src='static/images/icon-channelother.svg' /></div> */}
                </div>
              </div>
            </div>
            <div className='window__main'>
              <MessagesContainer
                cabal={cabal}
                composerHeight={self.composerHeight}
                onscroll={onscroll.bind(self)}
                toggleEmojis={this.toggleEmoji}
              />
            </div>
            <WriteContainer showEmojiPicker={this.state.showEmojiPicker} toggleEmojis={this.toggleEmoji} />
          </div>
        </div>
      </div>
    )
  }
}

const Layout = connect(mapStateToProps, mapDispatchToProps)(LayoutScreen)

export default Layout
