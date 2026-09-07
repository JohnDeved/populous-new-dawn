import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://localhost:3000/',{waitUntil:'networkidle'});
 const result=await page.evaluate(async()=>{
  const {Soundscape}=await import('/app/audio.ts');const audio=new Soundscape();
  await audio.enable();audio.stopAll();audio.cue(0xa2);const source=[...audio.active][0];
  const nativeDuration=source.buffer.duration;
  const offline=new OfflineAudioContext(2,Math.ceil(nativeDuration*22050),22050),probe=offline.createBufferSource();probe.buffer=source.buffer;probe.connect(offline.destination);probe.start();
  const rendered=await offline.startRendering();let energy=0;for(const sample of rendered.getChannelData(0))energy+=sample*sample;
  audio.reset();const reset=audio.active.size===0&&audio.enabled&&audio.randomState===1;
  audio.cue(0x18);audio.mute();const muted=!audio.enabled&&audio.active.size===0;await audio.enable();const resumed=audio.enabled&&audio.active.size>0;
  for(const cue of [0x70,0x9f]){audio.stopAll();audio.cue(cue);if(audio.active.size!==1)throw new Error(`Worship cue ${cue} did not play`);}
  const buffers=audio.buffers.size;audio.dispose();return {rms:Math.sqrt(energy/rendered.length),nativeDuration,reset,muted,resumed,buffers,closed:audio.context.state};
 });
 assert.ok(result.rms>.001);assert.ok(result.nativeDuration>.1);assert.ok(result.reset&&result.muted&&result.resumed);assert.ok(result.buffers>30);assert.equal(result.closed,'closed');console.log('PASS: decoded native waveform, offline audio energy, reset/mute/resume/dispose',result);
}finally{await browser.close();}
