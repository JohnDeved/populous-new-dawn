// Opt-in, bounded wrapper-lifetime diagnostic. Each exported browser function is
// self-contained for page.evaluate. State retains ONLY WeakRefs and primitives.
// No generic traversal, callbacks, finalizers, buffer copies or extra GC.
export function registerRetiredGameplayOwnership() {
  const key = '__populousGameplayOwnershipV1'
  const state = window[key] ??= { version: 1, records: [] }
  if (state.version !== 1 || !Array.isArray(state.records) || state.records.length >= 2)
    throw Error('Ownership diagnostic retirement cap/state invalid')
  if (typeof WeakRef !== 'function') throw Error('Ownership diagnostic WeakRef unsupported')
  const scene = window.testScene
  if (!scene || scene.disposed !== true) throw Error('Ownership diagnostic requires retired scene alias')
  const record = { retirement: state.records.length + 1, owners: [], buffers: [], slots: [] }
  const owner = (label, value) => {
    const supported = value !== null && (typeof value === 'object' || typeof value === 'function')
    record.owners.push({ label, status: supported ? 'registered' : 'missing',
      ...(supported ? { ref: new WeakRef(value) } : {}) })
  }
  owner('scene', scene); owner('globe', scene.globe)
  owner('terrain', scene.terrain); owner('terrain.geometry', scene.terrain?.geometry)
  // The temporary Map dies before this evaluate completes. Never store it or a
  // typed-array view in state. WeakRef construction itself keeps targets alive
  // for this JS job; the existing full workload precedes the later GC command.
  const seen = new Map()
  const buffer = (label, value, optional = false) => {
    if (record.slots.length >= 9) throw Error('Ownership diagnostic buffer-slot cap exceeded')
    if (value == null) {
      record.slots.push({ label, status: optional ? 'absent-optional' : 'missing' }); return
    }
    if (!ArrayBuffer.isView(value) || !(value.buffer instanceof ArrayBuffer)) {
      record.slots.push({ label, status: 'unsupported' }); return
    }
    const backing = value.buffer
    let id = seen.get(backing)
    if (id === undefined) {
      if (record.buffers.length >= 9) throw Error('Ownership diagnostic buffer cap exceeded')
      id = record.buffers.length
      seen.set(backing, id)
      record.buffers.push({ id, registeredByteLength: backing.byteLength, ref: new WeakRef(backing) })
    }
    record.slots.push({ label, status: 'registered', bufferId: id })
  }
  for (const name of ['position', 'uv', 'landUv', 'surface', 'light', 'highlight'])
    buffer(`terrain.${name}`, scene.terrain?.geometry?.getAttribute(name)?.array)
  buffer('terrain.index', scene.terrain?.geometry?.index?.array, true)
  buffer('globe.atlas.pixels', scene.globe?.atlas?.pixels)
  buffer('globe.map.image.data', scene.globe?.map?.image?.data)
  state.records.push(record)
  return { retirement: record.retirement, registeredOwners: record.owners.filter(o => o.status === 'registered').length,
    registeredBuffers: record.buffers.length, slots: record.slots.map(slot => ({ ...slot })) }
}

// Call ONLY in a distinct page.evaluate AFTER the existing awaited heap read.
// A deref keeps a surviving target alive until the end of this job. Nothing
// dereferenced here crosses that boundary; results contain primitives only.
export function sampleRetiredGameplayOwnership() {
  const state = window.__populousGameplayOwnershipV1
  if (state && (state.version !== 1 || !Array.isArray(state.records) || state.records.length > 2))
    throw Error('Ownership diagnostic retirement cap/state invalid')
  const records = (state?.records ?? []).map(record => {
    if (record.owners.length !== 4 || record.buffers.length > 9 || record.slots.length !== 9)
      throw Error('Ownership diagnostic record caps invalid')
    const owners = record.owners.map(({ label, status, ref }) => ({ label, status,
      survival: status === 'registered' ? (ref.deref() === undefined ? 'collected' : 'alive') : 'unavailable' }))
    const buffers = record.buffers.map(({ id, registeredByteLength, ref }) => {
      const buffer = ref.deref()
      return { id, registeredByteLength, survival: buffer === undefined ? 'collected' : 'alive',
        currentByteLength: buffer === undefined ? null : buffer.byteLength,
        byteLengthChanged: buffer === undefined ? null : buffer.byteLength !== registeredByteLength }
    })
    return { retirement: record.retirement, owners, slots: record.slots.map(slot => ({ ...slot })), buffers,
      complete: owners.every(o => o.status === 'registered') && record.slots.every(s => ['registered', 'absent-optional'].includes(s.status)),
      survivingBufferCount: buffers.filter(b => b.survival === 'alive').length,
      survivingRegisteredByteLengths: buffers.reduce((n, b) => n + (b.survival === 'alive' ? b.registeredByteLength : 0), 0) }
  })
  return { version: 1, interpretation: 'weak-wrapper-survival-and-registered-buffer-lengths-not-retained-backing-attribution',
    limits: 'two-retirements-four-owners-nine-buffer-slots-each; no-cache-export-external-string-GPU-process-accounting', records }
}

export function clearRetiredGameplayOwnership() {
  delete window.__populousGameplayOwnershipV1
}
