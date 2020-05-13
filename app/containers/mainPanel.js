import React, { Component } from 'react'
import { clipboard, ipcRenderer } from 'electron'
import { connect } from 'react-redux'
import prompt from 'electron-prompt'
import debounce from 'lodash.debounce'
import {
  changeScreen,
  hideEmojiPicker,
  leaveChannel,
  setChannelTopic,
  showCabalSettings,
  viewCabal
} from '../actions'
import CabalSettings from './cabalSettings'
import ChannelBrowser from './channelBrowser'
import WriteContainer from './write'
import MessagesContainer from './messages'
import { currentChannelMemberCountSelector } from '../selectors'

const mapStateToProps = state => ({
  addr: state.currentCabal,
  cabal: state.cabals[state.currentCabal],
  cabals: state.cabals,
  cabalSettingsVisible: state.cabalSettingsVisible,
  channelBrowserVisible: state.channelBrowserVisible,
  emojiPickerVisible: state.emojiPickerVisible,
  channelMemberCount: currentChannelMemberCountSelector(state)
})

const mapDispatchToProps = dispatch => ({
  changeScreen: ({ screen, addr }) => dispatch(changeScreen({ screen, addr })),
  hideEmojiPicker: () => dispatch(hideEmojiPicker()),
  setChannelTopic: ({ addr, channel, topic }) =>
    dispatch(setChannelTopic({ addr, channel, topic })),
  showCabalSettings: ({ addr }) => dispatch(showCabalSettings({ addr })),
  viewCabal: ({ addr }) => dispatch(viewCabal({ addr })),
  leaveChannel: ({ addr, channel }) => dispatch(leaveChannel({ addr, channel }))
})

class MainPanel extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showScrollToBottom: false
    }
    this.shouldAutoScroll = true
    this.scrollTop = 0
    this.composerHeight = 55
    this.scrollEl = null
    this.handleOpenCabalUrl = this.handleOpenCabalUrl.bind(this)
    this.setScrollToBottomButtonStatus = this.setScrollToBottomButtonStatus.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
  }

  componentDidMount () {
    const self = this
    var messagesDiv = document.querySelector('.messages')
    if (messagesDiv) messagesDiv.scrollTop = this.scrollTop
    var messagesContainerDiv = document.querySelector('.window__main')
    if (messagesContainerDiv) {
      messagesContainerDiv.addEventListener(
        'scroll',
        self.onScrollMessages.bind(this)
      )
    }
    ipcRenderer.on('open-cabal-url', (event, arg) => {
      this.handleOpenCabalUrl(arg)
    })

    this.scrollEl?.addEventListener(
      'scroll',
      debounce(this.setScrollToBottomButtonStatus, 500)
    )
  }

  setScrollToBottomButtonStatus () {
    const totalHeight = this.scrollEl?.scrollHeight
    const scrolled = this.scrollEl?.scrollTop
    const containerHeight = this.scrollEl?.offsetHeight
    if (scrolled < totalHeight - containerHeight) {
      this.setState({
        showScrollToBottom: true
      })
    } else if (scrolled >= totalHeight - containerHeight) {
      this.setState({
        showScrollToBottom: false
      })
    }
  }

  scrollToBottom () {
    this.scrollEl?.scrollBy(0, this.scrollEl?.scrollHeight)
  }

  componentWillUnmount () {
    const self = this
    var messagesContainerDiv = document.querySelector('.window__main')
    if (messagesContainerDiv) {
      messagesContainerDiv.removeEventListener(
        'scroll',
        self.onScrollMessages.bind(this)
      )
    }
  }

  componentDidUpdate (prevProps) {
    if ((prevProps.channelBrowserVisible !== this.props.channelBrowserVisible) ||
      (prevProps.cabalSettingsVisible !== this.props.cabalSettingsVisible)) {
      this.scrollToBottom()
    }
    if (prevProps.cabal !== this.props.cabal) {
      if (document.hasFocus()) {
        this.scrollToBottom()
      } else {
        this.setScrollToBottomButtonStatus()
      }
    }
  }

  onClickTopic () {
    prompt({
      title: 'Set channel topic',
      label: 'New topic',
      value: this.props.cabal.topic,
      type: 'input'
    })
      .then(topic => {
        if (topic && topic.trim().length > 0) {
          this.props.cabal.topic = topic
          this.props.setChannelTopic({
            addr: this.props.cabal.addr,
            channel: this.props.cabal.channel,
            topic
          })
        }
      })
      .catch(() => {
        console.log('cancelled new topic')
      })
  }

  onClickLeaveChannel () {
    this.props.leaveChannel({
      addr: this.props.cabal.addr,
      channel: this.props.cabal.channel
    })
  }

  handleOpenCabalUrl ({ url = '' }) {
    const addr = url.replace('cabal://', '').trim()
    if (this.props.cabals[addr]) {
      this.props.viewCabal({ addr })
    } else {
      this.props.changeScreen({ screen: 'addCabal', addr: url })
    }
  }

  onScrollMessages (event) {
    var element = event.target
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      this.shouldAutoScroll = true
    } else {
      this.shouldAutoScroll = false
    }
  }

  hideModals () {
    if (this.props.emojiPickerVisible) {
      this.props.hideEmojiPicker()
    }
  }

  scrollToBottom (force) {
    if (!force && !this.shouldAutoScroll) return
    var messagesDiv = document.querySelector('.window__main')
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight
    }
  }

  showCabalSettings (addr) {
    this.props.showCabalSettings({ addr })
  }

  copyClick () {
    clipboard.writeText('cabal://' + this.props.addr)
    window.alert(
      'Copied cabal:// link to clipboard! Now give it to people you want to join your Cabal. Only people with the link can join.'
    )
  }

  render () {
    const { cabal, toggleMemberList, channelMemberCount } = this.props
    var self = this

    if (!cabal) {
      return (
        <>
          <div />
        </>
      )
    } else if (this.props.channelBrowserVisible) {
      return <ChannelBrowser />
    } else if (this.props.cabalSettingsVisible) {
      return <CabalSettings />
    }

    return (
      <div className='client__main' onClick={this.hideModals.bind(this)}>
        <div className='window'>
          <div className='window__header'>
            <div className='channel-meta'>
              <div className='channel-meta__data'>
                <div className='channel-meta__data__details'>
                  <h1>#{cabal.channel}</h1>
                  <h2>
                    <span
                      className='channel-meta__data__topic'
                      onClick={this.onClickTopic.bind(this)}
                    >
                      {' '}
                      {cabal.topic || 'Add a topic'}
                    </span>
                    <span
                      className='channel-meta__data__topic'
                      onClick={this.onClickLeaveChannel.bind(this)}
                    >
                      {' '}
                      | Leave Channel
                    </span>
                  </h2>
                </div>
              </div>
              <div className='channel-meta__other'>
                <div className='channel-meta__other__members' onClick={toggleMemberList}>
                  <img src='static/images/user-icon.svg' />
                  <div className='channel-meta__other__members__count'>{channelMemberCount}</div>
                </div>
                <div
                  onClick={this.showCabalSettings.bind(this, this.props.addr)}
                  className='channel-meta__other__more'
                >
                  <img src='static/images/icon-channelother.svg' />
                </div>
                <div
                  className='button channel-meta__other__share'
                  onClick={self.copyClick.bind(self)}
                >
                  Share Cabal
                </div>
              </div>
            </div>
          </div>
          <div
            className='window__main'
            ref={el => {
              this.scrollEl = el
            }}
          >
            <MessagesContainer
              cabal={cabal}
              composerHeight={self.composerHeight}
            />
          </div>
          <WriteContainer
            showScrollToBottom={this.state.showScrollToBottom}
            scrollToBottom={this.scrollToBottom}
          />
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MainPanel)
