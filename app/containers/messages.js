import React from 'react'
import { connect } from 'react-redux'
import moment from 'moment'

import {
  getUser,
  showProfilePanel
} from '../actions'
import Avatar from './avatar'
import { currentChannelMessagesSelector, currentChannelSelector } from '../selectors'

const mapStateToProps = state => ({
  addr: state.currentCabal,
  messages: currentChannelMessagesSelector(state),
  channel: currentChannelSelector(state)
})

const mapDispatchToProps = dispatch => ({
  getUser: ({ key }) => dispatch(getUser({ key })),
  showProfilePanel: ({ addr, userKey }) => dispatch(showProfilePanel({ addr, userKey }))
})

function MessagesContainer(props) {
  const onClickProfile = (user) => {
    props.showProfilePanel({
      addr: props.addr,
      userKey: user.key
    })
  }

  const renderDate = (time) => {
    return (
      <span>
        {time.short}
        <span className='messages__item__metadata__date'>{time.long}</span>
      </span>
    )
  }

  const seen = {}
  const messages = (props.messages ?? []).filter((message) => {
    const messageId = message.key + message.message.seq
    if (typeof seen[messageId] === 'undefined') {
      seen[messageId] = true
      return true
    }
    return false
  })

  let lastDividerDate = moment() // hold the time of the message for which divider was last added

  if (messages.length === 0 && props.channel !== '!status') {
    return (
      <div className='messages starterMessage'>
        This is a new channel. Send a message to start things off!
      </div>
    )
  } else {
    const defaultSystemName = 'Cabalbot'
    let prevMessage = {}
    return (
      <>
        <div className='messages'>
          {messages.map((message) => {
            // Hide messages from hidden users
            const user = message.user
            if (user && user.isHidden()) return null

            const enriched = message.enriched
            // avoid comaprison with other types of message than chat/text

            const repeatedAuthor = message.key === prevMessage.key && prevMessage.type === 'chat/text'
            const printDate = moment(enriched.time)
            const formattedTime = {
              short: printDate.format('h:mm A'),
              long: printDate.format('LL')
            }
            // divider only needs to be added if its a normal message
            // and if day has changed since the last divider
            const showDivider = message.content && !lastDividerDate.isSame(printDate, 'day')
            if (showDivider) {
              lastDividerDate = printDate
            }
            let item = (<div />)
            prevMessage = message
            if (message.type === 'status') {
              item = (
                <div className='messages__item messages__item--system'>
                  <div className='messages__item__avatar'>
                    <div className='messages__item__avatar__img'>
                      <Avatar name={message.key || defaultSystemName} />
                    </div>
                  </div>
                  <div className='messages__item__metadata'>
                    <div className='messages__item__metadata__name'>{message.name || defaultSystemName}{renderDate(formattedTime)}</div>
                    <div className='text'>{enriched.content}</div>
                  </div>
                </div>
              )
            }
            if (message.type === 'chat/moderation') {
              const { role, type, issuerid, receiverid, reason } = message.message.value.content
              const issuer = props.getUser({ key: issuerid })
              const receiver = props.getUser({ key: receiverid })
              const issuerName = issuer && issuer.name ? issuer.name : issuerid.slice(0, 8)
              const receiverName = receiver && receiver.name ? receiver.name : receiverid.slice(0, 8)
              item = (
                <div className='messages__item messages__item--system'>
                  <div className='messages__item__avatar'>
                    <div className='messages__item__avatar__img'>
                      <Avatar name={message.key || defaultSystemName} />
                    </div>
                  </div>
                  <div className='messages__item__metadata'>
                    <div className='messages__item__metadata__name'>{message.name || defaultSystemName}{renderDate(formattedTime)}</div>
                    <div className='text'>
                      {role === 'hide' &&
                        <div>
                          <a className='name' onClick={onClickProfile.bind(this, issuer)}>{issuerName}</a> {(type === 'add' ? 'hid' : 'unhid')} <a className='name' onClick={onClickProfile.bind(this, receiver)}>{receiverName}</a>
                        </div>}
                      {role !== 'hide' &&
                        <div>
                          <a className='name' onClick={onClickProfile.bind(this, issuer)}>{issuerName}</a> {(type === 'add' ? 'added' : 'removed')} <a className='name' onClick={onClickProfile.bind(this, receiver)}>{receiverName}</a> as {role}
                        </div>}
                      {!!reason &&
                        <div>({reason})</div>}
                    </div>
                  </div>
                </div>
              )
            }
            if (message.type === 'chat/text') {
              item = (
                <div className='messages__item'>
                  <div className='messages__item__avatar' onClick={onClickProfile.bind(this, user)}>
                    {repeatedAuthor ? null : <Avatar name={message.key} />}
                  </div>
                  <div className='messages__item__metadata'>
                    {!repeatedAuthor &&
                      <div onClick={onClickProfile.bind(this, user)} className='messages__item__metadata__name'>
                        {user.name}
                        {user.isAdmin() && <span className='sigil admin' title='Admin'>@</span>}
                        {!user.isAdmin() && user.isModerator() && <span className='sigil moderator' title='Moderator'>%</span>}
                        {renderDate(formattedTime)}
                      </div>}
                    <div className={repeatedAuthor ? 'text indent' : 'text'}>
                      {enriched.content}
                    </div>
                  </div>
                </div>
              )
            }
            if (message.type === 'chat/emote') {
              item = (
                <div className='messages__item messages__item--emote'>
                  <div className='messages__item__avatar'>
                    <div className='messages__item__avatar__img' onClick={onClickProfile.bind(this, user)}>
                      {repeatedAuthor ? null : <Avatar name={message.key} />}
                    </div>
                  </div>
                  <div className='messages__item__metadata'>
                    {repeatedAuthor ? null : <div onClick={onClickProfile.bind(this, user)} className='messages__item__metadata__name'>{user.name}{renderDate(formattedTime)}</div>}
                    <div className={repeatedAuthor ? 'text indent' : 'text'}>{enriched.content}</div>
                  </div>
                </div>
              )
            }
            return (
              <div key={message.time + message.key}>
                {showDivider && (
                  <div className='messages__date__divider'>
                    <h2> {formattedTime.long} <span>({printDate.fromNow()})</span> </h2>
                  </div>
                )}
                {item}
              </div>
            )
          })}
        </div>
      </>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MessagesContainer)
