// Newly authored synthetic host adapters. No raw backing-store pointer escapes.
export function snapshotGuestInput(memory,address,length) {
  return memory.readSpan(address,length);
}
export function commitHostRead(memory,address,hostBytes,bytesRead) {
  if(!(hostBytes instanceof Uint8Array)||!Number.isSafeInteger(bytesRead)||bytesRead<0||bytesRead>hostBytes.length||bytesRead>65536)throw new RangeError('Invalid host read count');
  if(bytesRead===0)return 0;
  memory.writeSpan(address,hostBytes.subarray(0,bytesRead));return bytesRead;
}
export function snapshotIndexedSurface(memory,address,width,height,pitch) {
  if(![address,width,height,pitch].every(Number.isSafeInteger)||width<1||height<1||width>4096||height>4096||pitch<width||pitch>65536||width*height>1048576||address<65536||address+(height-1)*pitch+width>0x100000000)throw new RangeError('Surface bounds');
  const pixels=new Uint8Array(width*height);
  for(let row=0;row<height;row++)pixels.set(memory.readSpan(address+row*pitch,width),row*width);
  return {width,height,pitch:width,pixels};
}
