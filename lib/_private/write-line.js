import debug from 'debug'

const debugSocketW = debug('rx-irc:client:socket:write')

export function writeLine(data) {
  debugSocketW(data)

  return this.write(`${data}\n`)
}
