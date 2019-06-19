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
    case 'join':
      var channel = arg
      dispatch(joinChannel({ addr, channel }))
      break
    case 'nick':
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
      var content = `/${cmd} is not yet a command. \n Available commands: /nick /topic /remove /join \n`
      dispatch(addLocalSystemMessage({
        addr,
        content
      }))
      break
  }
}

export default commander
