// Explicit same-repository exact-head opt-in; never part of the default matrix.
export function cameraMotionSelection(event, eventName, head, scenario) {
  const pr = event?.pull_request
  if (eventName !== 'pull_request' || scenario !== 'camera-motion-evidence' ||
    !['ready_for_review', 'labeled'].includes(event?.action) ||
    typeof head !== 'string' || !/^[0-9a-f]{40}$/.test(head) ||
    pr?.draft !== false || pr?.state !== 'open' || pr?.head?.sha !== head ||
    pr?.head?.repo?.full_name !== 'JohnDeved/populous-new-dawn' ||
    pr?.base?.repo?.full_name !== 'JohnDeved/populous-new-dawn' || pr?.base?.ref !== 'main') return false
  const label = `cam-v1:${head}`
  return Array.isArray(pr.labels) && pr.labels.some(value => value?.name === label) &&
    (event.action !== 'labeled' || event.label?.name === label)
}
