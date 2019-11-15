import { addLocalSystemMessage, changeUsername, joinChannel, removeCabal, setChannelTopic } from './actions'

const commander = (addr, message) => (dispatch) => {
  var self = this

  this.commands = {
    help: {
      help: () => 'display this help message',
      call: (arg) => {
        var helpContent = ''
        for (var key in this.commands) {
          helpContent = helpContent + `/${key} - ${this.commands[key].help()} \n`
        }
        dispatch(addLocalSystemMessage({ addr, content: helpContent }))
      }
    },
    nick: {
      help: () => 'change your display name',
      call: (arg) => {
        var username = arg
        if (!username.length) return
        if (username && username.trim().length > 0) {
          dispatch(changeUsername({ addr, username }))
        }
      }
    },
    // emote: {
    //   help: () => 'write an old-school text emote',
    //   call: (arg) => {
    //     sendMessage({
    //       text: arg,
    //       type: 'chat/emote'
    //     })
    //   }
    // },
    join: {
      help: () => 'join a new channel',
      call: (arg) => {
        var channel = arg || 'default'
        dispatch(joinChannel({ addr, channel }))
      }
    },
    // quit: {
    //   help: () => 'exit the cabal process',
    //   call: (arg) => {
    //     // TODO
    //     // process.exit(0)
    //   }
    // },
    topic: {
      help: () => 'set the topic/description/"message of the day" for a channel',
      call: (arg) => {
        var topic = arg
        if (topic && topic.trim().length > 0) {
          // TODO NICK
          dispatch(setChannelTopic({
            addr,
            // channel: cabal.client.channel,
            topic
          }))
        }
      }
    },
    // whoami: {
    //   help: () => 'display your local user key',
    //   call: (arg) => {
    //     // TODO
    //     // self.view.writeLine.bind(self.view)('Local user key: ' + self.cabal.client.user.key)
    //   }
    // },
    // alias: {
    //   help: () => 'set alias for the cabal',
    //   call: (arg) => {
    //     renameCabalAlias(arg)
    //   }
    // },
    // add: {
    //   help: () => 'add a cabal',
    //   call: (arg) => {
    //     addAnotherCabal(arg)
    //   }
    // },
    remove: {
      help: () => 'remove cabal from Cabal Desktop',
      call: (arg) => {
        addr = arg || addr
        dispatch(removeCabal({ addr }))
      }
    }
  }

  this.alias = (command, alias) => {
    self.commands[alias] = {
      help: self.commands[command].help,
      call: self.commands[command].call
    }
  }

  // add aliases to commands
  // this.alias('emote', 'me')
  this.alias('join', 'j')
  this.alias('nick', 'n')
  this.alias('topic', 'motd')
  // this.alias('whoami', 'key')

  if (!addr) {
    return this.commands
  }

  this.history = []
  this.pattern = (/^\/(\w*)\s*(.*)/)

  var text
  if (message && message.content && message.content.text) {
    text = message.content.text
  }
  var m = this.pattern.exec(text) || []
  var cmd = m[1] ? m[1].trim() : ''
  var arg = m[2] ? m[2].trim() : ''

  if (cmd in this.commands) {
    this.commands[cmd].call(arg)
  } else if (cmd) {
    var content = `/${cmd} is not yet a command. \nTry /help for a list of command descriptions`
    dispatch(addLocalSystemMessage({ addr, content }))
  }
}

export default commander
