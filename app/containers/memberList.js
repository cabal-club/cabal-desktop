import React from 'react'
import { connect } from 'react-redux'
import { currentChannelMembersSelector } from '../selectors'

import {
  showProfilePanel
} from '../actions'
import Avatar from './avatar'

const mapDispatchToProps = dispatch => ({
  showProfilePanel: ({ addr, userKey }) => dispatch(showProfilePanel({ addr, userKey }))
})

function MemberList (props) {
  function onClickUser (user) {
    props.showProfilePanel({
      addr: props.addr,
      userKey: user.key
    })
  }

  return (
    <>
      {props.members && props.members.map((user) =>
        <div key={user.key} className='collection__item' onClick={() => onClickUser(user)} title={user.key}>
          <div className='collection__item__icon'>
            {!!user.online &&
              <img alt='Online' src='static/images/icon-status-online.svg' />}
            {!user.online &&
              <img alt='Offline' src='static/images/icon-status-offline.svg' />}
          </div>
          <Avatar name={user.key} scale={2} />
          {!!user.online &&
            <div className='collection__item__content active'>{user.name || user.key.substring(0, 6)}</div>}
          {!user.online &&
            <div className='collection__item__content'>{user.name || user.key.substring(0, 6)}</div>}
          <div className='collection__item__handle' />
        </div>
      )}
    </>
  )
}

export default connect(state => {
  return {
    members: currentChannelMembersSelector(state)
  }
}, mapDispatchToProps)(MemberList)
