import React from 'react'
import { connect } from 'react-redux'

import { addChannel, hideAllModals, joinChannel, leaveChannel, viewChannel } from '../actions'

const mapStateToProps = state => {
  var cabal = state.cabals[state.currentCabal]
  return {
    addr: state.currentCabal,
    cabal
  }
}

const mapDispatchToProps = dispatch => ({
  hideAllModals: () => dispatch(hideAllModals()),
  joinChannel: ({ addr, channel }) => dispatch(joinChannel({ addr, channel })),
  viewChannel: ({ addr, channel }) => dispatch(viewChannel({ addr, channel })),
  addChannel: ({ addr, channel }) => dispatch(addChannel({ addr, channel }))
})

class ChannelBrowserContainer extends React.Component {
  onClickClose () {
    this.props.hideAllModals()
  }

  onClickJoinChannel (channel) {
    this.props.joinChannel({ addr: this.props.addr, channel })
  }

  sortChannels (channels) {
    // TODO: sort by joined
    return channels.sort((a, b) => {
      if (a && !b) return -1
      if (b && !a) return 1
      if (a && b) return a.toLowerCase() < b.toLowerCase() ? -1 : 1
      return a.key < b.key ? -1 : 1
    })
  }

  render () {
    const { addr, cabal } = this.props
    const channels = cabal.channels
    const channelsJoined = cabal.channelsJoined || []
    return (
      <div className='client__main'>
        <div className='window'>
          <div className='window__header'>
            <div className='channel-meta'>
              <div className='channel-meta__data'>
                <div className='channel-meta__data__details'>
                  <h1>
                    <span onClick={this.onClickClose.bind(this)} className='cabal-settings__close'><img src='static/images/icon-composermeta.svg' /></span>
                    Join A Channel
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div className='window__main'>
            <div className='window__main__content'>
              {channels.map((channel) => {
                return (
                  <div key={channel} className='cabal-settings__item' onClick={this.onClickJoinChannel.bind(this, channel)}>
                    {channelsJoined.includes(channel) ? '* ' : ''}
                    {channel}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const ChannelBrowser = connect(mapStateToProps, mapDispatchToProps)(ChannelBrowserContainer)

export default ChannelBrowser
