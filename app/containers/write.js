import form from 'get-form-data'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import Mousetrap from 'mousetrap'

import {
  hideEmojiPicker,
  listCommands,
  processLine,
  setScreenViewHistoryPostion,
  showEmojiPicker,
  viewCabal,
  viewChannel,
  viewNextChannel,
  viewPreviousChannel
} from '../actions'

import '../../node_modules/emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'

const mapStateToProps = state => {
  var cabal = state.cabals[state.currentCabal]
  return {
    addr: state.currentCabal,
    cabal,
    cabalIdList: Object.keys(state.cabals).sort() || [],
    currentChannel: state.currentChannel,
    emojiPickerVisible: state.emojiPickerVisible,
    screenViewHistory: state.screenViewHistory,
    screenViewHistoryPosition: state.screenViewHistoryPosition,
    users: cabal.users
  }
}

const mapDispatchToProps = dispatch => ({
  hideEmojiPicker: () => dispatch(hideEmojiPicker()),
  listCommands: () => dispatch(listCommands()),
  processLine: ({ addr, message }) => dispatch(processLine({ addr, message })),
  setScreenViewHistoryPostion: ({ index }) => dispatch(setScreenViewHistoryPostion({ index })),
  showEmojiPicker: () => dispatch(showEmojiPicker()),
  viewCabal: ({ addr, skipScreenHistory }) => dispatch(viewCabal({ addr, skipScreenHistory })),
  viewChannel: ({ addr, channel, skipScreenHistory }) => dispatch(viewChannel({ addr, channel, skipScreenHistory })),
  viewNextChannel: ({ addr }) => dispatch(viewNextChannel({ addr })),
  viewPreviousChannel: ({ addr }) => dispatch(viewPreviousChannel({ addr }))
})

class writeScreen extends Component {
  constructor (props) {
    super(props)
    this.minimumHeight = 48
    this.defaultHeight = 17 + this.minimumHeight
    this.focusInput = this.focusInput.bind(this)
    this.clearInput = this.clearInput.bind(this)
    this.resizeTextInput = this.resizeTextInput.bind(this)
    this.addEmoji = this.addEmoji.bind(this)
    Mousetrap.bind(['command+left', 'ctrl+left'], this.viewPreviousScreen.bind(this))
    Mousetrap.bind(['command+right', 'ctrl+right'], this.viewNextScreen.bind(this))
    Mousetrap.bind(['command+n', 'ctrl+n'], this.viewNextChannel.bind(this))
    Mousetrap.bind(['command+p', 'ctrl+p'], this.viewPreviousChannel.bind(this))
    Mousetrap.bind(['command+shift+n', 'ctrl+shift+n'], this.goToNextCabal.bind(this))
    Mousetrap.bind(['command+shift+p', 'ctrl+shift+p'], this.goToPreviousCabal.bind(this))
    Mousetrap.bind(['command+up', 'ctrl+up'], this.goToPreviousCabal.bind(this))
    Mousetrap.bind(['command+down', 'ctrl+down'], this.goToNextCabal.bind(this))
    for (let i = 1; i < 10; i++) {
      Mousetrap.bind([`command+${i}`, `ctrl+${i}`], this.gotoCabal.bind(this, i))
    }
  }

  componentDidMount () {
    this.focusInput()
    this.resizeTextInput()
    window.addEventListener('focus', (e) => this.focusInput())
  }

  gotoCabal (index) {
    const { cabalIdList, viewCabal } = this.props
    if (cabalIdList[index]) {
      viewCabal({ addr: cabalIdList[index] })
    }
  }

  goToPreviousCabal () {
    const { cabalIdList, addr: currentCabal, viewCabal } = this.props
    const currentIndex = cabalIdList.findIndex(i => i === currentCabal)
    const gotoIndex = currentIndex > 0 ? currentIndex - 1 : cabalIdList.length - 1
    viewCabal({ addr: cabalIdList[gotoIndex] })
  }

  // go to the next cabal
  goToNextCabal () {
    const { cabalIdList, addr: currentCabal, viewCabal } = this.props
    const currentIndex = cabalIdList.findIndex(i => i === currentCabal)
    const gotoIndex = currentIndex < cabalIdList.length - 1 ? currentIndex + 1 : 0
    viewCabal({ addr: cabalIdList[gotoIndex] })
  }

  componentWillUnmount () {
    window.removeEventListener('focus', (e) => this.focusInput())
  }

  componentDidUpdate (prevProps) {
    if (this.props.currentChannel !== prevProps.currentChannel) {
      this.focusInput()
    }
  }

  viewNextScreen () {
    const position = this.props.screenViewHistoryPosition + 1
    const nextScreen = this.props.screenViewHistory[position]
    if (nextScreen) {
      if (this.props.addr === nextScreen.addr) {
        this.props.viewChannel({ addr: nextScreen.addr, channel: nextScreen.channel, skipScreenHistory: true })
      } else {
        this.props.viewCabal({ addr: nextScreen.addr, channel: nextScreen.channel, skipScreenHistory: true })
      }
      this.props.setScreenViewHistoryPostion({ index: position })
    } else {
      this.props.setScreenViewHistoryPostion({
        index: this.props.screenViewHistory.length - 1
      })
    }
  }

  viewPreviousScreen () {
    const position = this.props.screenViewHistoryPosition - 1
    const previousScreen = this.props.screenViewHistory[position]
    if (previousScreen) {
      if (this.props.addr === previousScreen.addr) {
        this.props.viewChannel({ addr: previousScreen.addr, channel: previousScreen.channel, skipScreenHistory: true })
      } else {
        this.props.viewCabal({ addr: previousScreen.addr, channel: previousScreen.channel, skipScreenHistory: true })
      }
      this.props.setScreenViewHistoryPostion({ index: position })
    } else {
      this.props.setScreenViewHistoryPostion({
        index: 0
      })
    }
  }

  viewNextChannel () {
    this.props.viewNextChannel({ addr: this.props.addr })
  }

  viewPreviousChannel () {
    this.props.viewPreviousChannel({ addr: this.props.addr })
  }

  onKeyDown (e) {
    var el = this.textInput
    var line = el.value
    if (e.key === 'Tab') {
      if (line.length > 1 && line[0] === '/') {
        // command completion
        var soFar = line.slice(1)
        var commands = Object.keys(this.props.listCommands())
        var matchingCommands = commands.filter(cmd => cmd.startsWith(soFar))
        if (matchingCommands.length === 1) {
          el.value = '/' + matchingCommands[0] + ' '
        }
      } else {
        // nick completion
        var users = Object.keys(this.props.users)
          .map(key => this.props.users[key])
          .map(user => user.name || user.key.substring(0, 6))
          .sort()
        var pattern = (/^(\w+)$/)
        var match = pattern.exec(line)
        if (match) {
          users = users.filter(user => user.startsWith(match[0]))
          if (users.length > 0) el.value = users[0] + ': '
        }
      }
      e.preventDefault()
      e.stopPropagation()
      el.focus()
    } else if (e.keyCode === 13 && e.shiftKey) {
      const cursorPosition = this.textInput.selectionStart
      const beforeCursor = this.textInput.value.slice(0, cursorPosition)
      const afterCursor = this.textInput.value.slice(cursorPosition)
      this.textInput.value = beforeCursor + '\n' + afterCursor
      this.textInput.setSelectionRange(cursorPosition + 1, cursorPosition + 1)
      e.preventDefault()
      e.stopPropagation()
    } else if (e.keyCode === 13 && !e.shiftKey) {
      const data = form(this.formField)
      if (data.message.trim().length === 0) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      el = this.textInput
      el.value = ''
      const { addr, processLine } = this.props
      const message = {
        content: {
          channel: this.props.currentChannel,
          text: data.message
        },
        type: 'chat/text'
      }
      console.log('---> sending message', message)
      processLine({ addr, message })
      e.preventDefault()
      e.stopPropagation()
      const { scrollToBottom } = this.props
      scrollToBottom(true)
    } else if (((e.keyCode === 78 || e.keyCode === 38) && (e.ctrlKey || e.metaKey)) && e.shiftKey) {
      if (line.length === 0) {
        this.goToNextCabal()
      }
    } else if (((e.keyCode === 80 || e.keyCode === 40) && (e.ctrlKey || e.metaKey)) && e.shiftKey) {
      if (line.length === 0) {
        this.goToPreviousCabal()
      }
    } else if (e.keyCode > 48 && e.keyCode < 58 && (e.ctrlKey || e.metaKey)) {
      this.gotoCabal(e.keyCode - 49)
    } else if ((e.keyCode === 78 && (e.ctrlKey || e.metaKey))) {
      this.viewNextChannel()
    } else if ((e.keyCode === 80 && (e.ctrlKey || e.metaKey))) {
      this.viewPreviousChannel()
    } else if ((e.keyCode === 39 && (e.ctrlKey || e.metaKey))) {
      if (line.length === 0) {
        this.viewNextScreen()
      }
    } else if ((e.keyCode === 37 && (e.ctrlKey || e.metaKey))) {
      if (line.length === 0) {
        this.viewPreviousScreen()
      }
    }
  }

  onClickEmojiPickerContainer (e) {
    const element = e.target
    // allow click event on emoji buttons but not other emoji picker ui
    if (!element.classList.contains('emoji-mart-emoji') && !element.parentElement.classList.contains('emoji-mart-emoji')) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  onsubmit (e) {
    // only prevent default keydown now handles logic to better support shift commands
    e.preventDefault()
    e.stopPropagation()
  }

  addEmoji (emoji) {
    this.textInput.value = this.textInput.value + emoji.native
    this.resizeTextInput()
    this.focusInput()
  }

  resizeTextInput () {
    this.textInput.style.height = '10px'
    this.textInput.style.height = (this.textInput.scrollHeight) + 'px'
    if (this.textInput.scrollHeight < 28) {
      this.emojiPicker.style.bottom = (68) + 'px'
    } else {
      this.emojiPicker.style.bottom = (this.textInput.scrollHeight + 40) + 'px'
    }
  }

  toggleEmojiPicker () {
    this.props.emojiPickerVisible ? this.props.hideEmojiPicker() : this.props.showEmojiPicker()
  }

  focusInput () {
    if (this.textInput) {
      this.textInput.focus()
    }
  }

  clearInput () {
    this.textInput.value = ''
  }

  render () {
    const { cabal, showScrollToBottom = true, scrollToBottom } = this.props
    if (!cabal) {
      return <div />
    }
    return (
      <div className='composerContainer'>
        {showScrollToBottom && (
          <div className='scroll__button__container'>
            <span className='scroll__button' onClick={scrollToBottom}>Newer messages below. Jump to latest ↓</span>
          </div>)}
        <div className='composer'>
          {/* <div className={'composer__meta'}><img src='static/images/icon-composermeta.svg' /></div> */}
          <div className='composer__input' onClick={(e) => this.focusInput()}>
            <form
              onSubmit={this.onsubmit.bind(this)}
              ref={(form) => { this.formField = form }}
            >
              <textarea
                id='message-bar'
                name='message'
                onKeyDown={this.onKeyDown.bind(this)}
                onKeyUp={(e) => this.resizeTextInput()}
                ref={(input) => { this.textInput = input }}
                aria-label='Type a message and press enter'
                placeholder='Write a message'
              />
            </form>
          </div>
          <div
            className='emoji__container'
            ref={(el) => { this.emojiPicker = el }}
            style={{ position: 'absolute', bottom: '100px', right: '16px', display: this.props.emojiPickerVisible ? 'block' : 'none' }}
            onClick={this.onClickEmojiPickerContainer.bind(this)}
          >
            <Picker
              onSelect={(e) => this.addEmoji(e)}
              native
              sheetSize={64}
              autoFocus
              emoji='point_up'
              title='Pick an emoji...'
            />
          </div>
          <div className='composer__other' onClick={(e) => this.toggleEmojiPicker()}><img src='static/images/icon-composerother.svg' /></div>
        </div>
      </div>
    )
  }
}

const WriteContainer = connect(mapStateToProps, mapDispatchToProps)(writeScreen)

export default WriteContainer
