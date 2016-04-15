import Client from '../lib/client'
import { writeLine } from '../lib/_private/write-line'
import { createFakeServer } from './fake-server'

describe('Messages', () => {
  it('Should receive messages from channels', done => {
    let srv = createFakeServer()
    let irc = Client.create({
      host: 'irc.example.com',
      port: 6667,
      nick: 'topaxi',
      user: 'Damian Senn'
    })
    let subscription
    let messages = []

    irc = irc.do(msg => messages.push(msg))

    srv.on('connection', socket => {
      socket.on('connect', () => {
        socket::writeLine(':foo!bar@example.com PRIVMSG #test :hello')
        socket::writeLine(':foo!bar@example.com PRIVMSG #test :world')

        setTimeout(() => {
          expect(messages).to.have.length(2)
          expect(messages[0].prefix).to.equal('foo!bar@example.com')
          expect(messages[0].command).to.equal('PRIVMSG')
          expect(messages[0].commandType).to.equal('normal')
          expect(messages[0].arguments).to.deep.equal([ '#test', 'hello' ])
          expect(messages[1].arguments).to.deep.equal([ '#test', 'world' ])
          expect(messages[0].nick).to.equal('foo')
          expect(messages[0].user).to.equal('bar')
          expect(messages[0].host).to.equal('example.com')

          subscription.unsubscribe()
          srv.disable()
          done()
        }, 10)
      })
    })

    subscription = irc.subscribe()
  })

  it('Should receive messages from users', done => {
    let srv = createFakeServer()
    let irc = Client.create({
      host: 'irc.example.com',
      port: 6667,
      nick: 'topaxi',
      user: 'Damian Senn'
    })
    let subscription
    let messages = []

    irc = irc.do(msg => messages.push(msg))

    srv.on('connection', socket => {
      socket.on('connect', () => {
        socket::writeLine(':foo!bar@example.com PRIVMSG topaxi :hello')
        socket::writeLine(':foo!bar@example.com PRIVMSG topaxi :world')

        setTimeout(() => {
          expect(messages).to.have.length(2)
          expect(messages[0].prefix).to.equal('foo!bar@example.com')
          expect(messages[0].command).to.equal('PRIVMSG')
          expect(messages[0].commandType).to.equal('normal')
          expect(messages[0].arguments).to.deep.equal([ 'topaxi', 'hello' ])
          expect(messages[1].arguments).to.deep.equal([ 'topaxi', 'world' ])
          expect(messages[0].nick).to.equal('foo')
          expect(messages[0].user).to.equal('bar')
          expect(messages[0].host).to.equal('example.com')

          subscription.unsubscribe()
          srv.disable()
          done()
        }, 10)
      })
    })

    subscription = irc.subscribe()
  })
})
