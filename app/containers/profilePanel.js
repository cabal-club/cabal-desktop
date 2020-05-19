import React from 'react'
import { connect } from 'react-redux'

import {
  hideProfilePanel
} from '../actions'
import Avatar from './avatar'

const mapStateToProps = state => ({
  addr: state.currentCabal,
  cabal: state.cabals[state.currentCabal]
})

const mapDispatchToProps = dispatch => ({
  hideProfilePanel: ({ addr }) => dispatch(hideProfilePanel({ addr }))
})

function ProfilePanel (props) {
  const user = props.user

  function onClickHideUser () {
    console.log('hide', user)
  }

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
        </div>
      </div>
      <div className='section__header'>
        Moderation
      </div>
      <div className='panel__content'>
        <div className='help__text'>The following features are a work in progress and may not be fully functional yet.</div>
        <br />
        <br />
        <button className='button' onClick={onClickHideUser}>Mute this peer</button>
        <div className='help__text'>Muting a peer hides all of their future messages, while preserving their messages prior to the mute.</div>
        <br />
        <br />
        <button className='button' onClick={onClickHideUser}>Hide this peer</button>
        <div className='help__text'>Hiding a peer hides all of their past and future messages.</div>
        <br />
        <br />
        <button className='button' onClick={onClickHideUser}>Block this peer</button>
        <div className='help__text'>Blocking a peer removes all of their messages from your computer. All past and future messages will not be visible, or even known about.</div>
      </div>
    </div>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ProfilePanel)
