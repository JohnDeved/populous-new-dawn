// Reviewed control-flow reconstruction: 0x48c6b0/0x48c980, 0x48f130/0x48f230,
// 0x48ef00/0x48ed90. Game commands and non-attribute internal reads belong to the host.
export type PopScript = {codes:number[];fields:number[][];variables:number[];commands:Record<string,number>};
export type ScriptState = {variables:number[];attributes:number[]};
export function scriptState(script:PopScript):ScriptState{return {variables:[...script.variables],attributes:Array(48).fill(0)};}
export function scriptValue(script:PopScript,state:ScriptState,index:number,readInternal:(id:number)=>number):number{
  const field=script.fields[index];if(!field)throw new RangeError(`Invalid script field ${index}`);
  const [type,value]=field;
  if(type===0)return value|0;
  if(type===1){if(value<0||value>=64)throw new RangeError('Invalid script variable');return state.variables[value]|0;}
  if(type===2)return (value>=1000&&value<1048?state.attributes[value-1000]:readInternal(value))|0;
  return 0; // Native get_tribe_data returns zero for an unknown field type.
}
export function runScript(script:PopScript,state:ScriptState,host:{turn:number;tribe:number;readInternal:(id:number)=>number;command:(opcode:number,args:number[])=>void}){
  const codes=script.codes;let pc=1;
  if(codes[0]!==12||codes.length>4096)throw new Error('Unsupported PopScript format');
  const next=()=>{if(pc>=codes.length)throw new Error('Truncated PopScript');return codes[pc++];};
  const expect=(token:number)=>{if(next()!==token)throw new Error(`Expected script token ${token} at ${pc-1}`);};
  const read=(index:number)=>scriptValue(script,state,index,host.readInternal);
  const writable=(index:number)=>{
    const f=script.fields[index];if(!f)throw new RangeError('Invalid destination field');
    if(f[0]===1){if(f[1]<0||f[1]>=64)throw new RangeError('Invalid destination variable');return true;}
    return f[0]===2&&f[1]>=1000&&f[1]<1048;
  };
  const write=(index:number,value:number)=>{
    const [type,id]=script.fields[index];
    if(type===1)state.variables[id]=value|0;else state.attributes[id-1000]=value&255;
  };
  const condition=():boolean=>{
    const op=next();
    if(op===1020||op===1021){const a=condition(),b=condition();return op===1020?a&&b:a||b;} // Both sides read, even when the first decides the result.
    const a=read(next()),b=read(next());
    switch(op){case 1012:return a>b;case 1013:return a<b;case 1014:return a===b;case 1015:return a!==b;case 1016:return a>=b;case 1017:return a<=b;default:throw new Error(`Unsupported comparison ${op}`);}
  };
  const skip=()=>{expect(1003);let depth=1;while(depth){const n=next();if(n===1003)depth++;if(n===1004)depth--;}};
  const block=()=>{
    expect(1003);
    while(codes[pc]!==1004){
      const op=next();
      if(op===1000){
        const take=condition();if(take)block();else skip();
        if(codes[pc]===1001){pc++;if(take)skip();else block();}expect(1002);
      }else if(op===1005){
        const field=script.fields[next()];if(!field)throw new RangeError('Invalid EVERY mask');
        const offset=codes[pc]===1003?0:read(next());
        // Mask comes directly from the field record, not from its variable/internal value.
        if((field[1]&(host.turn+((host.tribe<<24)>>24)+offset))===0)block();else skip();
      }else if(op===1006){
        const opcode=next(),arity=script.commands[opcode];
        if(!Number.isInteger(arity)||arity<0)throw new Error(`Unknown game command ${opcode}`);
        const args=Array.from({length:arity},next);host.command(opcode,args);
      }else if(op>=1007&&op<=1009){
        const dst=next(),value=read(next());
        if(writable(dst))write(dst,op===1007?value:op===1008?read(dst)+value:read(dst)-value);
      }else if(op===1025||op===1026){
        const dst=next(),a=read(next()),b=read(next());
        if(!writable(dst))continue;
        if(op===1026&&a===-2147483648&&b===-1)throw new RangeError('Native signed division overflow');
        write(dst,op===1025?Math.imul(a,b):b===0?0:Math.trunc(a/b));
      }else throw new Error(`Unsupported script statement ${op} at ${pc-1}`);
    }
    pc++;
  };
  do{block();}while(codes[pc]===1003);
  expect(1019);
  return pc-1; // Native CurrentCode remains on SCRIPT_END.
}
