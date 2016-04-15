import Mitm from 'mitm'

export function createFakeServer() {
  const fake = new Mitm()

  fake.enable()

  return fake
}
