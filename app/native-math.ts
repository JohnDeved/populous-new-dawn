import rules from './original-rules.json' with {type: 'json'};
type Point = {x: number; z: number};

export function cellDelta(a: number, b: number) {
  const d = Math.abs((a & 255) - (b & 255));
  return Math.min(d, 256 - d);
}
// 0x49c720: halve each wrapped byte-coordinate difference before squaring.
export function cellDistanceSquared(a: number, b: number) {
  const x = cellDelta(a,b) >> 1, y = cellDelta(a >>> 8,b >>> 8) >> 1;
  return x*x + y*y;
}
// 0x4f2fc0: square proximity in byte coordinates, without even-cell rounding.
export function cellsNear(a: number, b: number, radius: number) {
  return cellDelta(a,b) <= radius && cellDelta(a >>> 8,b >>> 8) <= radius;
}
// 0x4503f0: shortest 16-bit toroidal distance, truncated by fast_sqrt.
export function positionDistance(a: {x:number;y:number}, b: {x:number;y:number}) {
  const x = Math.abs(((a.x-b.x)<<16)>>16), y = Math.abs(((a.y-b.y)<<16)>>16);
  return Math.floor(Math.sqrt((x*x+y*y)>>>0));
}

// 0x586074: integer octant lookup. Input Z is already reflected from the native map.
export function nativeAngle(dx:number,dz:number){
  const x=Math.abs(dx),z=Math.abs(dz);if(!x&&!z)return 0;
  const a=rules.atan[Math.floor(Math.min(x,z)*256/Math.max(x,z))];
  return (dx>=0?dz<0?(x<z?a:512-a):(x<z?1024-a:512+a):dz<0?(x<z?2048-a:1536+a):(x<z?1024+a:1536-a))&2047;
}
// 0x4e6a70: signed high word of a 16.16 sine product, then reflect native Y.
export function nativeStep(p:Point,angle:number,length:number):Point{
  return {x:(Math.round(p.x*256)+Math.floor(rules.sine[angle&2047]*length/65536))/256,z:(Math.round(p.z*256)-Math.floor(rules.sine[(angle+512)&2047]*length/65536))/256};
}
export function random(w:{randomState:number}){const n=(Math.imul(w.randomState,0x24a1)+0x24df)>>>0;return w.randomState=((n>>>13)|(n<<19))>>>0;}
