// 0x474ba0: missing neighbors choose the original connected ground texture.
// Flag 0x100 adds the invalid-placement tint; 0x800 draws the direction arrow.
export function groundOverlay(flags:ArrayLike<number>,index:number,mask:number,direction=0){
  const neighbor=(x:number,y:number)=>((((index>>7)+y)&127)<<7)|(((index&127)+x)&127);
  const missing=(x:number,y:number)=>!(flags[neighbor(x,y)]&mask);
  let edges=Number(missing(0,-1))|Number(missing(1,0))<<1|Number(missing(0,1))<<2|Number(missing(-1,0))<<3;
  let tile=5,rotation=0;
  const corners:Record<number,number[]>={3:[6,3],5:[2,1],6:[6,0],7:[3,1],9:[6,2],10:[2,0],11:[3,0],12:[6,1],13:[3,3],14:[3,2],15:[7,0]};
  if(corners[edges])[tile,rotation]=corners[edges];
  else if(edges)rotation=edges&1?2:edges&2?3:edges&4?0:1;
  else{
    edges=Number(missing(-1,-1))*16|Number(missing(1,-1))*32|Number(missing(-1,1))*64|Number(missing(1,1))*128;
    const diagonals:Record<number,number[]>={16:[4,2],32:[4,3],48:[0,2],64:[4,1],80:[0,1],128:[4,0],160:[0,3],192:[0,0],240:[1,0]};
    [tile,rotation]=diagonals[edges]??[15,0];
  }
  const split=flags[index]&1;
  if(split)rotation=(rotation+3)&3;
  if(!(mask&0x1000))tile+=mask&0x400?48:mask&0x100?64:mask&0x80?48:0;
  let color=0xffffffff;
  if(flags[index]&0x800){tile=242;rotation=((split?0:1)-direction+5)&3;}
  else if(tile>63&&tile<80){tile-=16;color=0xffff2020;}
  return {tile,rotation,color};
}

// 0x42af10 initializes these fixed-point UVs; 0x46d070 supplies triangle order.
// Coordinates returned in native tile space, before atlas conversion.
export function groundOverlayTriangles(split:number,rotation:number){
  const uv=[[0,1,0,0,1,0],[0,0,1,0,1,1],[1,0,1,1,0,1],[1,1,0,1,0,0]];
  const corners=split?[[1,0,0,0,0,1],[0,1,1,1,1,0]]:[[0,0,0,1,1,1],[1,1,1,0,0,0]];
  return corners.map((positions,i)=>({positions,uv:uv[(rotation+i*2)&3]}));
}
