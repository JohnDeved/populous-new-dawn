import assert from 'node:assert/strict'

export const cameraMotionCases = Object.freeze([
  'overview-key', 'overview-edge', 'overview-key-release', 'overview-edge-away',
  'flyby-edge', 'flyby-masked-key',
])
export function acceptCameraMotionCase(report) {
  assert.ok(cameraMotionCases.includes(report.kind))
  const observation = report.observation
  assert.equal(observation.failed,false,'Observer failure is not visual evidence')
  assert.equal(observation.stopped,true); assert.equal(observation.restored,true)
  assert.ok(observation.frames.length >= 8)
  for (let i=0;i<observation.frames.length;i++) {
    const row=observation.frames[i]
    assert.equal(row.suspended,false); assert.equal(row.paused,false)
    if(i) { assert.ok(row.frame>observation.frames[i-1].frame); assert.ok(row.observedAt>=observation.frames[i-1].observedAt) }
    if(row.inputMask || row.overviewStage) assert.equal(row.inputButtons,0,'Navigation remains gated')
  }
  const events=observation.events
  assert.ok(events.length>0)
  for(const e of events) { assert.equal(e.trusted,true); assert.ok(e.before&&e.after,'Actual event boundary missing') }
  const input=events.find(e=>report.kind.includes('edge') ? e.type==='pointermove'&&e.x===0 : e.type==='keydown'&&e.key==='ArrowLeft')
  assert.ok(input,'Expected real held input missing')
  const positive=['overview-key','overview-edge','flyby-edge'].includes(report.kind)
  const frames=observation.frames, releases=[]
  for(let i=1;i<frames.length;i++){
    const previous=frames[i-1],current=frames[i]
    const gated=row=>report.kind.startsWith('overview') ? !!row.overviewStage : !!(row.flyby||row.inputMask)
    if(gated(previous)&&!gated(current)){
      releases.push(current)
      assert.equal(current.inputCursor,previous.inputCursor,'Gate release must not depend on fresh DOM publication')
      assert.equal(current.inputButtons!==0,positive,'First completed post-gate frame has wrong held-input publication')
    }
  }
  assert.equal(releases.length,report.kind.startsWith('overview')?2:1,'Required gate transitions missing or repeated')
  const segments=report.kind.startsWith('overview') ? ['entered','exited'] : ['released']
  for(const phase of segments) {
    const rows=observation.frames.filter(r=>r.phase===phase)
    assert.ok(rows.length>=4,'Insufficient naturally completed post-gate frames')
    assert.ok(rows.every(r=>!r.inputMask&&!r.overviewStage&&!r.flyby),'Gate must actually release')
    assert.ok(rows.every(r=>r.inputCursor===rows[0].inputCursor),'Fresh input cannot substitute for resumed held input')
    if(positive) {
      assert.ok(rows.every(r=>r.inputButtons!==0),'Held input must be republished after gate')
      assert.ok(rows.some(r=>r.pose.some((v,i)=>v!==rows[0].pose[i])),'Actual committed camera motion missing')
    } else assert.ok(rows.every(r=>r.inputButtons===0),'Released or rejected input must not resurrect')
  }
  if(report.kind.startsWith('overview')) {
    assert.ok(observation.frames.some(r=>r.overviewStage),'Actual overview transition not observed')
    assert.ok(observation.frames.some(r=>r.phase==='entered'&&r.overview))
    assert.ok(observation.frames.some(r=>r.phase==='exited'&&!r.overview))
    if(!positive) {
      const release=events.find(e=>report.kind==='overview-key-release' ? e.type==='keyup'&&e.key==='ArrowLeft' : e.type==='pointermove'&&e.x>100)
      assert.ok(release?.before.overviewStage&&release.after?.overviewStage,'Release must finish while transition is gated')
      const firstRelease=frames.indexOf(releases[0])
      assert.ok(frames.slice(0,firstRelease).some(r=>r.observedAt>=release.after.observedAt&&r.overviewStage&&r.inputButtons===0),
        'Completed gated frame after release must retain neutral input')
    }
  } else {
    assert.ok(input.before.flyby&&input.before.inputMask&&input.after.flyby&&input.after.inputMask,
      'Input must finish while natural flyby is still gated')
    assert.ok(observation.frames.some(r=>r.observedAt>=input.after.observedAt&&r.flyby&&r.inputMask),
      'At least one completed gated frame must retain the dispatched input')
    if(report.kind==='flyby-edge')assert.ok(observation.frames.filter(r=>r.observedAt>=input.after.observedAt).every(r=>r.navigationPointer?.x===0&&r.navigationPointer?.y===500&&r.navigationPointer?.buttons===0),'Same stationary edge pointer must survive gate release')
    assert.ok(observation.frames.some(r=>r.flyby&&r.inputMask))
    if(report.kind==='flyby-masked-key') assert.equal(input.after.keys.includes('arrowleft'),false,'Masked key must remain ignored')
  }
  if(positive) {
    assert.equal(report.captures.length,3)
    for(const c of report.captures) {
      assert.ok(c.bytes>0&&c.bytes<=2*1024*1024)
      assert.match(c.sha256,/^[a-f0-9]{64}$/)
      assert.ok(c.after.frame>=c.before.frame)
    }
    assert.ok(new Set(report.captures.map(c=>c.sha256)).size>1,'Motion sequence cannot contain only identical pixels')
  }
  return {status:'passed',naturalFrames:observation.frames.length,
    visualEquivalent:false,performanceEligible:false}
}
