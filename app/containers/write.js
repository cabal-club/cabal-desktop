import form from 'get-form-data'
import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import Mousetrap from 'mousetrap'

import {
  addMessage,
  listCommands,
  hideEmojiPicker,
  onCommand,
  showEmojiPicker,
  viewNextChannel,
  viewPreviousChannel,
  viewCabal
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
    users: cabal.users
  }
}

const mapDispatchToProps = dispatch => ({
  addMessage: ({ addr, message }) => dispatch(addMessage({ addr, message })),
  listCommands: () => dispatch(listCommands()),
  hideEmojiPicker: () => dispatch(hideEmojiPicker()),
  onCommand: ({ addr, message }) => dispatch(onCommand({ addr, message })),
  showEmojiPicker: () => dispatch(showEmojiPicker()),
  viewNextChannel: ({ addr }) => dispatch(viewNextChannel({ addr })),
  viewPreviousChannel: ({ addr }) => dispatch(viewPreviousChannel({ addr })),
  viewCabal: ({ addr }) => dispatch(viewCabal({ addr }))
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
    Mousetrap.bind(['command+n', 'ctrl+n'], this.viewNextChannel.bind(this))
    Mousetrap.bind(['command+p', 'ctrl+p'], this.viewPreviousChannel.bind(this))
    Mousetrap.bind(['command+shift+n', 'ctrl+shift+n'], this.goToNextCabal.bind(this))
    Mousetrap.bind(['command+shift+p', 'ctrl+shift+p'], this.goToPreviousCabal.bind(this))
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
      viewCabal({ addr: cabalIdList[index ] })
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

  viewNextChannel () {
    this.props.viewNextChannel({ addr: this.props.addr })
  }

  viewPreviousChannel () {
    this.props.viewPreviousChannel({ addr: this.props.addr })
  }

  onKeyDown (e) {
    if (e.key === 'Tab') {
      var el = this.textInput
      var line = el.value

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
          .map(user => user.name || user.key.substring(0, 8))
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
      this.textInput.value = this.textInput.value + '\n'
      e.preventDefault()
      e.stopPropagation()
    } else if (e.keyCode === 13 && !e.shiftKey) {
      const data = form(this.formField)
      if (data.message.trim().length === 0) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      var el = this.textInput
      el.value = ''
      const { addr, addMessage, onCommand } = this.props
      let message = {
        content: {
          channel: this.props.currentChannel,
          text: data.message
        },
        type: 'chat/text'
      }
      var opts = { message, addr }
      if (data.message.startsWith('/')) {
        onCommand(opts)
      } else {
        addMessage(opts)
      }
      e.preventDefault()
      e.stopPropagation()
    } else if ((e.keyCode === 78 && (e.ctrlKey || e.metaKey)) && e.shiftKey) {
      this.goToNextCabal()
    } else if ((e.keyCode === 80 && (e.ctrlKey || e.metaKey)) && e.shiftKey) {
      this.goToPreviousCabal()
    } else if (e.keyCode > 48 && e.keyCode < 58 && (e.ctrlKey || e.metaKey)) {
      this.gotoCabal(e.keyCode - 49)
    } else if ((e.keyCode === 78 && (e.ctrlKey || e.metaKey))) {
      this.viewNextChannel()
    } else if ((e.keyCode === 80 && (e.ctrlKey || e.metaKey))) {
      this.viewPreviousChannel()
    }
  }

  onClickEmojiPickerContainer (e) {
    let element = e.target
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
    const { cabal } = this.props

    if (!cabal) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }

    return (
      <div className={'composerContainer'}>
        <div className={'composer'} >
          {/* <div className={'composer__meta'}><img src='static/images/icon-composermeta.svg' /></div> */}
          <div className={'composer__input'} onClick={(e) => this.focusInput()}>
            <form
              onSubmit={this.onsubmit.bind(this)}
              ref={(form) => { this.formField = form }}>
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
            className={'emoji__container'}
            ref={(el) => { this.emojiPicker = el }}
            style={{ position: 'absolute', bottom: '100px', right: '16px', display: this.props.emojiPickerVisible ? 'block' : 'none' }}
            onClick={this.onClickEmojiPickerContainer.bind(this)}
          >
            <Picker
              onSelect={(e) => this.addEmoji(e)}
              native
              sheetSize={64}
              autoFocus
              emoji={'point_up'}
              title={'Pick an emoji...'}
            />
          </div>
          <div className={'composer__other'} onClick={(e) => this.toggleEmojiPicker()}><img src='static/images/icon-composerother.svg' /></div>
        </div>
      </div>
    )
  }
}

const WriteContainer = connect(mapStateToProps, mapDispatchToProps)(writeScreen)

export default WriteContainer
