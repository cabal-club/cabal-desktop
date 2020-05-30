import React from 'react'
import { connect } from 'react-redux'
import moment from 'moment'

import {
  showProfilePanel
} from '../actions'
import Avatar from './avatar'

const mapStateToProps = state => ({
  addr: state.currentCabal,
  cabal: state.cabals[state.currentCabal]
})

const mapDispatchToProps = dispatch => ({
  showProfilePanel: ({ addr, user }) => dispatch(showProfilePanel({ addr, user }))
})

function MessagesContainer(props) {
  const onClickProfile = (user) => {
    props.showProfilePanel({
      addr: props.addr,
      user
    })
  }

  const renderDate = (time) => {
    return (
      <span>
        {time.short}
        <span className='messages__item__metadata__date'>{time.full}</span>
      </span>
    )
  }

  const messages = props.cabal.messages || []
  let lastDividerDate // hold the time of the message for which divider was last added

  if (messages.length === 0 && props.cabal.channel !== '!status') {
    return (
      <div className='messages starterMessage'>
        This is a new channel. Send a message to start things off!
      </div>
    )
  } else {
    let prevMessage = {}
    return (
      <div className='messages'>
        {messages.map((message) => {
          const enriched = message.enriched
          // avoid comaprison with other types of message than chat/text

          const repeatedAuthor = message.key === prevMessage.key && prevMessage.type === 'chat/text'
          const printDate = enriched.time.full

          // divider only needs to be added if its a normal message
          // and if day has changed since the last divider
          const showDivider = message.content && !moment(lastDividerDate).isSame(moment(printDate), 'day')
          if (showDivider) {
            lastDividerDate = printDate
          }

          const user = {
            key: message.key,
            name: message.author
          }
          let item = (<div />)
          prevMessage = message
          if (message.type === 'status') {
            const defaultSystemName = 'Cabalbot'
            item = (
              <div className='messages__item messages__item--system'>
                <div className='messages__item__avatar'>
                  <div className='messages__item__avatar__img'>
                    <Avatar name={message.key || defaultSystemName} />
                  </div>
                </div>
                <div className='messages__item__metadata'>
                  <div className='messages__item__metadata__name'>{message.name || defaultSystemName}{renderDate(enriched.time)}</div>
                  <div className='text'>{enriched.content}</div>
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
                  {repeatedAuthor ? null : <div onClick={onClickProfile.bind(this, user)} className='messages__item__metadata__name'>{message.author || message.key.substr(0, 6)}{renderDate(enriched.time)}</div>}
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
                  {repeatedAuthor ? null : <div onClick={onClickProfile.bind(this, user)} className='messages__item__metadata__name'>{message.author}{renderDate(enriched.time)}</div>}
                  <div className={repeatedAuthor ? 'text indent' : 'text'}>{enriched.content}</div>
                </div>
              </div>
            )
          }
          return (
            <div key={message.time + message.key}>
              {showDivider && (
                <div className='messages__date__divider'>
                  <h2> {printDate} <span>({enriched.time.diff})</span> </h2>
                </div>
              )}
              {item}
            </div>
          )
        })}
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MessagesContainer)
