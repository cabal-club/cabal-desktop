import { addLocalSystemMessage, changeUsername, joinChannel, removeCabal, setChannelTopic } from './actions'
const PATTERN = (/^\/(\w*)\s*(.*)/)

const commander = (cabal, message) => (dispatch) => {
  var addr = cabal.key
  var text
  if (message && message.content && message.content.text) {
    text = message.content.text
  }
  var m = PATTERN.exec(text) || []
  var cmd = m[1] ? m[1].trim() : ''
  var arg = m[2] ? m[2].trim() : ''
  switch (cmd) {
    case 'help':
      var helpContent = `/nick or /n\n&nbsp;&nbsp;Change your display name\n/join or /j\n&nbsp;&nbsp;Join a new channel/switch to existing channel\n/help\n&nbsp;&nbsp;Display this help message\n/motd or /topic\n&nbsp;&nbsp;Set the topic/description/message of the day for a channel\n/remove\n&nbsp;&nbsp;Remove cabal from Cabal Desktop`
      dispatch(addLocalSystemMessage({
        addr,
        content: helpContent
      }))
      break
    case 'join':
      var channel = arg
      dispatch(joinChannel({ addr, channel }))
      break
    case 'j':
      var channel = arg
      dispatch(joinChannel({ addr, channel }))
      break
    case 'motd':
      var topic = arg
      if (topic && topic.trim().length > 0) {
        cabal.topic = topic
        dispatch(setChannelTopic({
          addr,
          channel: cabal.client.channel,
          topic
        }))
      }
      break
    case 'nick':
      var username = arg
      if (!username.length) return
      cabal.username = username
      if (username && username.trim().length > 0) {
        dispatch(changeUsername({ addr, username }))
      }
      break
    case 'n':
      var username = arg
      if (!username.length) return
      cabal.username = username
      if (username && username.trim().length > 0) {
        dispatch(changeUsername({ addr, username }))
      }
      break
    case 'topic':
      var topic = arg
      if (topic && topic.trim().length > 0) {
        cabal.topic = topic
        dispatch(setChannelTopic({
          addr,
          channel: cabal.client.channel,
          topic
        }))
      }
      break
    case 'remove':
      dispatch(removeCabal({ addr }))
      break
    default:
      var content = `/${cmd} is not yet a command. \nAvailable commands: /join, /j, /help, /motd, /nick, /n, /remove, /topic \nTry /help for a list of command descriptions!`
      dispatch(addLocalSystemMessage({
        addr,
        content
      }))
      break
  }
}

export default commander
