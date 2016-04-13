export class Message {
  constructor(msg) {
    this.prefix = msg.prefix
    this.command = msg.command
    this.rawCommand = msg.rawCommand
    this.commandType = msg.commandType
    this.arguments = msg.arguments
  }
}

export class ServerMessage extends Message {
  constructor(msg) {
    super(msg)

    this.server = msg.server
  }
}

export class UserMessage extends Message {
  constructor(msg) {
    super(msg)

    this.nick = msg.nick
    this.user = msg.user
    this.host = msg.host
  }
}
