import React from 'react'

import Avatar from './avatar'

export default function MessagesContainer (props) {
  const { cabal, onscroll, composerHeight } = props
  var messages = cabal.messages
  if (messages.length === 0) {
    return (
      <div className='messages starterMessage'>
      'This is a new channel. Send a message to start things off!'
      </div>
    )
  }
  var lastAuthor = null

  if (messages.length > 0) {
    return (
      <div className='messages'
        style={{paddingBottom: composerHeight}}
        onScroll={onscroll}>
        {messages.map((message) => {
          var repeatedAuthor = message.author === lastAuthor
          var me = message.author === cabal.username
          lastAuthor = message.author
          if (message.type === 'local/system') {
            return (<li className='system message clearfix'>
              <div className='author'>System</div>
              <pre>{message.content}</pre>
            </li>)
          }
          if (message.type === 'chat/text') {
            return (<li className={(me ? 'me' : '') + ' message clearfix'}>
              {!repeatedAuthor &&
                <div className='message-author'>
                  <Avatar name={message.author} />
                  <div className='author'>{message.author}</div>
                </div>
              }
              <div className='message-meta'>
                <div className='text'>{message.content}</div>
                <span className='timestamp'>{message.time}</span>
              </div>
            </li>)
          }
          if (message.type === 'chat/emote') {
            return (<li className={(me ? 'me' : '') + ' message clearfix'}>
              {!repeatedAuthor && <div className='author'>{message.author}</div>}
              <div className='message-meta'>
                <div className='text'>{message.content}</div>
                <span className='timestamp'>{message.time}</span>
              </div>
            </li>)
          }
        })}
      </div>
    )
  }
}
