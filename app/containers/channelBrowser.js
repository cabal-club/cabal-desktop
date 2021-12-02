import React from 'react'
import { connect } from 'react-redux'
import prompt from 'electron-prompt'

import {
  hideAllModals,
  joinChannel,
  showChannelBrowser,
  unarchiveChannel
} from '../actions'

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
  showChannelBrowser: ({ addr }) => dispatch(showChannelBrowser({ addr })),
  unarchiveChannel: ({ addr, channel }) => dispatch(unarchiveChannel({ addr, channel }))
})

class ChannelBrowserContainer extends React.Component {
  onClickClose () {
    this.props.hideAllModals()
  }

  onClickJoinChannel (channel) {
    this.props.joinChannel({ addr: this.props.addr, channel })
  }

  onClickUnarchiveChannel (channel) {
    this.props.unarchiveChannel({ addr: this.props.addr, channel })
    this.props.showChannelBrowser({ addr: this.props.addr })
  }

  onClickNewChannel () {
    prompt({
      title: 'Create a channel',
      label: 'New channel name',
      value: undefined,
      type: 'input'
    }).then((newChannelName) => {
      if (newChannelName && newChannelName.trim().length > 0) {
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

  render () {
    const { channels } = this.props
    const channelsJoined = this.sortChannelsByName(channels.filter(c => c.joined && !c.archived) || [])
    const channelsNotJoined = this.sortChannelsByName(channels.filter(c => !c.joined && !c.archived) || [])
    const channelsArchived = this.sortChannelsByName(channels.filter(c => !c.joined && c.archived) || [])
    return (
      <div className='client__main'>
        <div className='window'>
          <div className='window__header'>
            <div className='channel-meta'>
              <div className='channel-meta__data'>
                <div className='channel-meta__data__details'>
                  <h1>
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
                      <div className='members'>{channel.memberCount} {channel.memberCount === 1 ? 'person' : 'people'}</div>
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
                      <div className='members'>{channel.memberCount} {channel.memberCount === 1 ? 'person' : 'people'}</div>
                    </div>
                  )
                })}
              </div>
              {!!channelsArchived.length && (
                <>
                  <h2 className='channelBrowser__sectionTitle'>Archived Channels</h2>
                  <div className='channelBrowser__list'>
                    {channelsArchived.map((channel) => {
                      return (
                        <div
                          className='channelBrowser__row'
                          key={channel.name}
                          style={{ display: 'flex', justifyContent: 'space-between' }}
                        >
                          <div>
                            <div className='title'>{channel.name}</div>
                            <div className='topic'>{channel.topic}</div>
                            <div className='members'>{channel.memberCount} {channel.memberCount === 1 ? 'person' : 'people'}</div>
                          </div>
                          <button
                            className='button'
                            onClick={this.onClickUnarchiveChannel.bind(this, channel.name)}
                            title='Unarchive channel'
                          >
                            Unarchive
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const ChannelBrowser = connect(mapStateToProps, mapDispatchToProps)(ChannelBrowserContainer)

export default ChannelBrowser
