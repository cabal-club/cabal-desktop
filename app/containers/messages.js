import React from 'react'
import moment from 'moment'
import remark from 'remark'
import remarkEmoji from 'remark-emoji'
import remarkReact from 'remark-react'

import Avatar from './avatar'

export default function MessagesContainer (props) {
  const enrichText = (content) => {
    return remark().use(remarkReact).use(remarkEmoji).processSync(content).contents
  }

  const renderTimestamp = _moment =>  _moment.format(timestamp(_moment))


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
                  <div className='messages__item__metadata__name'>System<span>{renderTimestamp(moment(message.time))}</span></div>
                  <div className='text'>{enrichText(message.content)}</div>
                </div>
              </div>
            )
          }
          if (message.type === 'chat/text') {
            return (
              <div key={index} className='messages__item'>
                <div className='messages__item__avatar'>
                  {repeatedAuthor ? null : <Avatar name={message.author} />}
                </div>
                <div className='messages__item__metadata'>
                  {repeatedAuthor ? null : <div className='messages__item__metadata__name' >{message.author}<span>{renderTimestamp(moment(message.time))}</span></div>}
                  <div className={repeatedAuthor ? 'text indent' : 'text'}>
                    {enrichText(message.content)}
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
                  {repeatedAuthor ? null : <Avatar name={message.author} />}
                  </div>
                </div>
                <div className='messages__item__metadata'>
                  {repeatedAuthor ? null : <div className='messages__item__metadata__name'>{message.author}<span>{moment(message.time).format('h:mm A')}</span></div>}
                  <div className={repeatedAuthor ? 'text indent' : 'text'}>{enrichText(message.content)}</div>
                </div>
              </div>
            )
          }
        })}
      </div>
    )
  }
}

const today = moment()
function timestamp(message) {
  if ( !(message instanceof moment) ) return null

  return strategy( matcher(message) )
}

function strategy(matches) {
  const base = 'h:mm A'

  if (!matches[2].isSame) {
    return `DD/MM/YYYY - ${base}`
  }

  if (!matches[1].isSame) {
    return `ddd DD MMM  - ${base}`
  }

  if (!matches[0].isSame) {
    return `ddd - ${base}`
  }

  return base
}

function matcher(_moment) {
  return [
    {unit: 'day', isSame: null},
    {unit: 'week', isSame: null},
    {unit: 'year', isSame: null}
  ].map( ({unit}) => ({ unit, isSame: today.isSame(_moment, unit)}) )
}

