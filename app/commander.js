import { joinChannel, updateCabal } from './actions'
const PATTERN = (/^\/(\w*)\s*(.*)/)

const commander = (cabal, message) => (dispatch) => {
  var addr = cabal.addr
  var m = PATTERN.exec(message)
  var cmd = m[1].trim()
  var arg = m[2].trim()
  switch (cmd) {
    case 'join':
      var channel = arg
      dispatch(joinChannel({addr, channel}))
      break
    case 'nick':
      var username = arg
      if (!username.length) return
      cabal.username = username
      dispatch(updateCabal({addr, username}))
      break
    case 'channels':
      return cabal.getChannels((err, channels) => {
        if (err) console.trace(err)
        var content = `${channels.join('  \n')}\n`
        cabal.messages.push({type: 'local/system', content})
        dispatch(updateCabal({addr, messages: cabal.messages}))
      })
    default:
      break
  }
}

export default commander
