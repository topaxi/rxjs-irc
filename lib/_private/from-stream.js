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
      observer.completed()
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

export function fromLineStream(s, endEventName = 'end') {
  return fromStream(s, endEventName, 'line')
}
