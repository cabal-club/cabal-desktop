import {joinChannel, updateCabal, addMessage} from './actions';
const PATTERN = /^\/(\w*)\s*(.*)/;

const commander = (cabal, message) => dispatch => {
  const addr = cabal.key;
  const m = PATTERN.exec(message.content.text);
  const cmd = m[1].trim();
  const arg = m[2].trim();
  switch (cmd) {
    case 'join':
      const channel = arg;
      dispatch(joinChannel({addr, channel}));
      break;
    case 'nick':
      const username = arg;
      if (!username.length) return;
      cabal.username = username;
      dispatch(updateCabal({addr, username}));
      break;
    case 'channels':
      return cabal.channels.get((err, channels) => {
        if (err) console.trace(err);
        const content = `${channels.join('\n')}`;
        const messages = cabal.client.channelMessages[message.content.channel];

        // cabal.messages is not an array here so the following doesn't work
        // cabal.messages.push({type: 'local/system', content});
        dispatch(
          updateCabal({
            addr,
            messages: [...messages, {type: 'local/system', content}],
          }),
        );
      });
    case 'emote':
    case 'e':
      const content = {
        type: 'chat/emote',
        content: {
          channel: message.content.channel,
          text: arg,
        },
      };
      dispatch(addMessage({message: content, addr}));
    default:
      break;
  }
};

export default commander;
