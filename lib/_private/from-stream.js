import { Observable } from 'rxjs/Observable'
import { publish } from 'rxjs/operator/publish'

export function fromStream(s, endEventName = 'end', dataEventName = 'data') {
  s.pause()

  return Observable.create(observer => {
    function dataHandler(data) {
      observer.next(data)
    }

    function errorHandler(err) {
      observer.error(err)
    }

    function endHandler() {
      observer.complete()
    }

    s.addListener(dataEventName, dataHandler)
    s.addListener('error', errorHandler)
    s.addListener(endEventName, endHandler)

    s.resume()

    return () => {
      s.removeListener(dataEventName, dataHandler)
      s.removeListener('error', errorHandler)
      s.removeListener(endEventName, endHandler)
    }
  })::publish().refCount()
}

export function fromSocket(s) {
  s.pause()

  const CONNECT_EVENT = s.encrypted ? 'secureConnect' : 'connect'

  return Observable.create(observer => {
    function connectHandler() {
      observer.next(s)
    }

    function errorHandler(err) {
      observer.error(err)
    }

    function endHandler() {
      observer.complete()
    }

    s.addListener(CONNECT_EVENT, connectHandler)
    s.addListener('error', errorHandler)
    s.addListener('end', endHandler)

    s.resume()

    return () => {
      s.removeListener(CONNECT_EVENT, connectHandler)
      s.removeListener('error', errorHandler)
      s.removeListener('end', endHandler)
    }
  })::publish().refCount()
}

export function fromLineStream(s, endEventName = 'end') {
  return fromStream(s, endEventName, 'line')
}
