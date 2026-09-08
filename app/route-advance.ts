import rules from './original-rules.json' with {type:'json'};
import {releasePersonRoute} from './person-routes.ts';
import type {RoutedPerson,MotionRoutes} from './person-routes.ts';
import type {RoutingVehicle} from './vehicle-routing.ts';

type Point={x:number;y:number};
export type AdvancingPerson=RoutedPerson & {class:number;counter:number};
type Vehicle=RoutingVehicle & {turnAngle:number;turnY:number};
type AdvanceWorld={routes:MotionRoutes;vehicles:ReadonlyMap<number,Vehicle>;people:ReadonlyMap<number,AdvancingPerson>};
type AdvanceEffects={boarding:(p:AdvancingPerson,cell:number,airborne:boolean)=>number;board:(p:AdvancingPerson,v:Vehicle)=>boolean;
  routeAvailable:(p:AdvancingPerson)=>boolean;approach:(v:Vehicle,to:Point)=>boolean;alternativeLanding:(v:Vehicle,to:Point)=>Point|null;
  landingBlocked:(to:Point)=>boolean;prepareLanding:(v:Vehicle,to:Point)=>void;leaveVehicle:(v:Vehicle,p:AdvancingPerson,to:Point)=>void;clearOrders:(p:AdvancingPerson)=>void};
const byte=(n:number)=>n<<24>>24;
const packed=(p:Point)=>((p.x>>8)&254)|(p.y&0xfe00);
const delta=(a:number,b:number)=>{const d=Math.abs((a<<16>>16)-(b<<16>>16));return d>32767?65535-d:d;};
const reroute=(p:AdvancingPerson)=>{p.flags2=(p.flags2|0x80000000)>>>0;};
const turn=(p:AdvancingPerson)=>{p.turnAngle=p.destinationX;p.turnY=p.destinationY;p.flags2=((p.flags2&~128)|0x1000)>>>0;};

// Complete 0x4eadc0. Route ownership is shared with planning/release. Boat
// boarding, passenger removal and landing geometry remain explicit consumers.
export function advancePersonRoute(w:AdvanceWorld,p:AdvancingPerson,e:AdvanceEffects){
  if(!p.motionGroup||(p.flags2&0x80000))return;
  const d=w.routes.records,a=p.motionGroup*109,count=d[a+108],index=byte(p.motionIndex),v=!!p.vehicle&&!(p.flags4&0x2000000)?w.vehicles.get(p.vehicle)!:null;
  const read=(at:number)=>({x:((d[at]&254)+1)*256,y:((d[at+1]&254)+1)*256});
  const kindAt=(at:number)=>d[at+2]?2:1,at=a+(count?12+index*4:4),lastCurrent=index>=count-1;
  const kind=lastCurrent&&(d[a+2]&2)?3:kindAt(at),next=index<count-1?kindAt(a+16+index*4):0;
  let offset=0,boarding=0,disembarking=false,approaching=false;
  const dataView=new DataView(d.buffer,d.byteOffset,d.byteLength);let threshold=dataView.getInt32(at,true);
  if(!v){
    if(kind===1){threshold=224;if(next===2){offset=1;boarding=2;threshold=576;}}
    else{boarding=kind;threshold=576;}
  }else if(kind===1){disembarking=true;threshold=576;}
  else if(kind===2){threshold=224;if(next!==2){approaching=true;threshold=576;}}
  const target=read(a+(count?12+(index+offset)*4:4)),position=v??p;
  const passengers=function*(){
    for(let i=0;i<byte(rules.vehicleCapacity[v!.model]);i++){
      const id=v!.passengers[i],person=id?w.people.get(id):undefined;
      if(person&&!(person.flags2&1)&&person.class)yield person;
    }
  };
  const alternative=()=>{if(lastCurrent){const to=e.alternativeLanding(v!,target);if(to){p.goalX=to.x;p.goalY=to.y;}}};
  if(v){
    v.navigationFlags=(v.navigationFlags&~0x101)>>>0;
    if(approaching&&delta(position.x,target.x)<641&&delta(position.y,target.y)<641){
      v.turnAngle=target.x;v.turnY=target.y;v.navigationFlags=(v.navigationFlags|1)>>>0;
      if(packed(position)===packed(target))v.navigationFlags=(v.navigationFlags|0x100)>>>0;
    }
  }
  const radius=(threshold+1)|0;
  if(delta(position.x,target.x)>=radius||delta(position.y,target.y)>=radius){
    if(!v){if(!(p.counter&15)&&!e.routeAvailable(p))reroute(p);}
    else if(approaching&&!(p.counter&3)&&!e.approach(v,target)){alternative();for(const member of passengers())reroute(member);}
    return;
  }
  const last=index+offset>=count-1;
  if(boarding){
    const id=e.boarding(p,packed(target),boarding===3),vehicle=id?w.vehicles.get(id):undefined;
    if(!vehicle||!e.board(p,vehicle))reroute(p);
    if(p.flags2&0x80000000)return;
    if(!last){
      p.motionIndex=byte(p.motionIndex+1+offset);const to=read(p.motionGroup*109+12+p.motionIndex*4);p.destinationX=to.x;p.destinationY=to.y;turn(p);return;
    }
    if(boarding!==3&&((p.goalX>>8)!==(target.x>>8)||(p.goalY>>8)!==(target.y>>8))){reroute(p);return;}
    releasePersonRoute(w.routes,p);p.destinationX=p.goalX;p.destinationY=p.goalY;return;
  }
  if(disembarking){
    p.motionIndex=byte(p.motionIndex+1);const to=read(a+12+(index+(next===1?1:0))*4);
    if(e.landingBlocked(to))e.prepareLanding(v!,to);
    p.destinationX=to.x;p.destinationY=to.y;
    const group=p.motionGroup;
    for(const member of passengers())if(member.motionGroup===group){member.motionIndex=p.motionIndex;member.destinationX=p.destinationX;member.destinationY=p.destinationY;turn(member);}
    if(p.flags2&0x8000000){
      for(const member of passengers())if(member.flags2&0x8000000){releasePersonRoute(w.routes,member);e.clearOrders(member);}
    }else{
      let found;do{found=false;for(const member of passengers()){
        if(member.motionGroup===p.motionGroup){found=true;e.leaveVehicle(v!,member,to);}else reroute(member);
      }}while(found);
    }
    return;
  }
  if(last){
    let valid=true,keepTarget=false,goal=packed({x:p.goalX,y:p.goalY});
    if(v){
      if(!e.approach(v,target)){valid=false;alternative();for(const member of passengers())reroute(member);}
      else{keepTarget=true;const end=a+8+count*4;goal=(d[end]&254)|((d[end+1]&254)<<8);}
    }
    if(valid){
      if(packed(target)!==goal)reroute(p);
      else{
        releasePersonRoute(w.routes,p);
        if(keepTarget){p.goalX=target.x;p.goalY=target.y;}
        p.destinationX=p.goalX;p.destinationY=p.goalY;p.turnAngle=p.destinationX;p.turnY=p.destinationY;p.flags2=((p.flags2&~128)|0x1000)>>>0;
      }
    }
  }else{
    p.motionIndex=byte(p.motionIndex+1);const to=read(p.motionGroup*109+12+p.motionIndex*4);p.destinationX=to.x;p.destinationY=to.y;turn(p);
  }
  if(v)for(const member of passengers()){
    if(p.flags2&0x80000000)reroute(member);
    else if(!p.motionGroup)releasePersonRoute(w.routes,member);
    else if(member.motionGroup===p.motionGroup){member.motionIndex=p.motionIndex;member.destinationX=p.destinationX;member.destinationY=p.destinationY;turn(member);}
  }
}
