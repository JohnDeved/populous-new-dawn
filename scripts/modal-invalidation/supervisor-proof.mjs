import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { parseProperties, validateSupervisor } from './hosted-policy.mjs'
export function supervisorProof(stage) {
  const unit = process.env.PND_MODAL_UNIT
  assert.match(unit ?? '', /^pnd-modal-[1-9][0-9]*-[1-9][0-9]*-(build|browser)\.service$/)
  assert.ok(unit.endsWith(`-${stage}.service`))
  const properties = parseProperties(execFileSync('systemctl', ['show', unit,
    '--property=Id,MainPID,User,KillMode,SendSIGKILL,ControlGroup,RuntimeMaxUSec,TimeoutStopUSec,MemoryMax,TasksMax'],
  { encoding: 'utf8', timeout: 5000 }))
  const proof = validateSupervisor(properties, { unit, stage, pid: process.pid,
    uid: process.getuid(), cgroup: readFileSync('/proc/self/cgroup', 'utf8') })
  assert.equal(readFileSync(`/sys/fs/cgroup${proof.controlGroup}/memory.max`, 'utf8').trim(), String(proof.memoryBytes))
  assert.equal(readFileSync(`/sys/fs/cgroup${proof.controlGroup}/pids.max`, 'utf8').trim(), String(proof.tasks))
  return { ...proof, properties }
}
