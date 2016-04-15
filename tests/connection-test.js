import Client from '../lib/client'
import { writeLine } from '../lib/_private/write-line'
import { createFakeServer } from './fake-server'

describe('Connection', () => {
  it('Should connect to a server', done => {
    let srv = createFakeServer()
    let irc = Client.create({
      host: 'irc.example.com',
      port: 6667,
      nick: 'topaxi',
      user: 'Damian Senn'
    })
    let subscription

    srv.on('connection', () =>
      process.nextTick(() => {
        subscription.unsubscribe()
        srv.disable()
        done()
      })
    )

    subscription = irc.subscribe()
  })

  it('Should connect to a encrypted server', done => {
    let srv = createFakeServer()
    let irc = Client.create({
      host: 'irc.example.com',
      port: 6667,
      nick: 'topaxi',
      user: 'Damian Senn',
      ssl: true
    })
    let subscription

    srv.on('connection', () =>
      process.nextTick(() => {
        subscription.unsubscribe()
        srv.disable()
        done()
      })
    )

    subscription = irc.subscribe()
  })

  it('Should send the nick and user to the server', done => {
    let srv = createFakeServer()
    let irc = Client.create({
      host: 'irc.example.com',
      port: 6667,
      nick: 'topaxi',
      user: 'Damian Senn'
    })
    let subscription

    srv.on('connection', socket => {
      let data = ''

      socket.on('data', d => {
        data += d

        if (d.includes('USER')) {
          expect(data).to.equal('NICK topaxi\nUSER topaxi 0 * Damian Senn\n')
          subscription.unsubscribe()
          srv.disable()
          done()
        }
      })
    })

    subscription = irc.subscribe()
  })

  it('Should send the configured password to the server', done => {
    let srv = createFakeServer()
    let irc = Client.create({
      host: 'irc.example.com',
      port: 6667,
      nick: 'topaxi',
      user: 'Damian Senn',
      password: '123456'
    })
    let subscription

    srv.on('connection', socket => {
      socket.on('data', d => {
        if (d.includes('PASS')) {
          expect(d.toString()).to.equal('PASS 123456\n')
          subscription.unsubscribe()
          srv.disable()
          done()
        }
      })
    })

    subscription = irc.subscribe()
  })

  it('Should respond with a pong to ping messages', done => {
    let srv = createFakeServer()
    let irc = Client.create({
      host: 'irc.example.com',
      port: 6667,
      nick: 'topaxi',
      user: 'Damian Senn'
    })
    let subscription

    srv.on('connection', socket => {
      let data = ''

      socket.on('connect', () => {
        socket::writeLine('PING :foo')
        socket::writeLine('PING :irc.topaxi.ch')
      })

      socket.on('data', d => {
        if (d.includes('PONG')) {
          data += d
        }

        if (d.includes('irc.topaxi.ch')) {
          expect(data).to.equal('PONG foo\nPONG irc.topaxi.ch\n')
          subscription.unsubscribe()
          srv.disable()
          done()
        }
      })
    })

    subscription = irc.subscribe()
  })
})
