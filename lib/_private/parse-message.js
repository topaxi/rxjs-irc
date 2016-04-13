import codes from '../codes'
import { ServerMessage, UserMessage } from '../message'

export function parseMessage(msg) {
  let line    = String(msg)
  let message = {}
  let match

  // Parse prefix
  match = line.match(/^:([^ ]+) +/)
  if (match) {
    message.prefix = match[1]
    line = line.replace(/^:[^ ]+ +/, '')
    match = /^([_a-zA-Z0-9\~\[\]\\`^{}|-]*)(!([^@]+)@(.*))?$/
      .exec(message.prefix)
    if (match) {
      message.nick = match[1]
      message.user = match[3]
      message.host = match[4]
    }
    else {
      message.server = message.prefix
    }
  }

  // Parse command
  match = line.match(/^([^ ]+) */)
  message.command = match[1]
  message.rawCommand = match[1]
  message.commandType = 'normal'
  line = line.replace(/^[^ ]+ +/, '')

  if (codes[message.rawCommand]) {
    let { name, type } = codes[message.rawCommand]

    message.command = name
    message.commandType = type
  }

  message.arguments = []
  let middle, trailing

  // Parse parameters
  if (line.search(/^:|\s+:/) > -1) {
    match = line.match(/(.*?)(?:^:|\s+:)(.*)/)
    middle = match[1].trimRight()
    trailing = match[2]
  }
  else {
    middle = line
  }

  if (middle.length) {
    message.arguments = middle.split(/ +/)
  }

  if (typeof trailing !== 'undefined' && trailing.length) {
    message.arguments.push(trailing)
  }

  if (message.nick) {
    return new UserMessage(message)
  }

  return new ServerMessage(message)
}
