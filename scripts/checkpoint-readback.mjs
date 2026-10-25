// Browser storage reads are asynchronous. Await each read explicitly rather
// than passing an async predicate to Playwright's waitForFunction polling.
export async function waitForCheckpointReadback(read, { attempts = 100, pause = () => new Promise(resolve => setTimeout(resolve, 100)) } = {}) {
  if (!Number.isInteger(attempts) || attempts < 1) throw new RangeError('Invalid readback attempts')
  for (let attempt = 0; attempt < attempts; attempt++) {
    if ((await read()) === true) return true
    if (attempt + 1 < attempts) await pause()
  }
  return false
}
