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
