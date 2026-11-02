// Historical test DATA only. Production/live admission never calls this inverse.
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
export const previousOverviewCameraHash='88dc444b95035b03e4b2864759cef1049b07de85715d9f631ee076246930748b'
export const currentOverviewCameraHash='44518e0567e5b37ff13af1385dee3a9b0794e929c917b74734295d8d10bae498'
const hash=s=>createHash('sha256').update(s).digest('hex')
export function previousOverviewCameraSource(source){
 if(hash(source)===previousOverviewCameraHash)return source
 assert.equal(hash(source),currentOverviewCameraHash,'unreviewed camera source')
 let previous=source
 for(const stage of ['enter','exit']){
  const before=`  scene.overviewStage = '${stage}'\n`
  const after=before+'  scene.world.cameras.input.buttons = 0\n'
  assert.equal(previous.split(after).length,2,'unique reviewed gate publication')
  previous=previous.replace(after,before)
 }
 assert.equal(hash(previous),previousOverviewCameraHash)
 return previous
}
export function readPreviousOverviewCamera(path,encoding){
 const source=readFileSync(path,encoding)
 return String(path).endsWith('/app/scene-camera-runtime.ts')?previousOverviewCameraSource(source):source
}
