import React from 'react'
import { connect } from 'react-redux'

import {
  getUser,
  hideProfilePanel,
  moderationAddAdmin,
  moderationAddMod,
  moderationBlock,
  moderationHide,
  moderationRemoveAdmin,
  moderationRemoveMod,
  moderationUnhide,
  joinChannel
} from '../actions'
import Avatar from './avatar'

const mapStateToProps = state => ({
  addr: state.currentCabal,
  cabal: state.cabals[state.currentCabal]
})

const mapDispatchToProps = dispatch => ({
  getUser: ({ key }) => dispatch(getUser({ key })),
  hideProfilePanel: ({ addr }) => dispatch(hideProfilePanel({ addr })),
  moderationAddAdmin: ({ addr, channel, reason, userKey }) => dispatch(moderationAddAdmin({ addr, channel, reason, userKey })),
  moderationAddMod: ({ addr, channel, reason, userKey }) => dispatch(moderationAddMod({ addr, channel, reason, userKey })),
  moderationBlock: ({ addr, channel, reason, userKey }) => dispatch(moderationBlock({ addr, channel, reason, userKey })),
  moderationHide: ({ addr, channel, reason, userKey }) => dispatch(moderationHide({ addr, channel, reason, userKey })),
  moderationRemoveAdmin: ({ addr, channel, reason, userKey }) => dispatch(moderationRemoveAdmin({ addr, channel, reason, userKey })),
  moderationRemoveMod: ({ addr, channel, reason, userKey }) => dispatch(moderationRemoveMod({ addr, channel, reason, userKey })),
  moderationUnhide: ({ addr, channel, reason, userKey }) => dispatch(moderationUnhide({ addr, channel, reason, userKey })),
  joinChannel: ({ addr, channel }) => dispatch(joinChannel({ addr, channel }))
})

function ProfilePanel (props) {
  const user = props.getUser({ key: props.userKey })

  function onClickStartPM (e) {
    props.joinChannel({ addr: props.addr, channel: props.userKey })
  }

  function onClickHideUserAll () {
    props.moderationHide({
      addr: props.addr,
      userKey: user.key
    })
  }

  function onClickUnhideUserAll () {
    props.moderationUnhide({
      addr: props.addr,
      userKey: user.key
    })
  }

  function onClickAddModAll () {
    props.moderationAddMod({
      addr: props.addr,
      userKey: user.key
    })
  }

  function onClickRemoveModAll () {
    props.moderationRemoveMod({
      addr: props.addr,
      userKey: user.key
    })
  }

  function onClickAddAdminAll () {
    props.moderationAddAdmin({
      addr: props.addr,
      userKey: user.key
    })
  }

  function onClickRemoveAdminAll () {
    props.moderationRemoveAdmin({
      addr: props.addr,
      userKey: user.key
    })
  }

  const isSelf = user.key === props.cabal.userkey

  return (
    <div className='panel profilePanel'>
      <div className='panel__header'>
        Profile
        <span onClick={() => props.hideProfilePanel({ addr: props.addr })} className='close'><img src='static/images/icon-composermeta.svg' /></span>
      </div>
      <div className='panel__content'>
        <div className='profile__header'>
          <Avatar name={user.key} className='avatar' scale={12} />
          <div className='avatar__online__indicator'>
            {!!user.online &&
              <div title='Online' className='indicator online' />}
            {!user.online &&
              <div title='Offline' className='indicator offline' />}
          </div>
          <h1 className='name'>{user.name}</h1>
          <h2 className='key' title={user.key}>{user.key}</h2>
          <div className='sigilContainer'>
            {isSelf
              ? <div className='sigil'>You</div>
              : user.isAdmin() && <div className='sigil admin'>Admin</div>}
            {user.isModerator() && <div className='sigil moderator'>Moderator</div>}
            {user.isHidden() && <div className='sigil hidden'>Hidden</div>}
          </div>
        </div>
      </div>
      <div className='section__header'>
        Messages
      </div>
      <div className='panel__content'>
        <div className='content__container'>
          <button className='button' onClick={onClickStartPM}>Send private message</button>
          <div className='help__text'>Start an encrypted 1-on-1 chat that only you and this peer can read.</div>
        </div>
      </div>
      {!isSelf &&
        <>
          <div className='section__header'>
            Moderation
          </div>
          <div className='panel__content'>
            <div className='content__container'>
              {!user.isHidden() &&
                <>
                  <button className='button' onClick={onClickHideUserAll}>Hide this peer</button>
                  <div className='help__text'>Hiding a peer hides all of their past and future messages in all channels.</div>
                </>}
              {user.isHidden() &&
                <>
                  <button className='button' onClick={onClickUnhideUserAll}>Unhide this peer</button>
                  <div className='help__text'>Hiding a peer hides all of their past and future messages in all channels.</div>
                </>}
              {!user.isModerator() &&
                <>
                  <button className='button' onClick={onClickAddModAll}>Add moderator</button>
                  <div className='help__text'>Adding another user as a moderator for you will apply their moderation settings to how you see this cabal.</div>
                </>}
              {user.isModerator() &&
                <>
                  <button className='button' onClick={onClickRemoveModAll}>Remove moderator</button>
                  <div className='help__text'>Adding another user as a moderator for you will apply their moderation settings to how you see this cabal.</div>
                </>}
              {!user.isAdmin() &&
                <>
                  <button className='button' onClick={onClickAddAdminAll}>Add admin</button>
                  <div className='help__text'>Adding another user as an admin for you will apply their moderation settings to how you see this cabal.</div>
                </>}
              {user.isAdmin() &&
                <>
                  <button className='button' onClick={onClickRemoveAdminAll}>Remove admin</button>
                  <div className='help__text'>Adding another user as an admin for you will apply their moderation settings to how you see this cabal.</div>
                </>}
            </div>
          </div>
        </>}
    </div>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ProfilePanel)
