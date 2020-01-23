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

  const messages = props.cabal.messages || []
  let printDate, previousDate
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
          previousDate = printDate
          printDate = enriched.time.full
          const nextMessageTime = messages[index + 1] && messages[index + 1].enriched.time.full
          const showDivider = previousDate && previousDate !== printDate && nextMessageTime === printDate
          let item = (<div />)
          lastAuthor = message.author
          if (message.type === 'status') {
            const defaultSystemName = 'Cabalbot'
            item = (
              <div className='messages__item messages__item--system'>
                <div className='messages__item__avatar'>
                  <div className='messages__item__avatar__img'>
                    <Avatar name={message.author || defaultSystemName} />
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
                <div className='messages__item__avatar'>
                  {repeatedAuthor ? null : <Avatar name={message.author || message.key.substr(0, 6)} />}
                </div>
                <div className='messages__item__metadata'>
                  {repeatedAuthor ? null : <div className='messages__item__metadata__name'>{message.author || message.key.substr(0, 6)}{renderDate(enriched.time)}</div>}
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
                  <div className='messages__item__avatar__img'>
                    {repeatedAuthor ? null : <Avatar name={message.author || message.key.substr(0, 6)} />}
                  </div>
                </div>
                <div className='messages__item__metadata'>
                  {repeatedAuthor ? null : <div className='messages__item__metadata__name'>{message.author}{renderDate(enriched.time)}</div>}
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
