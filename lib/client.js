import tls   from 'tls'
import net   from 'net'
import debug from 'debug'

import { map }            from 'rxjs/operator/map'
import { filter }         from 'rxjs/operator/filter'
import { switchMap }      from 'rxjs/operator/switchMap'

import { fromLineStream } from './_private/from-stream'
import { parseMessage }   from './_private/parse-message'
import { writeLine }      from './_private/write-line'

import {
  createInterface as createLineStream
} from 'readline'

import {
  of as observableOf
} from 'rxjs/observable/of'

const debugClient  = debug('rx-irc:client')
const debugSocketR = debug('rx-irc:client:socket:read')

const ONE_MINUTE_IN_MS = 1000 * 60 * 10 //eslint-disable-line

export default class Client {

  constructor(options) {
    this.ssl = options.ssl
    this.host = options.host
    this.port = options.port
    this.password = options.password
    this.timeout = options.timeout || ONE_MINUTE_IN_MS
    this.rejectUnauthorized = options.rejectUnauthorized
    this.nick = options.nick
    this.user = options.user
    this._socket = null

    debugClient('Created new RxIRC client')
  }

  subscribe() {
    // TODO: Get rid of this callbacky thing here
    let connect = socket => {
      if (this.ssl && !socket.authorized) {
        debugClient(
          `SSL authorization failed: ${socket.authorizationError}`
        )
      }

      debugClient(
        `Successfully connected to ${this.host}:${this.port} ` +
        `using a ${this.ssl ?
          `secure ${socket.getCipher().name}` :
          'unsecure'} connection`
      )

      if (this.password) {
        debugClient('Authenticating on server with password')
        socket::writeLine(`PASS ${this.password}`)
      }

      socket::writeLine(`NICK ${this.nick}`)
      socket::writeLine(`USER ${this.nick} 0 * ${this.user}`)
    }

    this._socket = this::createSocket()

    let connectEvent = this.ssl ? 'secureConnect' : 'connect'

    this._socket.on(connectEvent, connect.bind(null, this._socket))
    this._socket.on('error', err => debugClient(`Socket error ${err}`))

    let $lines = observableOf(this._socket)
      ::map(socket => createLineStream({ input: socket }))
      ::switchMap(lineStream => fromLineStream(lineStream))

    let $messages = $lines::map(line => parseMessage(line))
    let $pongs = $messages::filter(msg => msg.command === 'PING')

    $messages.forEach(msg =>
      debugSocketR(msg)
    )

    $pongs.forEach(({ arguments: [ pong ] }) =>
      this._socket::writeLine(`PONG ${pong}`)
    )

    return $messages.subscribe()
  }
}

function createSocket() {
  let socket

  debugClient(`Connecting to ${this.host}:${this.port}`)

  if (this.ssl) {
    let { rejectUnauthorized } = this.ssl

    debugClient(`rejectUnauthorized is ${rejectUnauthorized}`)

    socket = tls.connect(
      this.port,
      this.host,
      this.ssl
    )
  }
  else {
    socket = new net.Socket()

    socket.connect(
      this.port,
      this.host
    )
  }

  debugClient(`Setting socket timeout to ${this.timeout}ms`)
  socket.setTimeout(this.timeout)

  return socket
}
