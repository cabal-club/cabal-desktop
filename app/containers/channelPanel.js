import React from 'react'
import { connect } from 'react-redux'

import {
  hideChannelPanel,
  leaveChannel,
  moderationAddAdmin,
  moderationAddMod,
  moderationBlock,
  moderationHide,
  moderationRemoveAdmin,
  moderationRemoveMod,
  moderationUnblock,
  moderationUnhide
} from '../actions'
import MemberList from './memberList'

const mapStateToProps = state => ({
  addr: state.currentCabal,
  cabal: state.cabals[state.currentCabal]
})

const mapDispatchToProps = dispatch => ({
  hideChannelPanel: ({ addr }) => dispatch(hideChannelPanel({ addr })),
  leaveChannel: ({ addr, channel }) => dispatch(leaveChannel({ addr, channel })),
  moderationAddAdmin: ({ addr, channel, reason, userKey }) => dispatch(moderationAddAdmin({ addr, channel, reason, userKey })),
  moderationAddMod: ({ addr, channel, reason, userKey }) => dispatch(moderationAddMod({ addr, channel, reason, userKey })),
  moderationBlock: ({ addr, channel, reason, userKey }) => dispatch(moderationBlock({ addr, channel, reason, userKey })),
  moderationHide: ({ addr, channel, reason, userKey }) => dispatch(moderationHide({ addr, channel, reason, userKey })),
  moderationRemoveAdmin: ({ addr, channel, reason, userKey }) => dispatch(moderationRemoveAdmin({ addr, channel, reason, userKey })),
  moderationRemoveMod: ({ addr, channel, reason, userKey }) => dispatch(moderationRemoveMod({ addr, channel, reason, userKey })),
  moderationUnblock: ({ addr, channel, reason, userKey }) => dispatch(moderationUnblock({ addr, channel, reason, userKey })),
  moderationUnhide: ({ addr, channel, reason, userKey }) => dispatch(moderationUnhide({ addr, channel, reason, userKey }))
})

function ChannelPanel (props) {
  function onClickLeaveChannel () {
    props.leaveChannel({
      addr: props.cabal.addr,
      channel: props.cabal.channel
    })
  }

  const canLeave = props.cabal.channel !== '!status'
  const hasMembers = props.cabal.channel !== '!status'

  return (
    <div className='panel ChannelPanel'>
      <div className='panel__header'>
        Channel Details
        <span onClick={() => props.hideChannelPanel({ addr: props.addr })} className='close'><img src='static/images/icon-composermeta.svg' /></span>
      </div>
      {canLeave &&
        <div className='panel__content'>
          <div className='content__container'>
            <button className='button' onClick={onClickLeaveChannel}>
              Leave Channel
            </button>
          </div>
        </div>}
      {hasMembers &&
        <>
          <div className='section__header'>
            Channel Members
          </div>
          <div className='panel__content'>
            <MemberList addr={props.addr} />
          </div>
        </>}
    </div>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelPanel)
