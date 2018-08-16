import React from 'react'
import moment from 'moment'
import createLinkify from 'linkify-it'

import Avatar from './avatar'

const linkify = createLinkify()

export default function MessagesContainer (props) {
  const { cabal, onscroll, toggleEmojis, composerHeight } = props
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
      <div className='messages' onScroll={onscroll} onClick={(e) => toggleEmojis(false)}>
        {messages.map((message, index) => {
          var repeatedAuthor = message.author === lastAuthor
          var me = message.author === cabal.username
          lastAuthor = message.author
          if (message.type === 'local/system') {
            return (
              <div key={index} className='messages__item messages__item--system'>
                <div className='messages__item__metadata'>
                  <div className='messages__item__metadata__name'>System<span>{moment(message.time).format('h:mm A')}</span></div>
                  <p className='text'>{enrich(message.content)}</p>
                </div>
              </div>
            )
          }
          if (message.type === 'chat/text') {
            return (
              <div key={index} className='messages__item'>
                <div className='messages__item__avatar'>
                  <Avatar name={message.author} />
                </div>
                <div className='messages__item__metadata'>
                  <div className='messages__item__metadata__name'>{message.author}<span>{moment(message.time).format('h:mm A')}</span></div>
                  <p className='text'>{enrich(message.content)}</p>
                </div>
              </div>
            )
          }
          if (message.type === 'chat/emote') {
            return (
              <div key={index} className='messages__item messages__item--emote'>
                <div className='messages__item__avatar'>
                  <div className='messages__item__avatar__img'>
                    <Avatar name={message.author} />
                  </div>
                </div>
                <div className='messages__item__metadata'>
                  <div className='messages__item__metadata__name'>{message.author}<span>{moment(message.time).format('h:mm A')}</span></div>
                  <p className='text'>{enrich(message.content)}</p>
                </div>
              </div>
            )
          }
        })}
      </div>
    )
  }
}

function enrich (content) {
  if (!linkify.pretest(content) || !linkify.test(content)) {
    return content
  }

  let elements = []
  let _lastIndex = 0

  linkify.match(content).forEach(({ index, lastIndex, text, url }) => {
    let nonLinkedText = content.substring(_lastIndex, index)
    nonLinkedText && elements.push(nonLinkedText)
    _lastIndex = lastIndex
    elements.push(
      <a
        key={index}
        className='link'
        href={url}
      >{text}</a>
    )
  })

  elements.push(content.substring(_lastIndex, content.length))

  return elements
}
