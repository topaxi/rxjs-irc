import tls   from 'tls'
import net   from 'net'
import debug from 'debug'

import { Observable } from 'rxjs/Observable'
import { map }        from 'rxjs/operator/map'
import { switchMap }  from 'rxjs/operator/switchMap'

import 'rxjs/add/operator/do'

import { parseMessage } from './_private/parse-message'
import { writeLine }    from './_private/write-line'

import {
  createInterface as createLineStream
} from 'readline'

import {
  fromLineStream,
  fromSocket
} from './_private/from-stream'

const debugClient  = debug('rx-irc:client')
const debugSocketR = debug('rx-irc:socket:read')
const debugSocketW = debug('rx-irc:socket:write')
const debugSocketRRAW = debug('rx-irc:socket:read:raw')

const ONE_MINUTE_IN_MS = 1000 * 60 * 10 //eslint-disable-line

export default class Client extends Observable {

  static create(options) {
    return new this(options)
  }

  constructor(options) {
    super(observer => {
      debugClient('Subscribing to RxJS IRC Client')

      let $messages = this.connectToIRC()
        .do(this::replyToPing)

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

    debugClient('Created new RxJS IRC Client')
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
    debugSocketW(data)
    this._socket::writeLine(data)
  }

  connectToIRC() {
    let $connections = fromSocket(this::createSocket())
      .do(warnAboutUnauthorizedSocket)
      .do(socket => this._socket = socket)
      .do(socket =>
        debugClient(
          `Successfully connected to ${this.host}:${this.port} ` +
          `using a ${socket.encrypted ?
            `secure ${socket.getCipher().name}` :
            'unsecure'} connection`
        )
      )
      .do(::this.sendCredentials)

    let $messages = $connections
      ::map(socket => createLineStream({ input: socket }))
      ::switchMap(lineStream => fromLineStream(lineStream))
      .do(line => debugSocketRRAW(line))
      ::map(line => parseMessage(line))
      .do(msg => debugSocketR(msg))

    return $messages
  }
}

function warnAboutUnauthorizedSocket(socket) {
  // istanbul ignore if
  if (socket.encrypted && !socket.authorized) {
    debugClient(
      `SSL authorization failed: ${socket.authorizationError}`
    )
  }
}

function replyToPing(msg) {
  if (msg.command === 'PING') {
    let { arguments: [ ping ] } = msg

    this.writeLine(`PONG ${ping}`)
  }
}

function createSocket() {
  let socket

  debugClient(`Connecting to ${this.host}:${this.port}`)

  if (this.ssl) {
    let { rejectUnauthorized = true } = this.ssl

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
