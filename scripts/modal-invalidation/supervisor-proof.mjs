import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { parseProperties, validateSupervisor } from './hosted-policy.mjs'
export function supervisorProof(stage) {
  const unit = process.env.PND_MODAL_UNIT
  assert.match(unit ?? '', /^pnd-modal-[1-9][0-9]*-[1-9][0-9]*-(build|browser)\.service$/)
  assert.ok(unit.endsWith(`-${stage}.service`))
  const properties = parseProperties(execFileSync('systemctl', ['show', unit,
    '--property=Id,MainPID,User,KillMode,SendSIGKILL,ControlGroup,RuntimeMaxUSec,TimeoutStopUSec,MemoryMax,TasksMax,LimitFSIZE,LimitFSIZESoft,MemorySwapMax,ProtectSystem,PrivateMounts,ProtectHome,ReadOnlyPaths'],
  { encoding: 'utf8', timeout: 5000 }))
  const proof = validateSupervisor(properties, { unit, stage, pid: process.pid,
    uid: process.getuid(), cgroup: readFileSync('/proc/self/cgroup', 'utf8') })
  assert.equal(readFileSync(`/sys/fs/cgroup${proof.controlGroup}/memory.max`, 'utf8').trim(), String(proof.memoryBytes))
  assert.equal(readFileSync(`/sys/fs/cgroup${proof.controlGroup}/pids.max`, 'utf8').trim(), String(proof.tasks))
  const fileLimit = readFileSync('/proc/self/limits', 'utf8').match(/^Max file size\s+(\S+)\s+(\S+)\s+bytes\s*$/m)
  assert.ok(fileLimit); assert.equal(Number(fileLimit[1]), proof.fileBytes); assert.equal(Number(fileLimit[2]), proof.fileBytes)
  if (stage === 'browser') assert.equal(readFileSync(`/sys/fs/cgroup${proof.controlGroup}/memory.swap.max`, 'utf8').trim(), '0')
  return { ...proof, properties }
}
