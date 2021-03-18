import React from 'react'
import { connect } from 'react-redux'

import {
  confirmArchiveChannel,
  hideChannelPanel,
  leaveChannel
} from '../actions'
import MemberList from './memberList'

const mapStateToProps = state => ({
  addr: state.currentCabal,
  currentChannel: state.cabals[state.currentCabal].channel || ''
})

const mapDispatchToProps = dispatch => ({
  confirmArchiveChannel: ({ addr, channel }) => dispatch(confirmArchiveChannel({ addr, channel })),
  hideChannelPanel: ({ addr }) => dispatch(hideChannelPanel({ addr })),
  leaveChannel: ({ addr, channel }) => dispatch(leaveChannel({ addr, channel }))
})

function ChannelPanel ({ addr, confirmArchiveChannel, currentChannel, hideChannelPanel, leaveChannel }) {
  function onClickLeaveChannel () {
    leaveChannel({
      addr,
      channel: currentChannel
    })
  }

  function onClickArchiveChannel () {
    confirmArchiveChannel({
      addr,
      channel: currentChannel
    })
  }

  const canLeave = currentChannel !== '!status' && !!currentChannel
  const hasMembers = currentChannel !== '!status'

  return (
    <div className='panel ChannelPanel'>
      <div className='panel__header'>
        Channel Details
        <span onClick={() => hideChannelPanel({ addr })} className='close'><img src='static/images/icon-composermeta.svg' /></span>
      </div>
      {canLeave &&
        <div className='panel__content'>
          <div className='content__container'>
            <button className='button' onClick={onClickLeaveChannel}>
              Leave Channel
            </button>
            <button className='button' onClick={onClickArchiveChannel}>
              Archive Channel
            </button>
          </div>
        </div>}
      {hasMembers &&
        <>
          <div className='section__header'>
            Channel Members
          </div>
          <div className='panel__content'>
            <MemberList addr={addr} />
          </div>
        </>}
    </div>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelPanel)
