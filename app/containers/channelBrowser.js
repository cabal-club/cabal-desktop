import React from 'react'
import { connect } from 'react-redux'
import prompt from 'electron-prompt'

import { addChannel, hideAllModals, joinChannel, leaveChannel, viewChannel } from '../actions'

const mapStateToProps = state => {
  var cabal = state.cabals[state.currentCabal]
  return {
    addr: state.currentCabal,
    cabal,
    channels: state.channelBrowserChannelsData
  }
}

const mapDispatchToProps = dispatch => ({
  hideAllModals: () => dispatch(hideAllModals()),
  joinChannel: ({ addr, channel }) => dispatch(joinChannel({ addr, channel })),
  viewChannel: ({ addr, channel }) => dispatch(viewChannel({ addr, channel })),
  addChannel: ({ addr, channel }) => dispatch(addChannel({ addr, channel })),
})

class ChannelBrowserContainer extends React.Component {
  onClickClose() {
    this.props.hideAllModals()
  }

  onClickJoinChannel (channel) {
    this.props.joinChannel({ addr: this.props.addr, channel })
  }

  onClickNewChannel () {
    let self = this
    prompt({
      title: 'Create a channel',
      label: 'New channel name',
      value: undefined,
      type: 'input'
    }).then((newChannelName) => {
      console.warn(newChannelName, this.props.addr)
      if (newChannelName && newChannelName.trim().length > 0) {
        // console.warn(newChannelName, 333, {addr: this.props.addr, channel: newChannelName})
        this.props.joinChannel({ addr: this.props.addr, channel: newChannelName })
      }
    }).catch(() => {
      console.log('cancelled new channel')
    })
  }

  sortChannelsByName (channels) {
    return channels.sort((a, b) => {
      if (a && !b) return -1
      if (b && !a) return 1
      if (a.name && !b.name) return -1
      if (b.name && !a.name) return 1
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
    })
  }

  render() {
    const { channels } = this.props
    const channelsJoined = this.sortChannelsByName(channels.filter(c => c.joined) || [])
    const channelsNotJoined = this.sortChannelsByName(channels.filter(c => !c.joined) || [])
    return (
      <div className='client__main'>
        <div className='window'>
          <div className='window__header'>
            <div className='channel-meta'>
              <div className='channel-meta__data'>
                <div className='channel-meta__data__details'>
                  <h1>
                    <span onClick={this.onClickClose.bind(this)} className='cabal-settings__close'><img src='static/images/icon-composermeta.svg' /></span>
                    Browse Channels
                  </h1>
                </div>
              </div>
              <div className='channel-meta__other'>
                <div className='button channel-meta__other__share' onClick={this.onClickNewChannel.bind(this)}>Create A New Channel</div>
              </div>
            </div>
          </div>
          <div className='channelBrowser'>
            <div className='channelBrowser__content'>
              <h2 className='channelBrowser__sectionTitle'>Channels you can join</h2>
              <div className='channelBrowser__list'>
                {channelsNotJoined.map((channel) => {
                  return (
                    <div
                      key={channel.name}
                      className='channelBrowser__row'
                      onClick={this.onClickJoinChannel.bind(this, channel.name)}
                      title='Join channel'
                    >
                      <div className='title'>{channel.name}</div>
                      <div className='topic'>{channel.topic}</div>
                      <div className='members'>{channel.memberCount} {channel.memberCount === 1 ? 'person' : 'people' }</div>
                    </div>
                  )
                })}
              </div>
              <h2 className='channelBrowser__sectionTitle'>Channels you belong to</h2>
              <div className='channelBrowser__list'>
                {channelsJoined.map((channel) => {
                  return (
                    <div
                      key={channel.name}
                      className='channelBrowser__row'
                      onClick={this.onClickJoinChannel.bind(this, channel.name)}
                      title='Join channel'
                    >
                      <div className='title'>{channel.name}</div>
                      <div className='topic'>{channel.topic}</div>
                      <div className='members'>{channel.memberCount} {channel.memberCount === 1 ? 'person' : 'people' }</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const ChannelBrowser = connect(mapStateToProps, mapDispatchToProps)(ChannelBrowserContainer)

export default ChannelBrowser
