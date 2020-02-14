import React from 'react'
import { connect } from 'react-redux'
import { currentChannelMembersSelector } from '../selectors'

function MemberList ({ members = [] }) {
  console.log('memebers re', members)
  return (
    <div
      className='memberList'
    >
      <div className='memberList__header'> Channel Members </div>
      {members.map((user) =>
        <div key={user.key} className='collection__item'>
          <div className='collection__item__icon'>
            {!!user.online &&
              <img alt='Online' src='static/images/icon-status-online.svg' />}
            {!user.online &&
              <img alt='Offline' src='static/images/icon-status-offline.svg' />}
          </div>
          {!!user.online &&
            <div className='collection__item__content active'>{user.name || user.key.substring(0, 6)}</div>}
          {!user.online &&
            <div className='collection__item__content'>{user.name || user.key.substring(0, 6)}</div>}
          <div className='collection__item__handle' />
        </div>
      )}
    </div>
  )
}

export default connect(state => {
  return {
    members: currentChannelMembersSelector(state)
  }
}, null)(MemberList)
