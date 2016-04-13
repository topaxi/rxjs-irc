import Mitm from 'mitm'

export function createFakeServer() {
  const fake = new Mitm()

  return fake
}
