import React from 'react'
import { connect } from 'react-redux'

import { viewChannel, joinChannel, changeUsername, changeScreen } from '../actions'
import Avatar from './avatar'

var Dialogs = require('dialogs')

const mapStateToProps = state => {
  var cabal = state.cabals[state.currentCabal]
  return {
    addr: state.currentCabal,
    cabals: state.cabals,
    cabal,
    username: cabal.username
  }
}

const mapDispatchToProps = dispatch => ({
  changeScreen: ({screen}) => dispatch(changeScreen({screen})),
  joinChannel: ({addr, channel}) => dispatch(joinChannel({addr, channel})),
  viewChannel: ({addr, channel}) => dispatch(viewChannel({addr, channel})),
  changeUsername: ({addr, username}) => dispatch(changeUsername({addr, username}))
})

class SidebarScreen extends React.Component {
  onClickNewChannel () {
    Dialogs().prompt('New channel name:', undefined, (newChannelName) => {
      if (newChannelName && newChannelName.trim().length > 0) {
        this.joinChannel(newChannelName)
      }
    })
  }

  onClickUsername () {
    Dialogs().prompt('Set nickname', this.props.cabal.username, (username) => {
      if (username && username.trim().length > 0) {
        this.props.changeUsername({ username, addr: this.props.addr })
      }
    })
  }

  joinChannel (channel) {
    var addr = this.props.addr
    this.props.joinChannel({addr, channel})
  }

  selectChannel (channel) {
    var addr = this.props.addr
    this.props.viewChannel({addr, channel})
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

  render () {
    var self = this
    const { addr, cabal } = this.props
    let channels = cabal.channels
    let users = Object.values(cabal.users) || []
    let username = cabal.username || 'conspirator'
    return (
      <div className='client__sidebar' onClick={(e) => this.props.toggleEmojis(false)}>
        <div className='sidebar'>
          <div className='session'>
            <div className='session__avatar'>
              <div className='session__avatar__img'>
                <Avatar name={username} />
              </div>
            </div>
            <div className='session__meta'>
              <h1>{addr}</h1>
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
                <div className='collection__heading__title'>Channels</div>
                <div className='collection__heading__handle' onClick={self.onClickNewChannel.bind(self)}>
                  <img src='static/images/icon-newchannel.svg' />
                </div>
              </div>
              {this.sortByProperty(channels).map((channel) =>
                <div key={channel} onClick={this.selectChannel.bind(this, channel)} className={cabal.channel === channel ? 'collection__item active' : 'collection__item'}>
                  <div className='collection__item__icon'><img src='static/images/icon-channel.svg' /></div>
                  <div className='collection__item__content'>{channel}</div>
                  <div className='collection__item__handle' />
                </div>
              )}
            </div>
            <div className='collection'>
              <div className='collection__heading'>
                <div className='collection__heading__title'>Peers</div>
                <div className='collection__heading__handle' />
              </div>
              {this.sortByProperty(users).map((user) =>
                <div key={user.key} className='collection__item'>
                  <div className='collection__item__icon'>
                    {!!user.online &&
                      <img src='static/images/icon-status-online.svg' />
                    }
                    {!user.online &&
                      <img src='static/images/icon-status-offline.svg' />
                    }
                  </div>
                  <div className='collection__item__content'>{user.name}</div>
                  <div className='collection__item__handle' />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const Sidebar = connect(mapStateToProps, mapDispatchToProps)(SidebarScreen)

export default Sidebar
