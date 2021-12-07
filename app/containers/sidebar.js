import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import prompt from 'electron-prompt'
import { Item, Menu, Separator, Submenu, theme } from 'react-contexify'

import {
  changeScreen,
  hideCabalSettings,
  hideProfilePanel,
  joinChannel,
  saveCabalSettings,
  setUsername,
  showCabalSettings,
  showChannelBrowser,
  showProfilePanel,
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
  hideProfilePanel: ({ addr }) => dispatch(hideProfilePanel({ addr })),
  joinChannel: ({ addr, channel }) => dispatch(joinChannel({ addr, channel })),
  saveCabalSettings: ({ addr, settings }) => dispatch(saveCabalSettings({ addr, settings })),
  setUsername: ({ addr, username }) => dispatch(setUsername({ addr, username })),
  showCabalSettings: ({ addr }) => dispatch(showCabalSettings({ addr })),
  showChannelBrowser: ({ addr }) => dispatch(showChannelBrowser({ addr })),
  showProfilePanel: ({ addr, userKey }) => dispatch(showProfilePanel({ addr, userKey })),
  viewChannel: ({ addr, channel }) => dispatch(viewChannel({ addr, channel }))
})

function UserMenu (props) {
  useEffect(() => {
    // console.warn('UserMenu', props)
  }, [props.peer])

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

  onClickUser (user) {
    this.props.showProfilePanel({
      addr: this.props.addr,
      userKey: user.key
    })
  }

  onContextMenu (peer, e) {
    // e.preventDefault()
    // contextMenu.show({
    //   id: 'user_menu',
    //   event: e,
    //   props: {
    //     peer
    //   }
    // })
  }

  onClickStartPM (key) {
    this.props.hideProfilePanel({ addr: this.props.addr })
    this.props.joinChannel({
      addr: this.props.addr,
      channel: key
    })
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
      if (a.isHidden() && !b.isHidden()) return 1
      if (b.isHidden() && !a.isHidden()) return -1
      if (a.online && !b.online) return -1
      if (b.online && !a.online) return 1
      if (a.isAdmin() && !b.isAdmin()) return -1
      if (b.isAdmin() && !a.isAdmin()) return 1
      if (a.isModerator() && !b.isModerator()) return -1
      if (b.isModerator() && !a.isModerator()) return 1
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
      const moderated = user.isHidden() || user.isAdmin() || user.isModerator()
      if (user.name && !moderated && userIndex > -1) {
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
    const { addr, cabal, settings } = this.props
    const cabalLabel = settings.alias || addr
    const channelsJoined = cabal.channelsJoined?.slice().sort() || []
    const favorites = channelsJoined.filter(channel => (settings['favorite-channels'] || []).includes(channel))
    const channels = channelsJoined.filter(channel => !favorites.includes(channel))
    const users = this.sortUsers(Object.values(cabal.users) || [])
    const deduplicatedNicks = this.deduplicatedNicks(users)
    const onlineCount = users.filter(i => !!i.online).length
    const userkey = cabal.userkey
    const username = cabal.username
    const unreadNonFavoriteMessageCount = Object.entries((this.props.channelMessagesUnread || {})).reduce((total, value) => {
      return (value[1] && channels.includes(value[0])) ? (total + value[1]) : total
    }, 0)

    function getPmChannelName (userKey) {
      const key = Object.keys(cabal.users).find((key) => key === userKey)
      return cabal.users[key]?.name ?? cabal.channel
    }

    return (
      <div className='client__sidebar'>
        <div className='sidebar'>
          <div className='session' onClick={this.onClickCabalSettings.bind(this, cabal.addr)}>
            <div className='session__avatar'>
              <div className='session__avatar__img'>
                <Avatar name={userkey} />
              </div>
            </div>
            <div className='session__meta'>
              <h1>{cabalLabel}</h1>
              <h2 onClick={this.onClickUsername.bind(this)}>
                {username}
              </h2>
            </div>
            <div className='session__configuration' title='Settings for this Cabal'>
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
                      onClick={this.onToggleCollection.bind(this, 'favorites')}
                    >▼
                    </span>
                    <div
                      className='collection__heading__title'
                      onClick={this.onToggleCollection.bind(this, 'favorites')}
                    >
                      Starred
                    </div>
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
            {!!cabal.pmChannels?.length &&
              <div className='collection'>
                <div className='collection__heading'>
                  <div className='collection__heading__title__container'>
                    <span
                      className={`collection__toggle ${this.props.settings['sidebar-hide-pmChannels'] ? 'collection__toggle__off' : 'collection__toggle__on'}`}
                      onClick={this.onToggleCollection.bind(this, 'pmChannels')}
                    >▼
                    </span>
                    <div
                      className='collection__heading__title'
                      onClick={this.onToggleCollection.bind(this, 'pmChannels')}
                    >
                      Private Messages
                    </div>
                  </div>
                </div>
                {!this.props.settings['sidebar-hide-pmChannels'] && this.sortByProperty(cabal.pmChannels).map((channel) =>
                  <div key={channel} onClick={this.onClickStartPM.bind(this, channel)} className={cabal.channel === channel ? 'collection__item active' : 'collection__item'}>
                    <div className='collection__item__icon'><img src='static/images/icon-channel.svg' /></div>
                    <div className='collection__item__content'>{getPmChannelName(channel)}</div>
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
                    onClick={this.onToggleCollection.bind(this, 'channels')}
                  >▼
                  </span>
                  <div
                    className='collection__heading__title collection__heading__title__channelBrowserButton'
                    onClick={this.onToggleCollection.bind(this, 'channels')}
                  >
                    Channels
                    {this.props.settings['sidebar-hide-channels'] && unreadNonFavoriteMessageCount > 0 &&
                      <span className='messagesUnreadCount'>{unreadNonFavoriteMessageCount}</span>}
                  </div>
                </div>
                <div
                  className='collection__heading__handle'
                  onClick={this.onClickChannelBrowser.bind(this, cabal.addr)}
                  title='Browse and join or create channels'
                >
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
                    onClick={this.onToggleCollection.bind(this, 'peers')}
                  >▼
                  </span>
                  <div
                    className='collection__heading__title'
                    onClick={this.onToggleCollection.bind(this, 'peers')}
                  >
                    Peers - {onlineCount} online
                  </div>
                </div>
                <div className='collection__heading__handle' />
              </div>
              {!this.props.settings['sidebar-hide-peers'] && deduplicatedNicks.map((peer, index) => {
                const keys = peer.users.map((u) => u.key).join(', ')
                const isAdmin = peer.users.some((u) => u.isAdmin())
                const isModerator = peer.users.some((u) => u.isModerator())
                const isHidden = peer.users.some((u) => u.isHidden())
                const isSelf = peer.users.some((u) => u.key === userkey)
                const name = isHidden ? peer.name.substring(0, 3) + peer.key.substring(0, 6) : peer.name
                return (
                  <div
                    key={index}
                    className='collection__item'
                    title={keys}
                    onClick={this.onClickUser.bind(this, peer)}
                    onContextMenu={this.onContextMenu.bind(this, peer)}
                  >
                    <div className='collection__item__icon'>
                      {!!peer.online &&
                        <img alt='Online' src='static/images/icon-status-online.svg' />}
                      {!peer.online &&
                        <img alt='Offline' src='static/images/icon-status-offline.svg' />}
                    </div>
                    <div className={`collection__item__content ${(peer.online && !isHidden) ? 'active' : ''}`}>
                      <span className='name'>
                        {peer.name ? name : peer.key.substring(0, 6)}
                        {peer.users.length > 1 && <span className='collection__item__count'>({peer.users.length})</span>}
                      </span>
                      <span className='pmChannels' onClick={this.onClickStartPM.bind(this, peer.key)} title='Private Message'>💬</span>
                      {!isAdmin && !isModerator && isHidden && <span className='sigil hidden'>HIDDEN</span>}
                      {!isAdmin && isModerator && <span className='sigil moderator' title='Moderator'>MOD</span>}
                      {isSelf
                        ? <span className='sigil' title='You'>YOU</span>
                        : isAdmin && <span className='sigil admin' title='Admin'>ADMIN</span>}
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
