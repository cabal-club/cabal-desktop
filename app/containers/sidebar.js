import React from 'react'
import { connect } from 'react-redux'
import prompt from 'electron-prompt'

import {
  viewChannel,
  joinChannel,
  changeUsername,
  changeScreen,
  hideCabalSettings,
  showCabalSettings,
  showChannelBrowser
} from '../actions'
import Avatar from './avatar'
import JoinChannelModal from './joinChannelModal'

const mapStateToProps = state => {
  const cabal = state.cabals[state.currentCabal]
  const addr = cabal.addr
  return {
    addr,
    cabals: state.cabals,
    cabal,
    cabalSettingsVisible: state.cabalSettingsVisible,
    channelMessagesUnread: cabal.channelMessagesUnread,
    settings: state.cabalSettings[addr] || {},
    username: cabal.username
  }
}

const mapDispatchToProps = dispatch => ({
  changeScreen: ({ screen }) => dispatch(changeScreen({ screen })),
  joinChannel: ({ addr, channel }) => dispatch(joinChannel({ addr, channel })),
  viewChannel: ({ addr, channel }) => dispatch(viewChannel({ addr, channel })),
  changeUsername: ({ addr, username }) => dispatch(changeUsername({ addr, username })),
  showCabalSettings: ({ addr }) => dispatch(showCabalSettings({ addr })),
  hideCabalSettings: () => dispatch(hideCabalSettings()),
  showChannelBrowser: ({ addr }) => dispatch(showChannelBrowser({ addr }))
})

class SidebarScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isModalVisible: false
    }
    this.closeModal = this.closeModal.bind(this)
    this.joinChannel = this.joinChannel.bind(this)
  }

  // onClickNewChannel () {
  //   prompt({
  //     title: 'Create a channel',
  //     label: 'New channel name',
  //     value: undefined,
  //     type: 'input'
  //   }).then((newChannelName) => {
  //     if (newChannelName && newChannelName.trim().length > 0) {
  //       this.joinChannel(newChannelName)
  //     }
  //   }).catch(() => {
  //     console.log('cancelled new channel')
  //   })
  // }

  onClickNewChannel () {
    this.setState({
      isModalVisible: true
    })
  }

  closeModal () {
    this.setState({
      isModalVisible: false
    })
  }

  onClickUsername () {
    prompt({
      title: 'Set nickname',
      label: 'What would you like to call yourself?',
      value: this.props.cabal.username,
      type: 'input'
    }).then((username) => {
      if (username && username.trim().length > 0) {
        this.props.changeUsername({ username, addr: this.props.addr })
      }
    }).catch(() => {
      console.log('cancelled username')
    })
  }

  onClickCabalSettings (addr) {
    if (this.props.cabalSettingsVisible) {
      this.props.hideCabalSettings()
    } else {
      this.props.showCabalSettings({ addr })
    }
  }

  onClickChannelBrowser (addr) {
    this.props.showChannelBrowser({ addr })
  }

  joinChannel (channel) {
    var addr = this.props.addr
    this.props.joinChannel({ addr, channel })
    console.log('joining channel', channel)
  }

  selectChannel (channel) {
    var addr = this.props.addr
    this.props.viewChannel({ addr, channel })
  }

  sortByProperty (items = [], property = 'name', direction = 1) {
    return items.sort((a, b) => {
      if (a[property]) {
        return (a[property] || '').toLowerCase() < (b[property] || '').toLowerCase() ? -direction : direction
      } else {
        if (a.toLowerCase && b.toLowerCase) {
          return (a || '').toLowerCase() < (b || '').toLowerCase() ? -direction : direction
        }
      }
    })
  }

  sortUsers (users) {
    return users.sort((a, b) => {
      if (a.online && !b.online) return -1
      if (b.online && !a.online) return 1
      if (a.name && !b.name) return -1
      if (b.name && !a.name) return 1
      if (a.name && b.name) return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
      return a.key < b.key ? -1 : 1
    })
  }

  render () {
    var self = this
    const { addr, cabal, settings } = this.props
    const cabalLabel = settings.alias || addr

    const channels = cabal.channelsJoined.slice().sort()
    const users = this.sortUsers(Object.values(cabal.users) || [])
    const username = cabal.username || 'conspirator'
    return (
      <div className='client__sidebar'>
        <div className='sidebar'>
          <div className='session' onClick={self.onClickCabalSettings.bind(self, cabal.addr)}>
            <div className='session__avatar'>
              <div className='session__avatar__img'>
                <Avatar name={username} />
              </div>
            </div>
            <div className='session__meta'>
              <h1>{cabalLabel}</h1>
              <h2 onClick={self.onClickUsername.bind(self)}>
                {username}
              </h2>
            </div>
            {/* <div className='session__configuration'>
              <img src='static/images/icon-sidebarmenu.svg' />
            </div> */}
          </div>
          <div className='sidebar__section'>
            <div className='collection collection--push'>
              <div className='collection__heading'>
                <div className='collection__heading__title' onClick={self.onClickChannelBrowser.bind(self, cabal.addr)}>Channels</div>
                <div className='collection__heading__handle' onClick={() => { console.log('this is called'); this.setState({ isModalVisible: true }) }}>
                  <img src='static/images/icon-newchannel.svg' />
                </div>
              </div>
              {this.sortByProperty(channels).map((channel) =>
                <div key={channel} onClick={this.selectChannel.bind(this, channel)} className={cabal.channel === channel ? 'collection__item active' : 'collection__item'}>
                  <div className='collection__item__icon'><img src='static/images/icon-channel.svg' /></div>
                  <div className='collection__item__content'>{channel}</div>
                  {this.props.channelMessagesUnread && this.props.channelMessagesUnread[channel] > 0 &&
                    <div className='collection__item__messagesUnreadCount'>{this.props.channelMessagesUnread[channel]}</div>}
                  <div className='collection__item__handle' />
                </div>
              )}
            </div>
            <div className='collection'>
              <div className='collection__heading'>
                <div className='collection__heading__title'>Peers</div>
                <div className='collection__heading__handle' />
              </div>
              {users.map((user) =>
                <div key={user.key} className='collection__item'>
                  <div className='collection__item__icon'>
                    {!!user.online &&
                      <img alt='Online' src='static/images/icon-status-online.svg' />}
                    {!user.online &&
                      <img alt='Offline' src='static/images/icon-status-offline.svg' />}
                  </div>
                  {!!user.online &&
                    <div className='collection__item__content active'>{user.name || user.key.substring(0, 6)}</div>}
                  {!user.online &&
                    <div className='collection__item__content'>{user.name || user.key.substring(0, 6)}</div>}
                  <div className='collection__item__handle' />
                </div>
              )}
            </div>
          </div>
        </div>
        <JoinChannelModal visible={this.state.isModalVisible} closeModal={this.closeModal} channels={cabal.channels} joinChannel={this.joinChannel} />
      </div>
    )
  }
}

const Sidebar = connect(mapStateToProps, mapDispatchToProps)(SidebarScreen)

export default Sidebar
