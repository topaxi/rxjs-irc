import tls   from 'tls'
import net   from 'net'
import debug from 'debug'

import { Observable }     from 'rxjs/Observable'
import { map }            from 'rxjs/operator/map'
import { filter }         from 'rxjs/operator/filter'
import { switchMap }      from 'rxjs/operator/switchMap'

import { parseMessage }   from './_private/parse-message'
import { writeLine }      from './_private/write-line'

import {
  createInterface as createLineStream
} from 'readline'

import {
  fromLineStream,
  fromSocket
} from './_private/from-stream'

const debugClient  = debug('rx-irc:client')
const debugSocketR = debug('rx-irc:client:socket:read')

const ONE_MINUTE_IN_MS = 1000 * 60 * 10 //eslint-disable-line

export default class Client extends Observable {

  static create(options) {
    return new this(options)
  }

  constructor(options) {
    super(observer => {
      let $messages = this.connectToIRC()

      return $messages.subscribe(observer)
    })

    this.ssl = options.ssl
    this.host = options.host
    this.port = options.port
    this.password = options.password
    this.timeout = options.timeout || ONE_MINUTE_IN_MS
    this.nick = options.nick
    this.user = options.user
    this._socket = null

    debugClient('Created new RxIRC client')
  }

  sendCredentials() {
    if (this.password) {
      debugClient('Authenticating on server with password')
      this.writeLine(`PASS ${this.password}`)
    }

    this.writeLine(`NICK ${this.nick}`)
    this.writeLine(`USER ${this.nick} 0 * ${this.user}`)
  }

  writeLine(data) {
    this._socket::writeLine(data)
  }

  connectToIRC() {
    let $connections = fromSocket(this::createSocket())

    $connections.forEach(socket => {
      this._socket = socket

      if (socket.encrypted && !socket.authorized) {
        debugClient(
          `SSL authorization failed: ${socket.authorizationError}`
        )
      }

      debugClient(
        `Successfully connected to ${this.host}:${this.port} ` +
        `using a ${socket.encrypted ?
          `secure ${socket.getCipher().name}` :
          'unsecure'} connection`
      )

      this.sendCredentials()
    })

    let $messages = $connections
      ::map(socket => createLineStream({ input: socket }))
      ::switchMap(lineStream => fromLineStream(lineStream))
      ::map(line => parseMessage(line))

    $messages.forEach(msg =>
      debugSocketR(msg)
    )

    let $pings = $messages::filter(msg => msg.command === 'PING')

    $pings.forEach(({ arguments: [ ping ] }) =>
      this.writeLine(`PONG ${ping}`)
    )

    return $messages
  }
}

function createSocket() {
  let socket

  debugClient(`Connecting to ${this.host}:${this.port}`)

  if (this.ssl) {
    let { rejectUnauthorized } = this.ssl

    debugClient(`rejectUnauthorized is ${rejectUnauthorized}`)

    socket = tls.connect(this.port, this.host, this.ssl)
  }
  else {
    socket = net.connect(this.port, this.host)
  }

  debugClient(`Setting socket timeout to ${this.timeout}ms`)
  socket.setTimeout(this.timeout)

  return socket
}
