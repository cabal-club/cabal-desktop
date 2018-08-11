import React from 'react'
import { clipboard } from 'electron'
import { connect } from 'react-redux'

import { viewCabal, viewChannel, joinChannel, changeUsername, changeScreen } from '../actions'
import InputPrompt from './InputPrompt'

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
  viewCabal: ({addr}) => dispatch(viewCabal({addr})),
  viewChannel: ({addr, channel}) => dispatch(viewChannel({addr, channel})),
  changeUsername: ({addr, username}) => dispatch(changeUsername({addr, username}))
})

class SidebarScreen extends React.Component {
  joinChannel (channel) {
    var addr = this.props.addr
    this.props.joinChannel({addr, channel})
  }

  copyClick () {
    clipboard.writeText('cabal://' + this.props.addr)
    alert('Copied cabal:// link to clipboard! Now give it to people you want to join your Cabal. Only people with the link can join.')
  }

  joinCabal () {
    this.props.changeScreen({screen: 'addCabal'})
  }

  selectCabal (addr) {
    this.props.viewCabal({addr})
  }

  selectChannel (channel) {
    var addr = this.props.addr
    this.props.viewChannel({addr, channel})
  }

  render () {
    var self = this
    const { addCabal, addr, cabals, cabal, username } = this.props

    var userKeys = Object.keys(cabal.users).sort()
    var channelKeys = Object.keys(cabal.channels)
    var cabalKeys = Object.keys(cabals)

    return (<div className='sidebar'>
      <div className=''>
        <div className=''>
          <div className='add-channel'>
            <button onClick={self.joinCabal.bind(self)}> Add Cabal</button>
          </div>
          <div className='cabals'>
            <div className='heading'>Cabals</div>
            <ul>
              {cabalKeys.map(function (key) {
                var cabal = cabals[key]
                return (
                  <li className={addr === cabal.addr ? 'active' : ''} key={key}>
                    <button onClick={self.selectCabal.bind(self, key)}>
                      {cabal.addr}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
      <div className='copy-link'>
        <button onClick={self.copyClick.bind(self)}>Copy Secret Key</button>
      </div>
      <div className='add-channel'>
        <InputPrompt
          placeholder='Channel name'
          prompt='+ Join Channel'
          onSubmit={self.joinChannel.bind(self)} />
      </div>
      <div className='sidebar-scroll'>
        <div className='channels'>
          <div className='heading'>Channels</div>
          <ul>
            {
              cabal.channels.map((channel) =>
                <li className={cabal.channel === channel ? 'active' : ''} key={channel}>
                  <button onClick={this.selectChannel.bind(this, channel)}>
                    {channel}
                  </button>
                </li>
              )
            }
          </ul>
        </div>
        <div className='users'>
          <div className='heading'>Peers</div>
          <ul className='users-list'>
            {userKeys.map((_username) =>
              (_username !== username) && <li> {_username}</li>
            )}
          </ul>
          <ul className='status'>
            <InputPrompt
              placeholder='Enter name'
              prompt={cabal.username}
              onSubmit={username => this.props.changeUsername({ username, addr: this.props.addr })}
            />
          </ul>
        </div>
      </div>
    </div>
    )
  }
}

const Sidebar = connect(mapStateToProps, mapDispatchToProps)(SidebarScreen)

export default Sidebar
