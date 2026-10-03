import assert from 'node:assert/strict'
import test from 'node:test'
import { cameraPreset, cameraMatrix, polygonMeshBounds, projectPoint } from '../app/projection.ts'
import { DisplayGroundFootprint, widenGroundBounds } from '../app/viewport-bounds.ts'
import { circularMeshBounds, meshCellVisible } from '../app/projection.ts'
import { stepViewTransition, previewViewTransition } from '../app/camera-view.ts'
import { RenderView } from '../app/render-view.ts'

test('horizontal viewport expansion preserves native depth and safe projection arithmetic', () => {
  for (const index of [0, 1, 2, 3])
    for (const preset of [0, 3]) {
      const config = cameraPreset(index, preset)
      assert.deepEqual(
        widenGroundBounds(config, config.width, config.height, [0, 424]),
        config.bounds
      )
      for (const width of [1920, 3440, 3840, 7680])
        for (const heights of [
          [0, 63],
          [0, 424],
          [-128, 2048],
        ]) {
          const bounds = widenGroundBounds(config, width, 2160, heights)
          for (let i = 0; i < 8; i++) {
            if (i % 2) assert.equal(bounds[i], config.bounds[i])
            else assert.ok(Math.abs(bounds[i]) >= Math.abs(config.bounds[i]))
          }
          if (JSON.stringify(bounds) === JSON.stringify(config.bounds)) continue
          for (const heading of [0, 1, 255, 256, 257, 511, 512, 768, 1024, 1536, 2047]) {
            const projection = {
              ...config,
              matrix: cameraMatrix(heading, config.pitch),
              width,
              height: 2160,
              centerX: width / 2,
              centerY: 1080,
              fractionX: 4,
              fractionY: 4,
              pixelScaleX: 0.0625,
              pixelScaleY: 0.0625,
            }
            const sample = { x: 128, y: heights[0], z: -256, flags: 0x100 }
            const reused = { x: 1, y: 2, z: 3, screenX: 4, screenY: 5, flags: -1 }
            assert.equal(projectPoint(sample, projection, false, reused), reused)
            assert.deepEqual(reused, projectPoint(sample, projection, false))
            const rows = polygonMeshBounds(bounds, heading)
            for (let row = 0; row < rows.length; row++) {
              const [start, end] = rows[row]
              if (!start || start === end) continue
              for (const column of [start, end])
                for (const h of heights)
                  for (const offset of [-256, 256]) {
                    const p = projectPoint(
                      { x: (column - 110) * 256 + offset, y: h, z: (row - 111) * 256 + offset },
                      projection
                    )
                    assert.ok(
                      4 * (p.x * p.x + p.z * p.z) <= 0x7fffffff,
                      `radius overflow: ${index}/${preset}/${width}/${heading}/${row}`
                    )
                    assert.ok(
                      Math.abs(p.x * config.scale) <= 0x7fffffff,
                      `scale overflow: ${index}/${preset}/${width}/${heading}/${row}`
                    )
                  }
            }
          }
        }
    }
  const bird = cameraPreset(3, 2)
  assert.deepEqual(widenGroundBounds(bird, 3840, 2160, [0, 424]), bird.bounds)
})

function transitionConfig(from, to, seconds) {
  const current = cameraPreset(3, from), target = cameraPreset(3, to)
  let remaining = 18
  const ticks = Math.min(18, Math.floor((seconds + 1e-9) * 24))
  for (let i = 0; i < ticks; i++) remaining = stepViewTransition(current, target, remaining, 18)
  return previewViewTransition(current, target, remaining, 18, (seconds - ticks / 24) * 24)
}

const countCells = bounds => bounds.reduce((sum, row) => sum + row[1] - row[0], 0)

test('intermediate display footprint fills the observed bird-view cut without changing native camera state', () => {
  const config = transitionConfig(0, 2, .74999), original = structuredClone(config)
  const native = circularMeshBounds(config.diameter), before = structuredClone(native)
  const helper = new DisplayGroundFootprint(), center = {x:2560,y:-9728}
  const bounds = helper.cover(native, config, 1240, 1000, [0,424], 0, center)
  assert.equal(config.diameter,50)
  assert.equal(config.boundsMode,0)
  assert.deepEqual(config,original)
  assert.deepEqual(native,before)
  assert.equal(countCells(native),1924)
  assert.ok(countCells(bounds)>1924 && countCells(bounds)<4234, 'Only display-connected cells, not a global75diameter')
  assert.equal(helper.cover(circularMeshBounds(50),config,1240,1000,[0,424],0,center),bounds,'Unchanged frame reuses the bounded workspace result')
  const endpoint = cameraPreset(3,2), endpointNative = circularMeshBounds(endpoint.diameter)
  assert.deepEqual(helper.cover(endpointNative,endpoint,1240,1000,[0,424],0,center),endpointNative,'Already covering bird endpoint stays unchanged')
  const polygon = cameraPreset(3,3), polygonNative = polygonMeshBounds(polygon.bounds,0)
  assert.equal(helper.cover(polygonNative,polygon,1240,1000,[0,424],0,center),polygonNative,'Polygon presets keep their original expansion path')
})

test('added display cells cover safe front-branch projected samples across zoom, rotation and torus fractions', () => {
  const helper = new DisplayGroundFootprint()
  let checked = 0
  for (const [from,to,time,angle,fraction] of [
    [0,2,.137,0,0],[0,2,.375,256,255],[0,2,.74999,512,511],
    [2,0,.137,768,1],[2,0,.375,1024,129],[2,0,.70834,1536,257],
    [0,3,.137,2047,511],[3,0,.375,255,0],
  ]) {
    const config = transitionConfig(from,to,time), native = circularMeshBounds(config.diameter)
    const center = {x:65536+fraction,y:-65536+fraction}, heights=[0,424]
    const bounds = helper.cover(native,config,1240,1000,heights,angle,center)
    const matrix = cameraMatrix(angle,config.pitch), pitch = cameraMatrix(0,config.pitch)
    const projection = {...config,matrix,width:1240,height:1000,centerX:620+config.offsetX,centerY:500+config.offsetY,fractionX:4,fractionY:4,pixelScaleX:.0625,pixelScaleY:.0625}
    const curve=config.curvature/0x40000000, slope=pitch[5]/pitch[8], heightSlope=pitch[4]/16384-slope*pitch[7]/16384
    for(let row=45;row<176;row+=2)for(let column=45;column<176;column+=2)for(const y of [0,212,424]){
      const x=(column-110)*256+128-Math.ceil(fraction/2),z=(row-111)*256+128-Math.ceil(fraction/2)
      const point=projectPoint({x,y,z},projection)
      const cameraX=(matrix[0]*x+matrix[2]*z)/16384,cameraZ=(matrix[6]*x+matrix[7]*y+matrix[8]*z)/16384,depth=cameraZ+config.depth
      // Stay away from deliberate signed/near-plane safety limits when proving coverage.
      if(depth<1024 || cameraX*cameraX+cameraZ*cameraZ>0x1fffffff-0x4000000 || Math.abs(cameraX)*config.scale>0x70000000)continue
      if(curve>0 && curve*(depth*depth+cameraX*cameraX)>slope*config.depth+curve*config.depth*config.depth-heightSlope*y)continue
      if(point.screenX<2||point.screenX>=1238||point.screenY<2||point.screenY>=998)continue
      assert.ok(bounds[row][0] && column>=bounds[row][0] && column<bounds[row][1],JSON.stringify({from,to,time,angle,fraction,row,column,y,screen:[point.screenX,point.screenY]}))
      checked++
    }
    assert.equal(bounds.length,222)
    for(let row=0;row<222;row++){
      assert.ok(bounds[row].every(Number.isInteger))
      assert.ok(bounds[row][0]>=0&&bounds[row][1]<=221)
      if(native[row][0])assert.ok(bounds[row][0]<=native[row][0]&&bounds[row][1]>=native[row][1])
    }
    const wrapped=helper.cover(native,config,1240,1000,heights,angle,{x:fraction,y:fraction})
    assert.deepEqual(wrapped,bounds,'Whole torus copies cannot alter a relative display footprint')
  }
  assert.ok(checked>1000)
})

test('display bounds texture and CPU visibility share the same derived rows without feeding camera state', () => {
  const view=new RenderView(), config=transitionConfig(0,2,.375), frozen=structuredClone(config)
  view.terrainHeights=[0,424]
  view.update(1240,1000,{x:119.75,z:-120.125},Math.PI/4,0,false,1440,config)
  assert.deepEqual(config,frozen)
  assert.equal(view.config,config)
  assert.deepEqual(Array.from(view.boundsTexture.image.data),view.bounds.flat())
  for(let x=-126;x<128;x+=4)for(let z=-126;z<128;z+=4){
    const p={x,z}
    assert.equal(view.visible(p),meshCellVisible(view.bounds,{x:Math.round((x+8)*256),y:Math.round((-z-8)*256)},view.center))
  }
  view.update(1240,1000,{x:119.75,z:-120.125},Math.PI/4,0,true,1440,config)
  assert.deepEqual(view.bounds,circularMeshBounds(config.diameter),'Globe mode does not run ground expansion')
})
