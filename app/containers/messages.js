import React from 'react'

import Avatar from './avatar'

export default function MessagesContainer (props) {
  const renderDate = (time) => {
    return (
      <span>
        {time.short}
        <span className='messages__item__metadata__date'>{time.full}</span>
      </span>
    )
  }
  const messages = props.cabal.messages
  if (messages.length === 0) {
    return (
      <div className='messages starterMessage'>
        This is a new channel. Send a message to start things off!
      </div>
    )
  } else {
    let lastAuthor = null
    return (
      <div className='messages'>
        {messages.map((message, index) => {
          const enriched = message.enriched
          const repeatedAuthor = message.author === lastAuthor
          const me = message.author === props.cabal.username
          lastAuthor = message.author
          if (message.type === 'local/system') {
            var defaultSystemName = 'Cabalbot'
            return (
              <div key={index} className='messages__item messages__item--system'>
                <div className='messages__item__avatar'>
                  <div className='messages__item__avatar__img'>
                    <Avatar name={message.author || defaultSystemName} />
                  </div>
                </div>
                <div className='messages__item__metadata'>
                  <div className='messages__item__metadata__name'>{message.author || defaultSystemName}{renderDate(enriched.time)}</div>
                  <div className='text'>{enriched.content}</div>
                </div>
              </div>
            )
          }
          if (message.type === 'chat/text') {
            return (
              <div key={index} className='messages__item'>
                <div className='messages__item__avatar'>
                  {repeatedAuthor ? null : <Avatar name={message.author || 'conspirator'} />}
                </div>
                <div className='messages__item__metadata'>
                  {repeatedAuthor ? null : <div className='messages__item__metadata__name'>{message.author || 'conspirator'}{renderDate(enriched.time)}</div>}
                  <div className={repeatedAuthor ? 'text indent' : 'text'}>
                    {enriched.content}
                  </div>
                </div>
              </div>
            )
          }
          if (message.type === 'chat/emote') {
            return (
              <div key={index} className='messages__item messages__item--emote'>
                <div className='messages__item__avatar'>
                  <div className='messages__item__avatar__img'>
                    {repeatedAuthor ? null : <Avatar name={message.author || 'conspirator'} />}
                  </div>
                </div>
                <div className='messages__item__metadata'>
                  {repeatedAuthor ? null : <div className='messages__item__metadata__name'>{message.author}{renderDate(enriched.time)}</div>}
                  <div className={repeatedAuthor ? 'text indent' : 'text'}>enriched.content</div>
                </div>
              </div>
            )
          }
        })}
      </div>
    )
  }
}
