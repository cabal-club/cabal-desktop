import { joinChannel, changeUsername, removeCabal } from './actions'
const PATTERN = (/^\/(\w*)\s*(.*)/)

const commander = (cabal, message) => (dispatch) => {
  var key = cabal.key
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
      dispatch(joinChannel({ addr: key, channel }))
      break
    case 'nick':
      var username = arg
      if (!username.length) return
      cabal.username = username
      if (username && username.trim().length > 0) {
        dispatch(changeUsername({ addr: key, username }))
      }
      break
    case 'remove':
      dispatch(removeCabal({ key }))
      break
    default:
      break
  }
}

export default commander
