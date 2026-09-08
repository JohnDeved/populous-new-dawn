import rules from './original-rules.json' with {type:'json'};
import type {NativeTerrain} from './native-terrain.ts';

type Point={x:number;y:number};
export type RoutedPerson=Point & {id:number;tribe:number;vehicle:number;flags2:number;flags4:number;motionGroup:number;motionIndex:number;
  recoveryCounter:number;goalX:number;goalY:number;destinationX:number;destinationY:number;turnAngle:number;turnY:number};
export type MotionRoutes={records:Uint8Array;active:number;last:number};
export const createMotionRoutes=():MotionRoutes=>({records:new Uint8Array(401*109),active:0,last:0});
const short=(n:number)=>(n<<16)>>16;
const view=(w:MotionRoutes)=>new DataView(w.records.buffer,w.records.byteOffset,w.records.byteLength);
const cell=(p:Point)=>((p.y&65535)>>9)*128+((p.x&65535)>>9);

// Complete 0x4ea460. A zero group leaves the index untouched. Reserved routes
// (flag 4) survive their last user's departure; active counts are signed words.
export function releasePersonRoute(w:MotionRoutes,p:Pick<RoutedPerson,'motionGroup'|'motionIndex'>){
  const id=p.motionGroup;if(!id)return;
  p.motionGroup=0;p.motionIndex=0;
  const a=id*109,v=view(w),count=v.getInt16(a,true);
  if(count>0){v.setInt16(a,count-1,true);if(count===1){w.active=short(w.active-1);if(!(w.records[a+2]&4))w.records[a+2]=0;}}
}

// Complete 0x4e9dd0; used by resting and celebration's direct movements.
export function setDirectPersonDestination(w:MotionRoutes,p:RoutedPerson,to:Point){
  releasePersonRoute(w,p);
  p.goalX=p.destinationX=p.turnAngle=to.x&65535;p.goalY=p.destinationY=p.turnY=to.y&65535;
  p.flags2=((p.flags2&~128)|0x1000)>>>0;
}

// Complete 0x4ea4c0. Exhaustion returns the record's base point, even with
// no intermediate points. Coordinates are centered on the original even cell.
export function personRoutePosition(w:MotionRoutes,id:number,index:number){
  const a=id*109,intermediate=index<w.records[a+108],offset=a+(intermediate?12+index*4:4);
  return {x:((w.records[offset]&254)+1)*256,y:((w.records[offset+1]&254)+1)*256,intermediate};
}

// Complete 0x4ea550, low-word result. The original scans only active-count
// slots backwards from the last route, including empty slots in that budget.
export function reusablePersonRoute(w:MotionRoutes,p:Pick<RoutedPerson,'motionGroup'|'vehicle'>,from:Point,to:Point){
  if(p.motionGroup&&(w.records[p.motionGroup*109+2]&4))return p.motionGroup;
  const v=view(w);let id=w.last;
  const near=(a:number,b:number)=>{const n=Math.abs(a-b);return Math.min(n,256-n)<3;};
  for(let left=w.active;left>0;left--,id--){
    if(id<1)id=400;
    const a=id*109,flags=w.records[a+2];
    if(!v.getInt16(a,true)||(flags&4)||id===p.motionGroup)continue;
    if(w.records[a+8]!==to.x||w.records[a+9]!==to.y)continue;
    if(w.records[a+4]===from.x&&w.records[a+5]===from.y)return id;
    if(!(flags&3)&&!p.vehicle&&near(w.records[a+4],from.x)&&near(w.records[a+5],from.y))return id;
  }
  return 0;
}

// Complete 0x4ea300. Vehicle readiness remains an explicit world consumer.
export function updatePersonRouteVehicle(w:MotionRoutes,p:RoutedPerson,ready:(id:number)=>boolean){
  if(!(p.flags4&512))return;
  let waiting=false;
  if(p.vehicle&&!(p.flags4&0x2000000)&&!(p.flags2&0x80000)&&p.motionGroup){
    const a=p.motionGroup*109;waiting=!ready(p.vehicle)||!w.records[a+(w.records[a+108]?14:6)];
  }
  p.flags2=(waiting?p.flags2|0x8000000:p.flags2&~0x8000000)>>>0;
}

export type RouteWorld={routes:MotionRoutes;skip:number;checkingPerson:number;levelFlags2:number;humanLimit:number;computerLimit:number;
  tribes:{playerType:number;requests:number}[];land:Pick<NativeTerrain,'flags'|'categories'|'buildingIds'>;vehicles:ReadonlyMap<number,Point>};
type RouteEffects={outside:(id:number)=>Point;buildingBlocks:(cell:number)=>boolean;coastDirection:(to:Point)=>number;
  build:(p:RoutedPerson,from:Point,to:Point)=>number;vehicleReady:(id:number)=>boolean;advance:(p:RoutedPerson)=>void};

// Complete 0x4e9e80. Route construction and advancement remain required
// consumers; reuse, ownership, capacity gates and destination changes compose.
export function planPersonDestination(w:RouteWorld,p:RoutedPerson,to:Point,e:RouteEffects){
  p.goalX=to.x&65535;p.goalY=to.y&65535;
  let enabled=false;
  if(w.skip)w.skip=0;
  else enabled=!(w.levelFlags2&0x400000)&&!!(p.flags2&0x2000000)&&!(p.vehicle&&(p.flags4&0x2000000));
  p.flags4=(p.flags4&~0x10000000)>>>0;
  if(enabled){
    const tribe=w.tribes[p.tribe],limit=tribe.playerType===1?w.humanLimit:tribe.playerType===2?w.computerLimit:0;
    if(limit&&tribe.requests>limit)enabled=false;
  }
  if(enabled){
    const start=cell(p),end=cell(to),startBuilding=w.land.buildingIds[start]&1023;
    if(!startBuilding||startBuilding!==(w.land.buildingIds[end]&1023)){
      let from=w.land.flags[start]&512?e.outside(startBuilding):{x:p.x,y:p.y},target={x:p.goalX,y:p.goalY},adjusted=false;
      if(w.land.flags[end]&512){
        w.checkingPerson=p.id;
        if(e.buildingBlocks(((to.x>>8)&254)|(to.y&0xfe00))){adjusted=true;target=e.outside(w.land.buildingIds[end]&1023);}
      }
      const coast=(point:Point)=>{const angle=(e.coastDirection(point)*256+1024)&2047;return {x:(point.x+((rules.sine[angle]<<9)>>16))&65535,y:(point.y+((rules.sine[(angle+512)&2047]<<9)>>16))&65535};};
      if(p.vehicle){const vehicle=w.vehicles.get(p.vehicle);if(!vehicle)throw new Error('Missing native route vehicle');from={...vehicle};}
      else{
        if(rules.terrainCategoryFlags[w.land.categories[start]&15]&60)from=coast(from);
        if(rules.terrainCategoryFlags[w.land.categories[end]&15]&60){adjusted=true;target=coast(target);}
      }
      if(adjusted){p.goalX=target.x;p.goalY=target.y;}
      const a={x:from.x>>8,y:from.y>>8},b={x:target.x>>8,y:target.y>>8};
      const id=reusablePersonRoute(w.routes,p,a,b)||short(e.build(p,a,b));
      p.recoveryCounter=0;if(adjusted)p.flags4=(p.flags4|0x4000000)>>>0;
      if(id){
        p.flags2=(p.flags2&0x7fffffff)>>>0;releasePersonRoute(w.routes,p);
        const offset=id*109,v=view(w.routes),count=v.getInt16(offset,true);
        if(count<1)w.routes.active=short(w.routes.active+1);
        w.routes.last=id;v.setInt16(offset,count+1,true);p.motionGroup=id;p.motionIndex=0;w.routes.records[offset+2]&=~4;
        const point=personRoutePosition(w.routes,id,0);p.destinationX=point.x;p.destinationY=point.y;
        updatePersonRouteVehicle(w.routes,p,e.vehicleReady);e.advance(p);return id;
      }
    }
  }
  if(p.motionGroup&&!(w.routes.records[p.motionGroup*109+2]&4))releasePersonRoute(w.routes,p);
  p.destinationX=p.goalX;p.destinationY=p.goalY;return 0;
}

// Complete 0x4e9d80 wrapper. Vehicle landing-target adjustment is supplied.
export function setPlannedPersonDestination(w:RouteWorld,p:RoutedPerson,to:Point,e:RouteEffects,adjustVehicle:(to:Point)=>void){
  const target={x:to.x&65535,y:to.y&65535};adjustVehicle(target);planPersonDestination(w,p,target,e);
  p.turnAngle=p.destinationX;p.turnY=p.destinationY;p.flags2=((p.flags2&~128)|0x1000)>>>0;
}
