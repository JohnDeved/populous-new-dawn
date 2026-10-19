import { materializeObservations } from '/workspace/shared/populous-model-pick-work/scripts/body-layer-stage-a/observation-store.mjs'
import { comparePair } from '/workspace/shared/populous-model-pick-work/scripts/body-layer-stage-a/compare.mjs'
import { checkpointCodec } from '/workspace/shared/populous-model-pick-work/scripts/tutorial-browser/checkpoint-codec.mjs'
import { mkdirSync } from 'node:fs'
const root='/tmp/body-r11-offline/run',out='/tmp/body-r11-offline/comparisons';mkdirSync(out)
const m=materializeObservations(root);console.log(JSON.stringify({verifiedPaths:Object.keys(m.paths).length}))
for(const cohort of ['camera','animation']){const rows=comparePair(`${root}/${cohort}-baseline`,`${root}/${cohort}-candidate`,out,checkpointCodec);console.log(JSON.stringify({cohort,status:'passed',rows:rows.length}))}
