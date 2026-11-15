// Synthetic host-boundary prototype. Contains no original game code/assets.
export function indexedFrame(pixels, width, height, pitch, palette) {
  if (![width,height,pitch].every(Number.isSafeInteger) || width<1 || height<1 || pitch<width || pixels.length<pitch*height || palette.length!==256) throw new RangeError('Invalid framebuffer');
  const rgba=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const c=palette[pixels[y*pitch+x]]>>>0, d=(y*width+x)*4;
    rgba[d]=c>>>16&255; rgba[d+1]=c>>>8&255; rgba[d+2]=c&255; rgba[d+3]=255;
  }
  return rgba;
}
export function gamePoint(clientX,clientY,rect,width,height) {
  const scale=Math.min(rect.width/width,rect.height/height);
  const x=(clientX-rect.left-(rect.width-width*scale)/2)/scale;
  const y=(clientY-rect.top-(rect.height-height*scale)/2)/scale;
  return x<0||y<0||x>=width||y>=height ? null : {x:Math.floor(x),y:Math.floor(y)};
}
export function replay(events,frames,consume) {
  let prior=-1;
  for(const e of events) {if(!Number.isSafeInteger(e.frame)||e.frame<0||e.frame<prior||e.frame>=frames) throw new RangeError('Invalid frame order'); prior=e.frame;}
  let n=0; for(let frame=0;frame<frames;frame++) while(n<events.length&&events[n].frame===frame) consume({...events[n++]});
}
export function syntheticScene() {
  const width=640,height=480,pitch=644,pixels=new Uint8Array(pitch*height),palette=new Uint32Array(256);
  palette[0]=0x122033; palette[1]=0xe1ab3f; palette[2]=0x36b7a4; palette[3]=0xffffff;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) pixels[y*pitch+x]=x<320?(y<240?0:1):(y<240?2:3);
  return {width,height,pitch,pixels,palette};
}
