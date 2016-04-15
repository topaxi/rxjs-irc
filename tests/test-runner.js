import glob from 'glob'
import Mitm from 'mitm'
import { expect } from 'chai'

global.expect = expect
global.Mitm = Mitm

for (let test of glob.sync('**/*-test.js', { cwd: __dirname })) {
  require(`./${test}`) //eslint-disable-line
}
