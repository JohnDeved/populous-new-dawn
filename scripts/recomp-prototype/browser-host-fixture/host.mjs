// Synthetic deterministic host. Does not execute translated game code.
export class Host {
  constructor({maxTasks=16,maxSteps=10000}={}) {
    if (![maxTasks,maxSteps].every(n=>Number.isSafeInteger(n)&&n>0)) throw Error('invalid limits');
    this.maxTasks=maxTasks; this.maxSteps=maxSteps; this.steps=0; this.now=0;
    this.tasks=[]; this.events=new Map(); this.trace=[]; this.queue=[];
  }
  event(name,{manual=false,signaled=false}={}) {
    if(this.events.has(name)) throw Error('duplicate event');
    if(this.events.size>=this.maxTasks) throw Error('event cap');
    this.events.set(name,{manual,signaled});
  }
  spawn(iterator) {
    if(this.tasks.length>=this.maxTasks) throw Error('task cap');
    if(!iterator||typeof iterator.next!=='function') throw Error('iterator required');
    const t={id:this.tasks.length,iterator,state:'ready',value:undefined};
    this.tasks.push(t);this.queue.push(t);return t.id;
  }
  ready(t,value){t.state='ready';t.value=value;this.queue.push(t);}
  signal(name){const e=this.events.get(name);if(!e)throw Error('unknown event');e.signaled=true;this.wake();}
  reset(name){const e=this.events.get(name);if(!e)throw Error('unknown event');e.signaled=false;}
  wake(){
    // Task creation order is the explicit deterministic tie-break, not OS fidelity.
    for(const t of this.tasks){
      if(t.state==='wait'){
        const e=this.events.get(t.event);
        if(e.signaled){if(!e.manual)e.signaled=false;this.ready(t,'signaled');continue;}
        if(t.deadline<=this.now)this.ready(t,'timeout');
      }else if(t.state==='sleep'&&t.deadline<=this.now)this.ready(t,'awake');
    }
  }
  run(){
    for(;;){
      this.wake();
      if(!this.queue.length){
        const pending=this.tasks.filter(t=>t.state==='sleep'||t.state==='wait');
        if(!pending.length)return 'complete';
        const next=Math.min(...pending.map(t=>t.deadline));
        if(!Number.isFinite(next))return 'blocked';
        this.now=next;this.wake();continue;
      }
      if(this.steps>=this.maxSteps)throw Error('step cap');
      this.steps++;
      const t=this.queue.shift();
      let r;try{r=t.iterator.next(t.value);}catch(e){t.state='failed';throw e;}
      t.value=undefined;
      if(r.done){t.state='done';this.trace.push({tick:this.now,id:t.id,action:'done'});continue;}
      const a=r.value;
      if(!a||!['yield','sleep','wait','signal','reset'].includes(a.op))throw Error('unsupported action');
      this.trace.push({tick:this.now,id:t.id,action:a.op});
      if(a.op==='sleep'||a.op==='wait'){
        const ms=a.op==='wait'&&a.ms===undefined?Infinity:a.ms;
        if(ms!==Infinity&&(!Number.isSafeInteger(ms)||ms<0))throw Error('invalid duration');
        if(a.op==='sleep'&&ms===Infinity)throw Error('invalid sleep');
        const deadline=this.now+ms;
        if(deadline!==Infinity&&!Number.isSafeInteger(deadline))throw Error('clock overflow');
        if(a.op==='wait'&&!this.events.has(a.event))throw Error('unknown event');
        t.deadline=deadline;t.event=a.event;t.state=a.op==='wait'?'wait':'sleep';
      }else{
        if(a.op==='signal')this.signal(a.event);
        if(a.op==='reset')this.reset(a.event);
        this.ready(t,undefined);
      }
    }
  }
}
