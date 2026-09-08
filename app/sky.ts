export type SkyViewport={x:number;y:number;width:number;screenWidth:number;surfaceOffset:number};

// Defeat branch of 0x524a30, then 0x517830. The system palette is supplied
// by the caller; its animation/remapping is independent of this draw command.
export function defeatSky(counter:number,tribe:number,colors:readonly (readonly number[])[],view:SkyViewport) {
  counter&=255;
  if(!counter)return null;
  const [r,g,b]=colors[tribe],alpha=[0x30,0x48,0x60,0x48][counter&3];
  return {rect:[view.x,view.y,view.x+view.width,view.y+Math.trunc(view.surfaceOffset/view.screenWidth)],
    color:((alpha<<24)|(r<<16)|(g<<8)|b)>>>0,flags:2};
}
