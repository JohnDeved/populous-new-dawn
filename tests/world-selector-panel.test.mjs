import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {inflateSync} from 'node:zlib'

const root = new URL('../public/original/world-selector/', import.meta.url)
const provenance = JSON.parse(readFileSync(new URL('panel/provenance.json', root)))
const textures = JSON.parse(readFileSync(new URL('provenance.json', root)))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

test('selector strip retains source-palette frames and transparent PSFB skips', () => {
  assert.equal(provenance.inputs['data/plspanel.spr'], '9b3e17fd501c65c7357cb64c0c8f27ec43304da8726afa6044b642e65e50a778')
  for (const [mission, suffix] of [[1,'c'],[2,'s'],[3,'p']]) {
    const bank=provenance.banks[mission]
    assert.equal(bank.palette,suffix)
    for (const path of [`levels/levl2${String(mission).padStart(3,'0')}.hdr`,`data/plspl0-${suffix}.dat`])
      assert.equal(provenance.inputs[path], textures.assets[mission-1].sources[path])
    assert.deepEqual(Object.keys(bank.frames),['0','5','6','10'])
    for (const [frame, size] of [[0,[638,61]],[5,[10,12]],[6,[10,12]],[10,[37,37]]]) {
      const record=bank.frames[frame]
      const png=readFileSync(new URL(`panel/${record.file}`,root))
      assert.equal(hash(png),record.outputSha256)
      assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],size)
      assert.deepEqual([record.width,record.height],size)
      let offset=8;const compressed=[]
      while(offset<png.length){
        const length=png.readUInt32BE(offset)
        if(png.toString('ascii',offset+4,offset+8)==='IDAT')compressed.push(png.subarray(offset+8,offset+8+length))
        offset+=12+length
      }
      const raw=inflateSync(Buffer.concat(compressed)),rows=[]
      for(let y=0;y<size[1];y++){
        const start=y*(size[0]*4+1)
        assert.equal(raw[start],0)
        rows.push(raw.subarray(start+1,start+1+size[0]*4))
      }
      const pixels=Buffer.concat(rows)
      assert.equal(hash(pixels),record.rgbaSha256)
      const alpha=pixels.filter((_,i)=>i%4===3)
      assert.ok(alpha.includes(0))
      assert.ok(alpha.includes(255))
      assert.ok(alpha.every(a=>a===0||a===255))
    }
  }
})

test('scene fills widescreen while the native panel and title retain their common art scale',()=>{
  const css=readFileSync(new URL('../app/world-selector.module.css',import.meta.url),'utf8')
  const rule=name=>css.match(new RegExp(`^\\.${name} \\{([^}]+)\\}`, 'm'))[1]
  assert.match(rule('selector'),/--panel-width: min\(100vw, calc\(100dvh \* 4 \/ 3\)\)/)
  assert.match(rule('scene'),/width: 100%;/)
  assert.match(rule('scene'),/height: calc\(var\(--panel-width\) \* \.75\)/)
  assert.match(rule('panel'),/width: calc\(var\(--panel-width\) \* 638 \/ 640\)/)
  assert.match(rule('selectedTitle'),/bottom: calc\(var\(--panel-width\) \* 61 \/ 640\)/)
  for(const [width,height] of [[640,480],[1920,1080],[3440,1440],[3840,2160]]){
    const scale=Math.min(width/640,height/480)
    const panelWidth=638*scale, panelHeight=61*scale
    assert.ok(panelWidth<=width&&panelHeight<height)
    assert.equal(panelWidth/panelHeight,638/61)
    // Panel native (1,419) and title y400 remain in the original centered frame.
    const frameLeft=(width-640*scale)/2
    assert.ok(Math.abs((width-panelWidth)/2-(frameLeft+scale))<1e-10)
    assert.ok(Math.abs(height-panelHeight-(height-480*scale+419*scale))<1e-10)
  }
})
