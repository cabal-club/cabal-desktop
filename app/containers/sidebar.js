import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import prompt from 'electron-prompt'
import { contextMenu, Item, Menu, MenuProvider, Separator, Submenu, theme } from 'react-contexify'

import {
  changeScreen,
  hideCabalSettings,
  joinChannel,
  saveCabalSettings,
  setUsername,
  showCabalSettings,
  showChannelBrowser,
  viewChannel
} from '../actions'
import Avatar from './avatar'

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
  hideCabalSettings: () => dispatch(hideCabalSettings()),
  joinChannel: ({ addr, channel }) => dispatch(joinChannel({ addr, channel })),
  saveCabalSettings: ({ addr, settings }) => dispatch(saveCabalSettings({ addr, settings })),
  setUsername: ({ addr, username }) => dispatch(setUsername({ addr, username })),
  showCabalSettings: ({ addr }) => dispatch(showCabalSettings({ addr })),
  showChannelBrowser: ({ addr }) => dispatch(showChannelBrowser({ addr })),
  viewChannel: ({ addr, channel }) => dispatch(viewChannel({ addr, channel })),
})

function UserMenu (props) {
  useEffect(() => {
    console.warn('UserMenu', props)
  }, [props.nick])

  return (
    <Menu id='user_menu' theme={theme.dark}>
      <Item>Add as moderator</Item>
      <Item>Add as administrator</Item>
      <Separator />
      <Item>Block</Item>
      <Item>Hide cabal-wide</Item>
      <Item>Hide in this channel</Item>
      <Item>Mute cabal-wide</Item>
      <Item>Mute in this channel</Item>
      <Item>Hide in this channel</Item>
      <Submenu label='Hide...'>
        <Item>😺</Item>
      </Submenu>
      <Submenu label='Mute...'>
        <Item>🌴</Item>
      </Submenu>
    </Menu>
  )
}

class SidebarScreen extends React.Component {
  onClickNewChannel () {
    prompt({
      title: 'Create a channel',
      label: 'New channel name',
      value: undefined,
      type: 'input'
    }).then((newChannelName) => {
      if (newChannelName && newChannelName.trim().length > 0) {
        this.joinChannel(newChannelName)
      }
    }).catch(() => {
      console.log('cancelled new channel')
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
        this.props.setUsername({ username, addr: this.props.addr })
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

  onToggleCollection (collection) {
    const option = `sidebar-hide-${collection}`
    const settings = this.props.settings
    settings[option] = !this.props.settings[option]
    this.props.saveCabalSettings({ addr: this.props.cabal.addr, settings })
  }

  onContextMenu (nick, e) {
    e.preventDefault()
    // contextMenu.show({
    //   id: 'user_menu',
    //   event: e,
    //   props: {
    //     nick: nick
    //   }
    // })
  }

  joinChannel (channel) {
    var addr = this.props.addr
    this.props.joinChannel({ addr, channel })
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

  deduplicatedNicks (users) {
    const deduplicatedNicks = []
    users && users.forEach((user) => {
      const userIndex = deduplicatedNicks.findIndex((u) => u.name === user.name)
      if (user.name && userIndex > -1) {
        deduplicatedNicks[userIndex].users.push(user)
      } else {
        deduplicatedNicks.push({
          ...user,
          users: [user]
        })
      }
    })
    return deduplicatedNicks
  }

  render () {
    var self = this
    const { addr, cabal, settings } = this.props
    const cabalLabel = settings.alias || addr

    const favorites = (settings['favorite-channels'] || []).sort()
    const channels = cabal.channelsJoined.slice().sort().filter(x => !favorites.includes(x))
    const users = this.sortUsers(Object.values(cabal.users) || [])
    const deduplicatedNicks = this.deduplicatedNicks(users)
    const onlineCount = users.filter(i => !!i.online).length
    const userkey = cabal.userkey
    const username = cabal.username
    return (
      <div className='client__sidebar'>
        <div className='sidebar'>
          <div className='session' onClick={self.onClickCabalSettings.bind(self, cabal.addr)}>
            <div className='session__avatar'>
              <div className='session__avatar__img'>
                <Avatar name={userkey} />
              </div>
            </div>
            <div className='session__meta'>
              <h1>{cabalLabel}</h1>
              <h2 onClick={self.onClickUsername.bind(self)}>
                {username}
              </h2>
            </div>
            <div className='session__configuration'>
              <img src='static/images/icon-sidebarmenu.svg' />
            </div>
          </div>
          <div className='sidebar__section'>
            {!!favorites.length &&
              <div className='collection'>
                <div className='collection__heading'>
                  <div className='collection__heading__title__container'>
                    <span
                      className={`collection__toggle ${this.props.settings['sidebar-hide-favorites'] ? 'collection__toggle__off' : 'collection__toggle__on'}`}
                      onClick={self.onToggleCollection.bind(self, 'favorites')}
                    >▼
                    </span>
                    <div className='collection__heading__title'>Starred</div>
                  </div>
                </div>
                {!this.props.settings['sidebar-hide-favorites'] && this.sortByProperty(favorites).map((channel) =>
                  <div key={channel} onClick={this.selectChannel.bind(this, channel)} className={cabal.channel === channel ? 'collection__item active' : 'collection__item'}>
                    <div className='collection__item__icon'><img src='static/images/icon-channel.svg' /></div>
                    <div className='collection__item__content'>{channel}</div>
                    {this.props.channelMessagesUnread && this.props.channelMessagesUnread[channel] > 0 &&
                      <div className='collection__item__messagesUnreadCount'>{this.props.channelMessagesUnread[channel]}</div>}
                    <div className='collection__item__handle' />
                  </div>
                )}
              </div>}
            <div className='collection'>
              <div className='collection__heading'>
                <div className='collection__heading__title__container'>
                  <span
                    className={`collection__toggle ${this.props.settings['sidebar-hide-channels'] ? 'collection__toggle__off' : 'collection__toggle__on'}`}
                    onClick={self.onToggleCollection.bind(self, 'channels')}
                  >▼
                  </span>
                  <div
                    className='collection__heading__title collection__heading__title__channelBrowserButton'
                    onClick={self.onClickChannelBrowser.bind(self, cabal.addr)}
                    title='Browse and join all channels'
                  >Channels
                  </div>
                </div>
                <div className='collection__heading__handle' onClick={self.onClickChannelBrowser.bind(self, cabal.addr)}>
                  <img src='static/images/icon-newchannel.svg' />
                </div>
              </div>
              {!this.props.settings['sidebar-hide-channels'] && this.sortByProperty(channels).map((channel) =>
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
                <div className='collection__heading__title__container'>
                  <span
                    className={`collection__toggle ${this.props.settings['sidebar-hide-peers'] ? 'collection__toggle__off' : 'collection__toggle__on'}`}
                    onClick={self.onToggleCollection.bind(self, 'peers')}
                  >▼
                  </span>
                  <div className='collection__heading__title'>Peers - {onlineCount} online</div>
                </div>
                <div className='collection__heading__handle' />
              </div>
              {!this.props.settings['sidebar-hide-peers'] && deduplicatedNicks.map((nick, index) => {
                const keys = nick.users.map((u) => u.key).join(', ')
                return (
                  <div
                    key={index}
                    className='collection__item'
                    title={keys}
                    onClick={this.onContextMenu.bind(this, nick)}
                    onContextMenu={this.onContextMenu.bind(this, nick)}
                  >
                    <div className='collection__item__icon'>
                      {!!nick.online &&
                        <img alt='Online' src='static/images/icon-status-online.svg' />}
                      {!nick.online &&
                        <img alt='Offline' src='static/images/icon-status-offline.svg' />}
                    </div>
                    <div className={`collection__item__content ${nick.online ? 'active' : ''}`}>
                      {nick.name || nick.key.substring(0, 6)}
                      {nick.users.length > 1 && <span className='collection__item__count'>({nick.users.length})</span>}
                    </div>
                    <div className='collection__item__handle' />
                  </div>
                )
              })}
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const Sidebar = connect(mapStateToProps, mapDispatchToProps)(SidebarScreen)

export default Sidebar
