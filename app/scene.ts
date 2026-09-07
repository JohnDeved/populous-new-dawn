import { soundAttenuation } from './audio';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GRID, SIZE, HOME, ENEMY, PLANET_RADIUS, normal, planetPoint, mapPoint, worldPoint, footprint, placementError, height, walkable, distance, maxHp, buildingHp, cast, command, placeBuilding, SPELLS, tick, type World, type Point, type Unit, type Building, type Effect, unitAnimation } from './model';

import nativeModels from './original-models.json';
import nativeUnits from './original-units.json';
import nativeEffects from './original-effects.json';

const teamColor = { blue: 0x303fc1, red: 0xb92720, wild: 0x9f9170 };
const material = (color: number, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 1, ...extra });
const textures = new Map<string, THREE.Texture>();
function texture(kind: string) {
  if(textures.has(kind))return textures.get(kind)!;
  const t=new THREE.TextureLoader().load(`/original/${kind}.png`);
  t.colorSpace=kind.endsWith('detail')?THREE.NoColorSpace:THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;
  if(kind==='units'||kind==='effects'){t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;}
  textures.set(kind,t);return t;
}
function nativeModel(id:number,scale=2){
  const data=(nativeModels as Record<string,{p:number[];uv:number[]}>)[id];
  const geo=geometry(`original-${id}`,()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));g.computeVertexNormals();return g;});
  const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:texture('atlas'),side:THREE.DoubleSide,alphaTest:.5}));
  mesh.scale.setScalar(scale);mesh.userData.nativeModel=id;return mesh;
}
const meshes = new Map<string, THREE.BufferGeometry>();
function geometry(key: string, create: () => THREE.BufferGeometry) { if (!meshes.has(key)) meshes.set(key, create()); return meshes.get(key)!; }
const cylinder = (top: number, bottom: number, h: number, segments = 8) => geometry(`c${top},${bottom},${h},${segments}`, () => new THREE.CylinderGeometry(top, bottom, h, segments));
const box = (x: number, y: number, z: number) => geometry(`b${x},${y},${z}`, () => new THREE.BoxGeometry(x, y, z));
function part(group: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
}
function ring(radius: number, color: number, width = .075) {
  const g = new THREE.RingGeometry(radius - width, radius, 64); g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, depthWrite: false, side: THREE.DoubleSide }));
}
function makeUnit(u: Unit) {
  const g=new THREE.Group(),map=texture('units').clone();
  map.repeat.set(nativeUnits.cell/nativeUnits.width,nativeUnits.cell/nativeUnits.height);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,alphaTest:.5,depthWrite:true,toneMapped:false}));
  // Frame-specific offsets keep native feet, headdresses and death poses anchored.
  g.add(sprite);
  const shadow=ring(.36,0x171b12,.35);shadow.position.y=.015;(shadow.material as THREE.MeshBasicMaterial).opacity=.32;g.add(shadow);
  const selection=ring(.55,0xffff6c,.045);selection.position.y=.04;g.add(selection);
  const health=new THREE.Group();part(health,box(.8,.055,.02),material(0x20251a),0,2.1);
  const healthFill=part(health,box(.78,.04,.025),material(teamColor[u.team]),0,2.1,.01);g.add(health);
  g.userData={unit:u.id,signature:`${u.team}-${u.kind}`,sprite,selection,health,healthFill,heading:0,frame:-1};return g;
}
function makeBuilding(b: Building) {
  const g=new THREE.Group(),id=b.kind==='hut'?(b.team==='blue'?169:172)+b.level-1:b.kind==='camp'?(b.team==='blue'?141:142):b.kind==='tower'?(b.team==='blue'?117:118):(b.team==='blue'?133:134);
  const model=nativeModel(id,b.kind==='temple'?1.65:2);g.add(model);
  const health=new THREE.Group(),top=b.kind==='tower'?6:4.8;
  part(health,box(2.5,.09,.05),material(0x201d16),0,top);
  const healthFill=part(health,box(2.5,.09,.06),material(teamColor[b.team]),0,top,.01);g.add(health);
  const scaffold=new THREE.Group(),wood=material(0x695337);
  for(const x of [-2.4,2.4])for(const z of [-2.4,2.4])part(scaffold,cylinder(.055,.075,3.8,5),wood,x,1.9,z);
  for(const y of [1.1,2.3,3.5]){part(scaffold,box(4.8,.08,.1),wood,0,y,-2.4);part(scaffold,box(.1,.08,4.8),wood,-2.4,y,0);part(scaffold,box(.1,.08,4.8),wood,2.4,y,0);}
  g.add(scaffold);g.userData={building:b.id,signature:b.level,health,healthFill,scaffold,architecture:[model]};return g;
}

export class GameScene {
  world: World;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, .2, 500);
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  terrainData: THREE.DataTexture;
  unitMeshes = new Map<number, THREE.Group>();
  buildingMeshes = new Map<number, THREE.Group>();
  buildingLabels = new Map<number, HTMLButtonElement>();
  fxMeshes = new Map<number, THREE.Group>();
  objects = new THREE.Group();
  decorations = new THREE.Group();
  shrineMeshes = new Map<number, {g:THREE.Group;label:HTMLButtonElement}>();
  cursor = ring(2.5, 0xe1c38b, .1);
  range = ring(34, 0x6dc9ee, .1);
  mouse = new THREE.Vector2();
  ray = new THREE.Raycaster();
  pointer: Point | null = null;
  viewPoint: Point = HOME;
  down = { x: 0, y: 0, button: 0 };
  dragBox: HTMLDivElement;
  keys = new Set<string>();
  resize: ResizeObserver;
  frame = 0;
  previous = 0;
  uiTimer = 0;
  terrainVersion = -1;
  treeSignature = '';
  onChange: () => void;
  onSound: (cue:number,attenuation?:number,pan?:number) => void;
  soundSerial=0;
  disposeListeners: (() => void)[] = [];
  container: HTMLElement;
  mini: HTMLCanvasElement;
  minimapBackground = document.createElement('canvas');

  constructor(container: HTMLElement, minimap: HTMLCanvasElement, world: World, onChange: () => void, onSound: (cue:number,attenuation?:number,pan?:number) => void) {
    this.container = container; this.mini = minimap; this.world = world; this.onChange = onChange; this.onSound = onSound;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping; this.renderer.toneMappingExposure = 1;
    this.renderer.setClearColor(0x172c36, 0);
    this.renderer.domElement.setAttribute('aria-label', 'Island battlefield. Click to select, right-click to move, drag to select a group.');
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);
    this.scene.fog = new THREE.FogExp2(0x9aadb5, .001);
    this.scene.add(new THREE.HemisphereLight(0xc6d6e3, 0x777258, 2.0));
    const sun = new THREE.DirectionalLight(0xfff2d5, 2.6); sun.position.set(-35, 90, 65); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -62; sun.shadow.camera.right = 62; sun.shadow.camera.top = 62; sun.shadow.camera.bottom = -62; sun.shadow.normalBias = .16; sun.shadow.bias = -.0001; this.scene.add(sun);
    this.makeSky();
    this.camera.up.set(0,0,-1);this.camera.position.set(30,155,0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); this.controls.target.set(0, -PLANET_RADIUS, 0);
    this.controls.enableDamping = true; this.controls.dampingFactor = .09; this.controls.minDistance = PLANET_RADIUS + 14; this.controls.maxDistance = PLANET_RADIUS + 190; this.controls.enablePan = false;
    this.controls.minPolarAngle = .03; this.controls.maxPolarAngle = Math.PI - .03;
    this.controls.mouseButtons = { LEFT: null as unknown as THREE.MOUSE, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.ROTATE };
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.update();
    this.terrainData = new THREE.DataTexture(new Float32Array(world.terrain), GRID, GRID, THREE.RedFormat, THREE.FloatType); this.terrainData.needsUpdate = true;
    this.terrain = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      uniforms:{colours:{value:texture('land-colours')},detail:{value:texture('land-detail')}},
      vertexShader:`attribute float altitude; varying vec2 land; varying float h; varying vec3 norm; void main(){land=uv;h=altitude;norm=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform sampler2D colours;uniform sampler2D detail;varying vec2 land;varying float h;varying vec3 norm;
      void main(){float grain=texture2D(detail,land/16.).r*255.-128.;float shade=64.+grain*.20+(dot(normalize(norm),normalize(vec3(-.5,1.,.4)))-.75)*42.;
      float level=clamp(h*45.+140.+smoothstep(0.,1.,h)*150.+grain*.22,0.,1151.);
      gl_FragColor=texture2D(colours,vec2(clamp(shade,1.,254.)/256.,1.-(level+.5)/1152.));
      #include <colorspace_fragment>
      }`
    })); this.terrain.receiveShadow = true; this.terrain.castShadow = true; this.scene.add(this.terrain);
    const waterGeo = new THREE.SphereGeometry(PLANET_RADIUS, 144, 96);
    this.water = new THREE.Mesh(waterGeo, new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, heights: { value: this.terrainData }, detail:{value:texture('land-detail')},colours:{value:texture('land-colours')} },
      vertexShader: `varying vec3 vPos; uniform float time; void main() { vec3 p=position; p+=normalize(p)*(.06+sin(p.x*.5+time)*cos(p.z*.4+time*.7)*.035); vPos=p; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `varying vec3 vPos; uniform float time; uniform sampler2D heights; uniform sampler2D detail; uniform sampler2D colours; void main(){
        vec2 map=vec2(atan(vPos.x,vPos.y),asin(clamp(vPos.z/length(vPos),-1.,1.)))*70.;
        vec2 grid=map+48.,base=floor(grid),f=fract(grid);float h=-3.;
        if(all(greaterThanEqual(grid,vec2(0.)))&&all(lessThan(grid,vec2(96.)))){
          float a=texture2D(heights,(base+.5)/97.).r,b=texture2D(heights,(base+vec2(1.5,.5))/97.).r,c=texture2D(heights,(base+vec2(.5,1.5))/97.).r,d=texture2D(heights,(base+1.5)/97.).r;
          h=f.x+f.y<=1.?a+f.x*(b-a)+f.y*(c-a):d+(1.-f.x)*(c-d)+(1.-f.y)*(b-d);
        }
        vec2 wave=map/12.+vec2(time*.009,time*.004);
        float grain=texture2D(detail,wave).r;
        float light=clamp(150.+(grain-.5)*105.,30.,240.);
        float shore=1.-smoothstep(-.15,.35,abs(h-.16));
        vec3 color=texture2D(colours,vec2(light/256.,1.-.5/1152.)).rgb;
        color+=shore*smoothstep(.48,.63,grain)*vec3(.23,.25,.23);
        gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
      }`,
    })); this.water.position.y=-PLANET_RADIUS;this.scene.add(this.water);
    this.scene.add(this.objects, this.decorations, this.cursor, this.range); this.cursor.visible = false; this.range.visible = false;
    this.rebuildTerrain(); this.makeDecorations(); this.makeShrines(); this.focus({x:2,z:30});this.drawMinimap();
    this.dragBox = document.createElement('div'); this.dragBox.className = 'selection-box'; container.appendChild(this.dragBox);
    this.resize = new ResizeObserver(() => this.setSize()); this.resize.observe(container); this.setSize();
    this.listen(this.renderer.domElement, 'pointerdown', this.pointerDown);
    this.listen(this.renderer.domElement, 'pointermove', this.pointerMove);
    this.listen(this.renderer.domElement, 'pointerup', this.pointerUp);
    this.listen(this.renderer.domElement, 'contextmenu', e => e.preventDefault());
    this.listen(window, 'keydown', this.keyDown); this.listen(window, 'keyup', e => this.keys.delete((e as KeyboardEvent).key.toLowerCase()));
    this.listen(window, 'blur', () => { this.keys.clear(); this.world.paused = true; this.onChange(); });
    this.listen(minimap, 'pointerdown', e => { const p = e as PointerEvent, rect = minimap.getBoundingClientRect(); this.focus({ x: (p.clientX - rect.left) / rect.width * SIZE - 48, z: (p.clientY - rect.top) / rect.height * SIZE - 48 }); });
    this.frame = requestAnimationFrame(this.animate);
  }
  makeSky(){
    const loader=new THREE.TextureLoader();
    const sky=loader.load('/original/sky.png');sky.colorSpace=THREE.SRGBColorSpace;this.scene.background=sky;
    const clouds=loader.load('/original/clouds.png');clouds.colorSpace=THREE.SRGBColorSpace;clouds.wrapS=clouds.wrapT=THREE.RepeatWrapping;
    const dome=new THREE.Mesh(new THREE.SphereGeometry(350,48,24),new THREE.MeshBasicMaterial({map:clouds,side:THREE.BackSide,transparent:true,depthWrite:false,fog:false,opacity:.72}));
    clouds.repeat.set(4,2);dome.position.y=-PLANET_RADIUS;this.scene.add(dome);
  }
  listen(target: EventTarget, name: string, handler: EventListener) { target.addEventListener(name, handler); this.disposeListeners.push(() => target.removeEventListener(name, handler)); }
  setSize() { const { width, height } = this.container.getBoundingClientRect(); this.renderer.setSize(width, height); this.camera.aspect = width / Math.max(1, height); this.camera.updateProjectionMatrix(); }
  y(p: Point) { return height(this.world.terrain,p.x,p.z); }
  locate(g:THREE.Object3D,p:Point,h?:number){const q=h===undefined?worldPoint(this.world.terrain,p):planetPoint(p,h);g.position.set(q.x,q.y,q.z);const n=normal(p),a=p.x/PLANET_RADIUS,up=new THREE.Vector3(n.x,n.y,n.z),east=new THREE.Vector3(Math.cos(a),-Math.sin(a),0);g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east,up,east.clone().cross(up)));}
  groundRing(mesh:THREE.Mesh,p:Point,radius:number){const pos=mesh.geometry.attributes.position;for(let i=0;i<pos.count;i++){const a=i%65/64*Math.PI*2,r=i<65?radius-.1:radius;const q={x:p.x+Math.cos(a)*r,z:p.z+Math.sin(a)*r};const v=planetPoint(q,Math.max(0,height(this.world.terrain,q.x,q.z))+.16);pos.setXYZ(i,v.x,v.y,v.z);}pos.needsUpdate=true;mesh.geometry.computeBoundingSphere();}

  rebuildTerrain() {
    const w=this.world,positions:number[]=[],altitudes:number[]=[],uv:number[]=[];
    const add=(x:number,z:number)=>{const h=w.terrain[(z+48)*GRID+x+48],p=planetPoint({x,z},h);positions.push(p.x,p.y,p.z);altitudes.push(h);uv.push(x,z);};
    for(let z=-48;z<48;z++)for(let x=-48;x<48;x++){add(x,z);add(x,z+1);add(x+1,z);add(x+1,z);add(x,z+1);add(x+1,z+1);}
    this.terrain.geometry.dispose();const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('altitude',new THREE.Float32BufferAttribute(altitudes,1));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    const smooth=mergeVertices(geo);smooth.computeVertexNormals();geo.dispose();this.terrain.geometry=smooth;
    (this.terrainData.image.data as Float32Array).set(w.terrain); this.terrainData.needsUpdate = true; this.terrainVersion = w.terrainVersion;
    for (const d of this.decorations.children) { const p = d.userData.point as Point | undefined; if (p) { this.locate(d,p); d.visible = walkable(w.terrain, p); } }
    const bg = this.minimapBackground; bg.width = GRID; bg.height = GRID; const ctx = bg.getContext('2d')!; const data = ctx.createImageData(GRID, GRID);
    for (let i = 0; i < w.terrain.length; i++) { const h = w.terrain[i]; const c = h < .4 ? [25, 55, 63] : h < 1.2 ? [153, 146, 106] : h > 7 ? [114, 121, 113] : [71 + h * 4, 93 + h * 3, 61 + h * 2]; data.data.set([...c, 255], i * 4); } ctx.putImageData(data, 0, 0);
  }
  makeDecorations() {
    for(const tree of this.world.trees){
      if(tree.logs<1||this.world.buildings.some(b=>distance(b,tree)<3.7))continue;
      const g=new THREE.Group();g.add(nativeModel([13,14,15,60,61,62][Math.max(0,tree.model-1)]));this.locate(g,tree);g.userData.point=tree;this.decorations.add(g);
    }
    for(const center of [HOME,ENEMY])for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2,p={x:center.x+Math.sin(a)*2.8,z:center.z+Math.cos(a)*2.8},g=new THREE.Group();
      const pillar=nativeModel(30);g.add(pillar);this.locate(g,p);g.rotateY(-a-Math.PI/2);this.decorations.add(g);
    }
  }
  makeShrines(){
    for(const shrine of this.world.shrines){
      const g=new THREE.Group();g.add(nativeModel(shrine.kind==='vault'?94:82));
      this.locate(g,shrine);this.objects.add(g);
      const label=document.createElement('button');label.className='shrine-label';label.setAttribute('aria-label',`Worship ${shrine.name}`);
      label.onclick=()=>{command(this.world,shrine);this.orderSound();this.onChange();};this.container.appendChild(label);this.shrineMeshes.set(shrine.id,{g,label});
    }
  }
  pick(event: PointerEvent): Point | null {
    const rect = this.renderer.domElement.getBoundingClientRect(); this.mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); this.ray.setFromCamera(this.mouse, this.camera);
    const intersections = this.ray.intersectObjects([this.terrain, this.water]); const p = intersections[0]?.point;
    return p ? mapPoint(p) : null;
  }
  pointerDown = ((event: PointerEvent) => { this.down = { x: event.clientX, y: event.clientY, button: event.button }; this.renderer.domElement.setPointerCapture(event.pointerId); }) as EventListener;
  pointerMove = ((event: PointerEvent) => {
    this.pointer = this.pick(event);
    if (event.buttons === 1 && event.pointerType !== 'touch' && !this.world.mode) {
      const rect = this.container.getBoundingClientRect(); Object.assign(this.dragBox.style, { display: 'block', left: `${Math.min(this.down.x, event.clientX) - rect.left}px`, top: `${Math.min(this.down.y, event.clientY) - rect.top}px`, width: `${Math.abs(event.clientX - this.down.x)}px`, height: `${Math.abs(event.clientY - this.down.y)}px` });
    }
  }) as EventListener;
  pointerUp = ((event: PointerEvent) => {
    this.dragBox.style.display = 'none'; const moved = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y);
    if (moved > 7) {
      if (event.button === 0 && event.pointerType !== 'touch' && !this.world.mode) {
        const rect = this.renderer.domElement.getBoundingClientRect(); const ids = this.world.units.filter(u => {
          if (u.team !== 'blue') return false; const v=planetPoint(u,this.y(u)+1);const p = new THREE.Vector3(v.x,v.y,v.z).project(this.camera); const x = (p.x + 1) / 2 * rect.width + rect.left, y = (-p.y + 1) / 2 * rect.height + rect.top;
          return x >= Math.min(this.down.x, event.clientX) && x <= Math.max(this.down.x, event.clientX) && y >= Math.min(this.down.y, event.clientY) && y <= Math.max(this.down.y, event.clientY);
        }).map(u => u.id); this.world.selected = event.shiftKey ? [...new Set([...this.world.selected, ...ids])] : ids; this.onChange();
      }
      return;
    }
    let p = this.pick(event); if (!p) return;
    if(!this.world.mode){const hit=this.ray.intersectObjects([...this.buildingMeshes.values()],true)[0];let object=hit?.object;while(object?.parent&&object.userData.building===undefined)object=object.parent;const b=this.world.buildings.find(b=>b.id===object?.userData.building);if(b)p={x:b.x,z:b.z};}
    if (event.button === 2) { this.world.mode = null; command(this.world, p); this.orderSound(); }
    else if (this.world.mode) {
      const mode = this.world.mode;
      const ok = SPELLS.some(s => s.id === mode) ? cast(this.world, mode as Parameters<typeof cast>[1], p) : placeBuilding(this.world, mode as Parameters<typeof placeBuilding>[1], p);
      if(!ok)this.onSound(0x25);else if(!SPELLS.some(s=>s.id===mode))this.onSound(0x24);
    } else {
      // Raycast actual unit geometry before using a ground-distance fallback.
      const hits = this.ray.intersectObjects([...this.unitMeshes.values()].filter(g=>g.visible), true); let obj = hits[0]?.object;
      while (obj?.parent && obj.userData.unit === undefined) obj = obj.parent;
      const picked = this.world.units.find(u => u.id === obj?.userData.unit && u.team === 'blue') ?? this.world.units.filter(u => u.team === 'blue' && u.inside===null && distance(u, p) < 2.1).sort((a, b) => distance(a, p) - distance(b, p))[0];
      if (picked) { this.world.selected = event.shiftKey ? this.world.selected.includes(picked.id) ? this.world.selected.filter(id => id !== picked.id) : [...this.world.selected, picked.id] : [picked.id]; this.onSound(picked.kind==='shaman'?0x18:picked.kind==='warrior'?0x43:0x58); }
      else if (this.world.selected.length) { command(this.world, p); this.orderSound(); }
    }
    this.onChange();
  }) as EventListener;
  keyDown = ((event: KeyboardEvent) => {
    if ((event.target as HTMLElement).closest('button,input,dialog,a') || event.ctrlKey || event.metaKey || event.altKey) return;
    this.keys.add(event.key.toLowerCase()); if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
  }) as EventListener;
  orientCamera(){const distance=this.camera.position.distanceTo(this.controls.target),tilt=Math.min(.55,Math.max(0,(180-distance)/70*.55));const p=mapPoint(this.camera.position);p.z=Math.max(-100,Math.min(100,p.z-tilt*PLANET_RADIUS));this.viewPoint=p;const q=planetPoint(p),n=normal(p);if(tilt>.01)this.camera.up.set(n.x,n.y,n.z);this.camera.lookAt(q.x,q.y,q.z);this.camera.up.set(0,0,-1);this.camera.updateMatrixWorld();}
  focus(p: Point = HOME) { const n=normal({x:p.x,z:p.z+.55*PLANET_RADIUS});this.camera.position.set(n.x,n.y,n.z).multiplyScalar(105).add(this.controls.target);this.controls.update();this.orientCamera(); }
  overview(){this.camera.position.set(30,155,0);this.controls.update();this.orientCamera();}
  zoom(amount: number) { const offset = this.camera.position.clone().sub(this.controls.target).multiplyScalar(amount); offset.clampLength(PLANET_RADIUS+14, PLANET_RADIUS+190); this.camera.position.copy(this.controls.target).add(offset); this.controls.update();this.orientCamera(); }
  animatePerson(body:THREE.Sprite,g:THREE.Group,heading:number,directions:{frames:number[];flip:boolean}[],age:number,once=false){
    const camera=this.camera.position.clone().sub(g.position).applyQuaternion(g.quaternion.clone().invert());
    const direction=((Math.round((heading-Math.atan2(camera.x,camera.z))/(Math.PI/4))%8)+8)%8;
    const cycle=directions[direction],step=Math.floor(age*nativeUnits.fps),index=cycle.frames[once?Math.min(step,cycle.frames.length-1):step%cycle.frames.length],cell=nativeUnits.cell;
    const frame=nativeUnits.frames[index],map=body.material.map!;
    map.repeat.set((cycle.flip?-frame.w:frame.w)/nativeUnits.width,frame.h/nativeUnits.height);
    map.offset.set((index%nativeUnits.columns*cell+(cycle.flip?frame.w:0))/nativeUnits.width,1-(Math.floor(index/nativeUnits.columns)*cell+frame.h)/nativeUnits.height);
    body.center.set(cycle.flip?1+frame.x/frame.w:-frame.x/frame.w,1+frame.y/frame.h);body.scale.set(frame.w*.065,frame.h*.065,1);
    const up=new THREE.Vector3(0,1,0).applyQuaternion(g.quaternion).transformDirection(this.camera.matrixWorldInverse);body.material.rotation=-Math.atan2(up.x,up.y);
  }
  makeFx(f: Effect) {
    const g=new THREE.Group();this.locate(g,f,f.height);
    if(f.unit){
      const map=texture('units').clone(),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,alphaTest:.5,toneMapped:false}));
      sprite.center.set(.5,.25);sprite.scale.setScalar(nativeUnits.cell*.065);g.add(sprite);g.userData.sprite=sprite;return g;
    }
    const sequence=f.sprite?.sequence??(f.kind==='blast'?'impact':f.kind==='death'?'smoke':f.kind==='bridge'?'sparkle':f.kind);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture('effects').clone(),transparent:true,depthWrite:false,toneMapped:false}));
    sprite.center.set(.5,0);g.add(sprite);g.userData.sprite=sprite;g.userData.sequence=sequence;
    if(f.kind==='blast'){const shock=ring(.2,0xe1e7ed,.08);shock.position.y=.08;g.add(shock);g.userData.shock=shock;}
    if(f.kind==='lightning'){
      const bolt=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xcce9ff,transparent:true,depthWrite:false}));g.add(bolt);g.userData.bolt=bolt;
    }
    return g;
  }
  animateFx(g:THREE.Group,f:Effect){
    const sprite=g.userData.sprite as THREE.Sprite;
    if(f.unit){const animations=(nativeUnits.animations as Record<string,Record<string,{frames:number[];flip:boolean}[]>>)[`${f.unit.team}-${f.unit.kind}`];this.animatePerson(sprite,g,f.unit.heading,animations.die,f.age,true);sprite.material.opacity=Math.min(1,(f.duration-f.age)*3);return;}
    const sequence=(nativeEffects.animations as Record<string,{index:number;w:number;h:number}[]>)[g.userData.sequence];
    const frame=sequence[Math.min(sequence.length-1,f.sprite?.sequence==='blastShot'?f.sprite.frame:Math.floor(f.age*12))],map=sprite.material.map!;
    map.repeat.set(frame.w/nativeEffects.width,frame.h/nativeEffects.height);map.offset.set(frame.index%8*256/nativeEffects.width,1-(Math.floor(frame.index/8)*256+frame.h)/nativeEffects.height);
    const scale=f.kind==='birth'||f.kind==='bridge'?.035:.065;sprite.scale.set(frame.w*scale,frame.h*scale,1);sprite.material.opacity=Math.min(1,(f.duration-f.age)*5);
    if(g.userData.shock){const shock=g.userData.shock as THREE.Mesh;shock.scale.setScalar(1+Math.min(1,f.age/.25)*25);(shock.material as THREE.MeshBasicMaterial).opacity=Math.max(0,1-f.age/.35);}
    if(g.userData.bolt){
      const bolt=g.userData.bolt as THREE.LineSegments,phase=Math.floor(f.age*24),points:number[]=[];
      if(g.userData.phase!==phase){
        g.userData.phase=phase;let last=new THREE.Vector3(0,24,0);
        for(let i=1;i<=16;i++){const next=new THREE.Vector3(i===16?0:Math.sin(i*27+phase*7)*.7,24-i*1.5,i===16?0:Math.cos(i*19+phase)*.4);points.push(...last.toArray(),...next.toArray());if(i%4===0&&i<14)points.push(...next.toArray(),next.x+Math.sin(i+phase)*2.5,next.y-2,next.z+.4);last=next;}
        bolt.geometry.dispose();bolt.geometry=new THREE.BufferGeometry();bolt.geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
      }
      bolt.visible=f.age<.65;(bolt.material as THREE.LineBasicMaterial).opacity=Math.max(0,1-f.age/.65);
    }
  }
  drawMinimap() {
    const ctx = this.mini.getContext('2d'); if (!ctx) return; const s = this.mini.width; ctx.clearRect(0, 0, s, s); ctx.drawImage(this.minimapBackground, 0, 0, s, s);
    const at = (p: Point) => [(p.x + 48) / 96 * s, (p.z + 48) / 96 * s];
    for (const b of this.world.buildings) { ctx.fillStyle = b.team === 'blue' ? '#54bffe' : '#ef8069'; const [x, z] = at(b); ctx.fillRect(x - 2, z - 2, 4, 4); }
    for (const u of this.world.units) { ctx.fillStyle = u.team === 'blue' ? '#82d5ff' : u.team === 'red' ? '#f78b74' : '#d8d5b3'; const [x, z] = at(u); ctx.beginPath(); ctx.arc(x, z, u.kind === 'shaman' ? 3 : 1.5, 0, Math.PI * 2); ctx.fill(); }
    for(const shrine of this.world.shrines){const [x,z]=at(shrine);ctx.fillStyle=shrine.active?'#f5cf86':'#777e6c';ctx.beginPath();ctx.arc(x,z,3,0,Math.PI*2);ctx.fill();}
    const [x, z] = at(this.viewPoint); ctx.strokeStyle = '#f1e0b599'; ctx.lineWidth = 1; const size = this.camera.position.distanceTo(this.controls.target) * .5; ctx.strokeRect(x - size / 2, z - size / 3, size, size * .67);
  }
  orderSound(){const units=this.world.units.filter(u=>this.world.selected.includes(u.id));if(units.length)this.onSound(units.some(u=>u.kind==='shaman')?0x19:0x37);}
  playWorldSounds(){
    for(const event of this.world.sounds)if(event.serial>this.soundSerial){
      this.soundSerial=event.serial;
      const dx=Math.round((event.x-this.viewPoint.x)*256),dz=Math.round((event.z-this.viewPoint.z)*256);
      const q=planetPoint(event,this.y(event)),screen=new THREE.Vector3(q.x,q.y,q.z).project(this.camera);
      // Native distance curve; screen pan/listener position approximate the still-unported native camera transform.
      this.onSound(event.cue,soundAttenuation(dx*dx+dz*dz),screen.x);
    }
  }
  animate = (now: number) => {
    const dt = Math.min(.1, (now - (this.previous || now)) / 1000); this.previous = now;
    tick(this.world,dt*this.world.speed);this.playWorldSounds();
    if (this.terrainVersion !== this.world.terrainVersion) { this.rebuildTerrain(); this.releaseGroup(this.decorations); this.decorations.clear(); this.makeDecorations(); }
    const trees=this.world.trees.map(t=>t.logs>=1?'1':'0').join('');if(trees!==this.treeSignature){this.treeSignature=trees;this.releaseGroup(this.decorations);this.decorations.clear();this.makeDecorations();}
    const movingX = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft'));
    const movingZ = Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'));
    if (movingX || movingZ) {
      const rotation=new THREE.Quaternion().setFromUnitVectors(this.camera.up,new THREE.Vector3(0,1,0));const offset=this.camera.position.clone().sub(this.controls.target).applyQuaternion(rotation),spherical=new THREE.Spherical().setFromVector3(offset);
      spherical.theta-=movingX*dt*.5;spherical.phi=Math.max(.03,Math.min(Math.PI-.03,spherical.phi+movingZ*dt*.5));
      this.camera.position.setFromSpherical(spherical).applyQuaternion(rotation.invert()).add(this.controls.target);
    }
    this.controls.update();this.orientCamera();
    for (const [id, g] of this.unitMeshes) if (!this.world.units.some(u => u.id === id)) { this.objects.remove(g); this.releaseGroup(g); this.unitMeshes.delete(id); }
    for (const u of this.world.units) {
      let g = this.unitMeshes.get(u.id);
      if (g && g.userData.signature !== `${u.team}-${u.kind}`) { this.objects.remove(g); this.releaseGroup(g); this.unitMeshes.delete(u.id); g = undefined; }
      if (!g) { g = makeUnit(u); this.unitMeshes.set(u.id, g); this.objects.add(g); }
      this.locate(g,u);const n=normal(u);g.position.addScaledVector(new THREE.Vector3(n.x,n.y,n.z),.04+Math.sin(u.lift*Math.PI)*2); g.visible=u.inside===null;
      const body=g.userData.sprite as THREE.Sprite;
      const animations=(nativeUnits.animations as Record<string,Record<string,{frames:number[];flip:boolean}[]>>)[g.userData.signature];
      const state=unitAnimation(this.world,u);
      if(g.userData.state!==state){g.userData.state=state;g.userData.since=this.world.time;}
      this.animatePerson(body,g,u.heading,animations[state]??animations.idle,this.world.time-(u.fight?u.fight.started/12:g.userData.since),!!u.fight&&['attack','strike','special','recoil'].includes(u.fight.action));
      g.userData.selection.visible=this.world.selected.includes(u.id);
      g.userData.health.visible = u.hp < maxHp(u.kind) || this.world.selected.includes(u.id);
      g.userData.health.quaternion.copy(g.quaternion.clone().invert().multiply(this.camera.quaternion)); g.userData.healthFill.scale.x = Math.max(.001, u.hp / maxHp(u.kind));
    }
    for (const [id, g] of this.buildingMeshes) if (!this.world.buildings.some(b => b.id === id)) { this.objects.remove(g); this.releaseGroup(g); this.buildingMeshes.delete(id);this.buildingLabels.get(id)?.remove();this.buildingLabels.delete(id); }
    for (const b of this.world.buildings) {
      let g = this.buildingMeshes.get(b.id);if(g&&g.userData.signature!==b.level){this.objects.remove(g);this.releaseGroup(g);this.buildingMeshes.delete(b.id);g=undefined;} if (!g) { g = makeBuilding(b); this.buildingMeshes.set(b.id, g); this.objects.add(g); if (b.progress < 1) { this.releaseGroup(this.decorations); this.decorations.clear(); this.makeDecorations(); } }
      this.locate(g,b,b.foundation);g.rotateY(-b.angle);g.userData.scaffold.visible=b.progress<1;for(const child of g.userData.architecture)child.visible=b.progress>.35; g.userData.health.visible = b.hp < buildingHp(b.kind) || b.progress < 1; g.userData.health.quaternion.copy(g.quaternion.clone().invert().multiply(this.camera.quaternion)); g.userData.healthFill.scale.x = b.progress < 1 ? Math.max(.01, b.progress) : Math.max(.001, b.hp / buildingHp(b.kind));
      if(b.team==='blue'&&(b.kind==='camp'||b.progress<1)){
        let label=this.buildingLabels.get(b.id);if(!label){label=document.createElement('button');label.className='shrine-label building-label';label.onclick=()=>{command(this.world,b);this.onChange();};this.container.appendChild(label);this.buildingLabels.set(b.id,label);}
        const name=b.kind==='camp'?'Warrior Training Hut':'Hut',q=planetPoint(b,b.foundation+5),p=new THREE.Vector3(q.x,q.y,q.z).project(this.camera),n=normal(b);
        label.hidden=p.z>1||this.camera.position.clone().sub(new THREE.Vector3(q.x,q.y,q.z)).dot(new THREE.Vector3(n.x,n.y,n.z))<=0;
        label.style.left=`${(p.x+1)*this.container.clientWidth/2}px`;label.style.top=`${(1-p.y)*this.container.clientHeight/2}px`;
        label.setAttribute('aria-label',`${name}: ${b.progress===1?'ready':'under construction'}`);
        const trainees=this.world.units.filter(u=>u.work===b.id&&u.kind==='brave').length;
        label.textContent=b.progress<1?`⌂ ${b.logs}/${b.kind==='camp'?8:3} LOGS · ${Math.floor(b.progress*100)}% BUILT`:`⚔ ${trainees?trainees+' TRAINING':'TRAIN WARRIORS'}`;
      }else if(this.buildingLabels.has(b.id)){this.buildingLabels.get(b.id)!.remove();this.buildingLabels.delete(b.id);}

    }
    for (const [id, g] of this.fxMeshes) if (!this.world.effects.some(f => f.id === id)) { this.scene.remove(g); this.releaseGroup(g); this.fxMeshes.delete(id); }
    for (const f of this.world.effects) {
      let g = this.fxMeshes.get(f.id); if (!g) { g = this.makeFx(f); this.fxMeshes.set(f.id, g); this.scene.add(g); }
      this.locate(g,f,f.height);this.animateFx(g,f);
    }
    for(const shrine of this.world.shrines){const entry=this.shrineMeshes.get(shrine.id)!;this.locate(entry.g,shrine);entry.g.visible=shrine.active||shrine.kind==='vault';
      const q=planetPoint(shrine,this.y(shrine)+4.5),p=new THREE.Vector3(q.x,q.y,q.z).project(this.camera),n=normal(shrine),view=this.camera.position.clone().sub(new THREE.Vector3(q.x,q.y,q.z));
      entry.label.hidden=!entry.g.visible||p.z>1||view.dot(new THREE.Vector3(n.x,n.y,n.z))<=0;
      entry.label.style.left=`${(p.x+1)*this.container.clientWidth/2}px`;entry.label.style.top=`${(1-p.y)*this.container.clientHeight/2}px`;
      entry.label.textContent=`${shrine.kind==='vault'?'◈ WARRIOR KNOWLEDGE':shrine.kind==='bridge'?'≋ LAND BRIDGE':'ϟ LIGHTNING'} · ${shrine.active?shrine.progress>0?Math.floor(shrine.progress*100)+'%':shrine.kind==='lightning'?4-shrine.uses+' gifts':'WORSHIP':'DISCOVERED'}`;
    }
    const shaman = this.world.units.find(u => u.team === 'blue' && u.kind === 'shaman');
    this.range.visible = !!this.world.mode && SPELLS.some(s => s.id === this.world.mode) && !!shaman;
    const spec=SPELLS.find(s=>s.id===this.world.mode);
    if(shaman&&spec&&this.range.visible)this.groundRing(this.range,shaman,spec.range);
    this.cursor.visible=!!this.pointer&&!!this.world.mode;
    if(this.pointer&&this.world.mode){const p=this.pointer;this.groundRing(this.cursor,p,spec?2:footprint(this.world.mode as Building['kind']));const valid=spec?!!shaman&&distance(shaman,p)<=spec.range&&!(!walkable(this.world.terrain,p)&&spec.id==='bridge'):!placementError(this.world,this.world.mode as Building['kind'],p);this.cursor.material.color.setHex(valid?0xebd398:0xec6e59);}
    (this.water.material as THREE.ShaderMaterial).uniforms.time.value = this.world.time;
    this.renderer.render(this.scene, this.camera);
    this.uiTimer += dt; if (this.uiTimer > .2) { this.onChange(); this.drawMinimap(); this.uiTimer = 0; }
    this.frame = requestAnimationFrame(this.animate);
  };
  releaseGroup(g: THREE.Object3D) { const materials = new Set<THREE.Material>(); g.traverse(o => { if(o instanceof THREE.Sprite){o.material.map?.dispose();materials.add(o.material);} if (o instanceof THREE.Mesh || o instanceof THREE.Line) { if (![...meshes.values()].includes(o.geometry)) o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); } }); materials.forEach(m => m.dispose()); }
  dispose() { cancelAnimationFrame(this.frame); this.resize.disconnect(); this.disposeListeners.forEach(f => f()); this.controls.dispose(); this.releaseGroup(this.scene); this.terrainData.dispose(); this.renderer.dispose(); this.renderer.domElement.remove(); this.dragBox.remove();this.shrineMeshes.forEach(s=>s.label.remove());this.buildingLabels.forEach(label=>label.remove()); }
}
