// Test-only, bounded observer of the actual shipped terrain inputs consumed by
// RenderView.collectPickCandidates. Never calls a picker, renderer, or updater.
export const snapshotGeometryContract = Object.freeze({ version: 1,
  domain: 'one shipped 128x128 six-vertex terrain InstancedMesh, at most nine copies',
  boundary: 'complete Float32 position bytes, consumed Uint32 index prefix, active instance matrices, effective transform/bounds/flags, bounded consumer method signatures',
  perFrame: 'caller-owned fixed-size numeric buffer; direct reference/version/count/transform witnesses only',
  limit: 'Boundary hashes detect persistent unversioned writes. Transient unversioned writes reverted between boundaries are not observable. No universal geometry instrumentation.',
})

// Self-contained for page.evaluate serialization. The returned observer only
// retains references to existing objects; it never attaches to production code.
export function createSnapshotGeometryObserver(scene) {
  const mesh = scene?.terrain, geometry = mesh?.geometry, position = geometry?.attributes?.position,
    index = geometry?.index, instances = mesh?.instanceMatrix,
    parent = mesh?.parent, root = parent?.parent, world = scene?.world, view = scene?.view
  const fail = message => { throw Error(`Snapshot terrain geometry: ${message}`) }
  if (!mesh?.isInstancedMesh || !mesh.isMesh || parent !== scene.ground || root !== scene.scene || root.parent !== null || mesh.children.length)
    fail('unsupported terrain hierarchy')
  if (!geometry.isBufferGeometry || !position?.isBufferAttribute || position.isInterleavedBufferAttribute ||
      !(position.array instanceof Float32Array) || position.itemSize !== 3 || position.normalized ||
      position.count !== 128 * 128 * 6 || position.array.length !== position.count * 3)
    fail('unsupported position attribute')
  if (!index?.isBufferAttribute || index.isInterleavedBufferAttribute || !(index.array instanceof Uint32Array) ||
      index.itemSize !== 1 || index.normalized || index.count !== index.array.length || index.count > position.count)
    fail('unsupported index attribute')
  if (!instances?.isBufferAttribute || !(instances.array instanceof Float32Array) ||
      instances.itemSize !== 16 || instances.normalized || instances.count !== 9 || instances.array.length !== 9 * 16)
    fail('unsupported instance attribute')
  if (![position.array, index.array, instances.array].every(array => array.buffer instanceof ArrayBuffer))
    fail('shared or unsupported attribute storage')
  const box = geometry.boundingBox
  if (!box || ![box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].every(Number.isFinite))
    fail('a finite real-query bounding box is required')
  const arrays = [position.array, index.array, instances.array], buffers = arrays.map(array => array.buffer)
  const methodOwners = [geometry, geometry, mesh, position, position, position, index]
  const methodNames = ['getAttribute', 'getIndex', 'getMatrixAt', 'getX', 'getY', 'getZ', 'getX']
  const methods = methodOwners.map((owner, i) => {
    if (Object.hasOwn(owner, methodNames[i])) fail('own consumer method override is unsupported')
    const method = owner[methodNames[i]]
    if (typeof method !== 'function') fail('consumer method is missing')
    return method
  })
  const methodSources = methods.map(method => Function.prototype.toString.call(method))
  if (methodSources.some(source => source.length > 8192 || source.includes('[native code]')))
    fail('opaque or oversized consumer method is unsupported')
  const owners = [mesh, parent, root]
  const matrices = owners.map(owner => owner.matrixWorld.elements)
  const fields = ['bindingsStable', 'liveScene', 'meshVisible', 'parentVisible', 'rootVisible', 'children',
    'positionVersion', 'positionCount', 'positionItemSize', 'positionNormalized',
    'indexVersion', 'indexCount', 'indexItemSize', 'indexNormalized',
    'instanceVersion', 'instanceCapacity', 'instanceItemSize', 'instanceNormalized',
    'drawStart', 'drawCount', 'instanceCount', 'nativeRelative', 'painterGround', 'terrainGrid', 'nativeScale', 'nativeSize',
    'parentHeading', 'parentTilt', 'parentRoll', 'boundingMinX', 'boundingMinY', 'boundingMinZ', 'boundingMaxX', 'boundingMaxY', 'boundingMaxZ']
  for (const name of ['mesh', 'parent', 'root']) {
    for (let i = 0; i < 16; i++) fields.push(`${name}WorldMatrix${i}`)
    for (const part of ['positionX', 'positionY', 'positionZ', 'quaternionX', 'quaternionY', 'quaternionZ', 'quaternionW', 'scaleX', 'scaleY', 'scaleZ'])
      fields.push(`${name}${part}`)
  }
  const witnessWidth = fields.length
  // No arrays, objects, hashing, graph traversal, or method calls are allocated
  // or performed here. Three fixed owners and their fixed transform scalars only.
  function writeWitness(buffer, offset = 0, currentScene = scene) {
    if (!Number.isSafeInteger(offset) || offset < 0 || !buffer || offset + witnessWidth > buffer.length)
      fail('witness buffer is too small')
    let n = offset
    buffer[n++] = Number(currentScene === scene && scene.world === world && scene.view === view && scene.terrain === mesh &&
      mesh.geometry === geometry && geometry.attributes.position === position && geometry.index === index && mesh.instanceMatrix === instances &&
      position.array === arrays[0] && index.array === arrays[1] && instances.array === arrays[2] &&
      position.array.buffer === buffers[0] && index.array.buffer === buffers[1] && instances.array.buffer === buffers[2] &&
      position.array.length === 128 * 128 * 6 * 3 && index.array.length === index.count && instances.array.length === 9 * 16 &&
      geometry.getAttribute === methods[0] && geometry.getIndex === methods[1] && mesh.getMatrixAt === methods[2] &&
      position.getX === methods[3] && position.getY === methods[4] && position.getZ === methods[5] && index.getX === methods[6] &&
      mesh.parent === parent && parent.parent === root && root.parent === null && geometry.boundingBox === box &&
      mesh.matrixWorld.elements === matrices[0] && parent.matrixWorld.elements === matrices[1] && root.matrixWorld.elements === matrices[2])
    buffer[n++] = Number(!scene.disposed)
    buffer[n++] = Number(mesh.visible); buffer[n++] = Number(parent.visible); buffer[n++] = Number(root.visible)
    buffer[n++] = mesh.children.length
    buffer[n++] = position.version; buffer[n++] = position.count; buffer[n++] = position.itemSize; buffer[n++] = Number(position.normalized)
    buffer[n++] = index.version; buffer[n++] = index.count; buffer[n++] = index.itemSize; buffer[n++] = Number(index.normalized)
    buffer[n++] = instances.version; buffer[n++] = instances.count; buffer[n++] = instances.itemSize; buffer[n++] = Number(instances.normalized)
    buffer[n++] = geometry.drawRange.start; buffer[n++] = geometry.drawRange.count; buffer[n++] = mesh.count
    buffer[n++] = Number(mesh.userData.nativeRelative); buffer[n++] = Number(mesh.userData.painterGround); buffer[n++] = Number(mesh.userData.terrainGrid)
    buffer[n++] = mesh.userData.nativeScale ?? 0; buffer[n++] = mesh.userData.nativeSize ?? 0
    buffer[n++] = parent.userData.nativeHeading ?? 0; buffer[n++] = parent.userData.nativeTilt ?? 0; buffer[n++] = parent.userData.nativeRoll ?? 0
    buffer[n++] = box.min.x; buffer[n++] = box.min.y; buffer[n++] = box.min.z
    buffer[n++] = box.max.x; buffer[n++] = box.max.y; buffer[n++] = box.max.z
    for (let owner = 0; owner < 3; owner++) {
      for (let i = 0; i < 16; i++) buffer[n++] = matrices[owner][i]
      const object = owners[owner]
      buffer[n++] = object.position.x; buffer[n++] = object.position.y; buffer[n++] = object.position.z
      buffer[n++] = object.quaternion.x; buffer[n++] = object.quaternion.y; buffer[n++] = object.quaternion.z; buffer[n++] = object.quaternion.w
      buffer[n++] = object.scale.x; buffer[n++] = object.scale.y; buffer[n++] = object.scale.z
    }
    return n
  }
  async function captureBoundary() {
    const observationStartTimestampMs = performance.now(), witness = new Float64Array(witnessWidth)
    writeWitness(witness)
    if (!witness.every(Number.isFinite) || witness[0] !== 1 || witness[1] !== 1 || witness[2] !== 1 || witness[3] !== 1 || witness[4] !== 1 || witness[5] !== 0)
      fail('terrain binding/visibility/shape changed or nonfinite witness')
    if (geometry.drawRange.start !== 0 || !Number.isSafeInteger(geometry.drawRange.count) ||
        geometry.drawRange.count <= 0 || geometry.drawRange.count > index.count || geometry.drawRange.count % 3 ||
        !Number.isSafeInteger(mesh.count) || mesh.count < 1 || mesh.count > 9)
      fail('unsupported draw range or instance count')
    if (position.count !== 128 * 128 * 6 || position.itemSize !== 3 || position.normalized ||
        index.itemSize !== 1 || index.normalized || instances.itemSize !== 16 || instances.normalized ||
        !mesh.userData.nativeRelative || !mesh.userData.painterGround || !mesh.userData.terrainGrid ||
        (mesh.userData.nativeScale ?? 0) !== 0 || (mesh.userData.nativeSize ?? 0) !== 0)
      fail('terrain attribute/flag contract changed')
    // Copy synchronously before the first await. The real consumer reads the
    // submitted prefix from zero; unused index tail/instance slots are not input.
    const bytes = array => new Uint8Array(array.buffer, array.byteOffset, array.byteLength).slice()
    const submittedIndices = index.array.subarray(0, geometry.drawRange.count)
    if (submittedIndices.some(id => id >= position.count)) fail('submitted index out of bounds')
    const activeMatrices = instances.array.subarray(0, mesh.count * 16)
    if (!position.array.every(Number.isFinite) || !activeMatrices.every(Number.isFinite)) fail('nonfinite geometry/instance input')
    const payloads = [bytes(position.array), bytes(submittedIndices), bytes(activeMatrices)]
    const metadata = { version: 1, position: { type: 'Float32Array', count: position.count, itemSize: position.itemSize, normalized: false },
      index: { type: 'Uint32Array', submittedCount: submittedIndices.length, itemSize: 1, normalized: false },
      drawRange: { start: geometry.drawRange.start, count: geometry.drawRange.count }, instanceCount: mesh.count,
      worldMatrix: [...matrices[0]], boundingBox: [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z],
      nativeRelative: true, painterGround: true, terrainGrid: true, nativeScale: 0, nativeSize: 0,
      parentBasis: [parent.userData.nativeHeading ?? 0, parent.userData.nativeTilt ?? 0, parent.userData.nativeRoll ?? 0] }
    const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', value)), b => b.toString(16).padStart(2, '0')).join('')
    const [positionSha256, indexSha256, instancesSha256] = await Promise.all(payloads.map(digest))
    const consumerMethodsSha256 = await digest(new TextEncoder().encode(JSON.stringify(methodSources)))
    const fingerprintSha256 = await digest(new TextEncoder().encode(JSON.stringify({ metadata, positionSha256, indexSha256, instancesSha256, consumerMethodsSha256 })))
    return { fingerprintSha256, positionSha256, indexSha256, instancesSha256, consumerMethodsSha256, metadata,
      witness: [...witness], observationStartTimestampMs, timestampMs: performance.now() }
  }
  return { witnessWidth, witnessFields: Object.freeze(fields), writeWitness, captureBoundary }
}
