// A completed primary page must not remain owned through independent episodes.
// This records lifecycle evidence, not an assertion that the page was CPU-active.
export function readPrimaryTutorialFinalState() {
  return {
    active: document.activeElement?.outerHTML?.slice(0, 500) ?? null,
    body: document.body.innerText.slice(0, 2500),
  }
}

export async function closeCompletedPrimaryTutorial({ browser, context, page, result, errors, persist }) {
  const before = browser.contexts()
  const evidence = {
    status: 'closing', result, snapshot: null, contextClosed: false,
    contextsBefore: before.length, contextsAfter: null, errors: [...errors], failures: [],
  }
  const failures = []
  const ownsContext = before.includes(context) && page.context() === context
  if (!ownsContext) throw Error('Primary page/context ownership mismatch')
  try { evidence.snapshot = await page.evaluate(readPrimaryTutorialFinalState) }
  catch (error) { failures.push(error) }
  try { persist(evidence) } catch (error) { failures.push(error) }
  // Close this exact context even when snapshot/preservation failed. Never close
  // another context or browser, and never advance to the next episode on failure.
  try { await context.close(); evidence.contextClosed = true }
  catch (error) { failures.push(error) }
  const after = browser.contexts()
  evidence.contextsAfter = after.length
  if (after.includes(context)) failures.push(Error('Primary context remains registered after close'))
  if (before.some(other => other !== context && !after.includes(other)))
    failures.push(Error('An unrelated context disappeared during primary cleanup'))
  evidence.errors = [...errors] // Include console/page errors emitted during close.
  if (evidence.errors.length) failures.push(Error(`Primary-page errors: ${JSON.stringify(evidence.errors)}`))
  evidence.failures = failures.map(error => String(error))
  evidence.status = failures.length ? 'failed' : 'passed'
  try { persist(evidence) } catch (error) {
    failures.push(error)
    evidence.status = 'failed'
    evidence.finalPersistenceFailed = true
    evidence.failures = failures.map(failure => String(failure))
  }
  if (failures.length) throw new AggregateError(failures, 'Primary tutorial context retirement failed')
  return evidence
}
