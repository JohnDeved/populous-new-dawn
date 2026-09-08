import rules from './original-rules.json' with {type:'json'};

type Point={x:number;y:number};
export type CollisionPerson=Point & {model:number;flags2:number;flags4:number;tribe:number;workTarget:number;target:number};
export type CollisionObject=Point & {class:number;state:number;flags2:number;tribe:number;related:number};
export type CollisionCell={flags:number;category:number;building:number};
export type CollisionWorld={cell:(p:Point)=>CollisionCell;walkMask:ArrayLike<number>;
  objects:ReadonlyMap<number,CollisionObject>;boatAt:(p:Point)=>boolean};

// 0x44f980: return the original nonzero bit, not just a boolean. Coastal
// categories carry eight reversed-Y rows of eight subcell samples each.
export function terrainSupportsPerson(category:number,p:Point){
  category&=15;const flags=rules.terrainCategoryFlags[category];
  if(flags&1)return 1;
  if(flags&60)return rules.terrainCategoryMasks[category][(255-((p.y&510)>>1))>>5]&(1<<(7-((p.x>>6)&7)));
  return 0;
}

// 0x517f10: construction, repair, entry and target-following permissions.
export function buildingBlocksPerson(w:CollisionWorld,p:CollisionPerson,cell:CollisionCell){
  const id=cell.building&1023,b=w.objects.get(id),flags=p.flags4;
  if(flags&1){
    if(!b)throw new Error(`Missing native building ${id}`);
    if(b.state===1)return Number(!!p.workTarget&&w.objects.get(p.workTarget)?.related!==id);
    return Number(b.tribe!==p.tribe);
  }
  if(flags&2){if(!b)throw new Error(`Missing native building ${id}`);return Number(b.state===1||p.workTarget!==id);}
  if(flags&4)return Number(p.workTarget!==id);
  if(flags&0x10000){
    const target=p.target?w.objects.get(p.target):undefined;
    if(target&&!(target.flags2&1)&&target.class){const other=w.cell(target).building&1023;if(other&&other===id)return 0;}
    return 1;
  }
  return 0;
}

// 0x5178d0: 0 allowed, 1 building, 2 cell restriction, 3 walk mask,
// 4 unsupported surface. Preserve query order and the original flag exceptions.
export function personStepCollision(w:CollisionWorld,p:CollisionPerson,to:Point){
  const cell=w.cell(to),flags=p.flags4,category=rules.terrainCategoryFlags[cell.category&15];
  const passable=()=>{const bit=((to.y>>>8)&255)*256+((to.x>>>8)&255);return !!(w.walkMask[bit>>3]&(1<<(bit&7)));};
  if(!(flags&0x10007)||(p.flags2&0x20000000)){
    if(cell.flags&0x200)return p.flags2&0x20000000?0:1;
    if(cell.flags&4)return 2;
    if(p.model===1&&(category&60)&&!(cell.flags&0x1000000))return 2;
    if(!passable())return 3;
    if(!(flags&0x800000)||!(flags&0x1000000))return terrainSupportsPerson(cell.category,to)?0:4;
    return category&2?4:0;
  }
  if(cell.flags&4)return 0;
  if(!passable())return 3;
  if(!terrainSupportsPerson(cell.category,to)){
    if(!(flags&0x800000)||!(category&60))return 4;
    if(!w.boatAt(to)&&!(flags&0x1000000))return 4;
  }else if(cell.flags&0x200)return buildingBlocksPerson(w,p,cell);
  return 0;
}
