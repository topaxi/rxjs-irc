import Client from 'rx-irc'
import { createFakeServer } from './fake-server'

describe('Connection : Basic', () => {

  it('Should connect to a server', () => {
    let srv = createFakeServer()
    let irc = new Client()

    srv.on('connection', socket => {
      console.log('test')
    })
  })
})
