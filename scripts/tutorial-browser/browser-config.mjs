import assert from 'node:assert/strict'
import { isAbsolute } from 'node:path'

export function browserConfiguration(executablePath) {
  if (executablePath !== undefined) {
    assert.ok(typeof executablePath === 'string' && isAbsolute(executablePath),
      'POPULOUS_BROWSER must name an absolute verified browser executable')
  }
  return {
    browserPath: executablePath ?? '/opt/google/chrome/chrome',
    browserPathSource: executablePath === undefined ? 'hosted-default' : 'explicit-override',
    launch: {
      ...(executablePath === undefined ? { channel: 'chrome' } : { executablePath }),
      headless: true,
      chromiumSandbox: true,
      ignoreDefaultArgs: true,
      args: ['--headless', '--remote-debugging-pipe'],
      timeout: 30000,
    },
  }
}
