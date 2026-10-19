import { protocol as stageA } from '../../scripts/body-layer-stage-a/protocol.mjs'
export const protocol = Object.freeze({
  ...stageA,
  mode: 'exploratory-whole-callback-cpu',
  warmups: 4,
  measured: 24,
  order: [
    ['camera', 'baseline', 'AB'],
    ['camera', 'candidate', 'AB'],
    ['camera', 'candidate', 'BA'],
    ['camera', 'baseline', 'BA'],
    ['animation', 'baseline', 'AB'],
    ['animation', 'candidate', 'AB'],
    ['animation', 'candidate', 'BA'],
    ['animation', 'baseline', 'BA'],
  ],
  childMs: 90000,
  totalMs: 900000,
  hostedMinutes: 20,
})
