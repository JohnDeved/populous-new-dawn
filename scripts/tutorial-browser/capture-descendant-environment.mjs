// Strip diagnostic transport controls from ordinary build/Chrome/git children.
// The owning in-process Playwright logger remains exclusively pipe-observed.
export function captureDescendantEnvironment(env, enabled = false) {
  if (!enabled) return env
  return Object.fromEntries(Object.entries(env).filter(([name]) =>
    !/^debug(?:_|$)/i.test(name) && name !== 'MAX_LOG_LENGTH' && name !== 'PND_CAPTURE_PROTOCOL_WINDOW'))
}
