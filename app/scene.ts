import { soundAttenuation } from './audio';
import {stepFlyby,interruptFlyby,type FlybyCamera} from './flyby.ts';
import {createTooltip,showObjectTooltip,stepTooltip,forcedTooltipObject,worldTooltipObject,tooltipPalette} from './tooltips.ts';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildingObject, GRID, SIZE, HOME, ENEMY, PLANET_RADIUS, terrainCross, footprint, placementError, height, walkable, distance, maxHp, buildingHp, cast, command, placeBuilding, SPELLS, tick, type World, type Point, type Unit, type Building, type Effect, unitAnimation } from './model';

import nativeModelData from './original-models.json';
const nativeModels: Record<number,{p:number[];uv:number[];scale:number}> = nativeModelData;
import {morphCoordinate} from './morph.ts';
import {spriteDirection,spriteCoordinate} from './projection.ts';
import {RenderView} from './render-view.ts';
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
  const data=nativeModels[id];
  const geo=geometry(`original-${id}`,()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));g.computeVertexNormals();return g;});
  const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:texture('atlas'),side:THREE.DoubleSide,alphaTest:.5}));
  mesh.scale.setScalar(scale);mesh.userData.nativeModel=id;mesh.userData.nativeScale=data.scale;return mesh;
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
  const g=new THREE.Group(),id=buildingObject(b);
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
  view = new RenderView();
  skyDome:THREE.Mesh|null=null;
  overviewActive = false;
  viewZoom = 0;
  dragLast = {x:0,y:0};
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, .2, 1000);
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  terrain: THREE.InstancedMesh;
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
  pointer: Point | null = null;
  viewPoint: Point = HOME;
  flybyCamera: FlybyCamera = {x: 17 * 256, y: -41 * 256, angle: 0, zoom: 0};
  cameraBearing = 0;
  flybyTime = 0;
  wasFlying = false;
  tooltip = createTooltip();
  tooltipElement = document.createElement('div');
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
    this.renderer.shadowMap.enabled = false; this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping; this.renderer.toneMappingExposure = 1;
    this.renderer.setClearColor(0x172c36, 0);
    this.renderer.domElement.setAttribute('aria-label', 'Island battlefield. Click to select, right-click to move, drag to select a group.');
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);
    this.tooltipElement.className = 'native-tooltip';
    this.tooltipElement.setAttribute('role','tooltip');
    this.tooltipElement.style.backgroundColor = `rgb(${tooltipPalette.background.join(',')})`;
    this.tooltipElement.style.color = `rgb(${tooltipPalette.foreground.join(',')})`;
    this.tooltipElement.hidden = true; container.appendChild(this.tooltipElement);
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
    this.terrain = new THREE.InstancedMesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      uniforms:{colours:{value:texture('land-colours')},detail:{value:texture('land-detail')}},
      vertexShader:`attribute float altitude; varying vec2 land; varying float h; varying vec3 norm; void main(){land=uv;h=altitude;norm=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform sampler2D colours;uniform sampler2D detail;varying vec2 land;varying float h;varying vec3 norm;
      void main(){float grain=texture2D(detail,land/16.).r*255.-128.;float shade=64.+grain*.20+(dot(normalize(norm),normalize(vec3(-.5,1.,.4)))-.75)*42.;
      float level=clamp(h*45.+140.+smoothstep(0.,1.,h)*150.+grain*.22,0.,1151.);
      gl_FragColor=texture2D(colours,vec2(clamp(shade,1.,254.)/256.,1.-(level+.5)/1152.));
      #include <colorspace_fragment>
      }`
    }),9);
    const tiles=[[0,0],...[-256,0,256].flatMap(x=>[-256,0,256].filter(z=>x!==0||z!==0).map(z=>[x,z]))];
    tiles.forEach(([x,z],i)=>this.terrain.setMatrixAt(i,new THREE.Matrix4().makeTranslation(x,0,z)));
    this.terrain.userData.nativeRelative=true;this.terrain.receiveShadow = true; this.terrain.castShadow = true; this.scene.add(this.terrain);
    const waterGeo = geometry('ground-water',()=>new THREE.PlaneGeometry(252,252,126,126).rotateX(-Math.PI/2));
    this.water = new THREE.Mesh(waterGeo, new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, heights: { value: this.terrainData }, detail:{value:texture('land-detail')},colours:{value:texture('land-colours')} },
      vertexShader: `varying vec3 vPos; uniform float time; void main() { vec3 p=position; p.y=.06+sin(p.x*.5+time)*cos(p.z*.4+time*.7)*.012; vPos=(modelMatrix*vec4(p,1.)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `varying vec3 vPos; uniform float time; uniform sampler2D heights; uniform sampler2D detail; uniform sampler2D colours; void main(){
        vec2 map=mod(vPos.xz+128.,256.)-128.;
        vec2 grid=map+48.,base=floor(grid),f=fract(grid);float h=-3.;
        if(all(greaterThanEqual(grid,vec2(0.)))&&all(lessThan(grid,vec2(96.)))){
          float a=texture2D(heights,(base+.5)/97.).r,b=texture2D(heights,(base+vec2(1.5,.5))/97.).r,c=texture2D(heights,(base+vec2(.5,1.5))/97.).r,d=texture2D(heights,(base+1.5)/97.).r;
          vec4 corners=floor(vec4(a,b,c,d)*45.+.5);float mean=floor(dot(corners,vec4(.25)));vec4 delta=abs(corners-mean);
          bool cross=max(delta.x,delta.w)>max(delta.y,delta.z);
          h=cross?(f.x+f.y<=1.?a+f.x*(b-a)+f.y*(c-a):d+(1.-f.x)*(c-d)+(1.-f.y)*(b-d)):(f.y<f.x?a+f.x*(b-a)+f.y*(d-b):a+f.x*(d-c)+f.y*(c-a));
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
    })); this.water.userData.nativeRelative=true;this.water.position.y=0;this.scene.add(this.water);
    this.scene.add(this.objects, this.decorations, this.cursor, this.range); this.cursor.visible = false; this.range.visible = false;
    this.rebuildTerrain(); this.makeDecorations(); this.makeShrines(); this.focus({x:2,z:30});this.drawMinimap();
    this.dragBox = document.createElement('div'); this.dragBox.className = 'selection-box'; container.appendChild(this.dragBox);
    this.resize = new ResizeObserver(() => this.setSize()); this.resize.observe(container); this.setSize();
    this.listen(this.renderer.domElement, 'pointerdown', this.pointerDown);
    this.listen(this.renderer.domElement, 'pointermove', this.pointerMove);
    this.listen(this.renderer.domElement, 'pointerup', this.pointerUp);
    this.listen(this.renderer.domElement, 'contextmenu', e => e.preventDefault());
    this.listen(this.renderer.domElement,'wheel',e=>{if(!this.overviewActive&&!this.world.inputMask){e.preventDefault();this.zoom(Math.exp((e as WheelEvent).deltaY*.001));}});
    this.listen(window, 'keydown', this.keyDown); this.listen(window, 'keyup', e => this.keys.delete((e as KeyboardEvent).key.toLowerCase()));
    this.listen(window, 'blur', () => { this.keys.clear(); this.world.paused = true; this.onChange(); });
    this.listen(minimap, 'pointerdown', e => { if(this.world.inputMask)return; const p = e as PointerEvent, rect = minimap.getBoundingClientRect(); this.focus({ x: (p.clientX - rect.left) / rect.width * SIZE - 48, z: (p.clientY - rect.top) / rect.height * SIZE - 48 }); });
    this.frame = requestAnimationFrame(this.animate);
  }
  makeSky(){
    const loader=new THREE.TextureLoader();
    const sky=loader.load('/original/sky.png');sky.colorSpace=THREE.SRGBColorSpace;this.scene.background=sky;
    const clouds=loader.load('/original/clouds.png');clouds.colorSpace=THREE.SRGBColorSpace;clouds.wrapS=clouds.wrapT=THREE.RepeatWrapping;
    const dome=new THREE.Mesh(new THREE.SphereGeometry(350,48,24),new THREE.MeshBasicMaterial({map:clouds,side:THREE.BackSide,transparent:true,depthWrite:false,fog:false,opacity:.72}));
    clouds.repeat.set(4,2);this.skyDome=dome;dome.userData.nativeIgnore=true;dome.position.y=-PLANET_RADIUS;this.scene.add(dome);
  }
  listen(target: EventTarget, name: string, handler: EventListener) { target.addEventListener(name, handler); this.disposeListeners.push(() => target.removeEventListener(name, handler)); }
  setSize() { const { width, height } = this.container.getBoundingClientRect(); this.renderer.setSize(width, height); this.camera.aspect = width / Math.max(1, height); this.camera.updateProjectionMatrix();this.updateView(); }
  y(p: Point) { return height(this.world.terrain,p.x,p.z); }
  locate(g:THREE.Object3D,p:Point,h=this.y(p)){g.position.set(p.x,Math.round(h*45)/128,p.z);g.quaternion.identity();g.userData.nativeHeading=0;}
  orientModel(g:THREE.Group,angle:number){g.rotation.y=-angle;g.userData.nativeHeading=Math.round(angle*1024/Math.PI)&2047;}
  updateView(){this.view.update(this.container.clientWidth,this.container.clientHeight,this.viewPoint,this.cameraBearing,this.viewZoom,this.overviewActive,document.documentElement.clientWidth);}
  screen(p:Point,h=this.y(p)){return this.view.screen(new THREE.Vector3(p.x,h*45/128,p.z),this.camera);}
  visible(p:Point,h=this.y(p)){
    const q=this.screen(p,h);if(q.z< -1||q.z>1)return false;
    if(!this.overviewActive)return this.view.visible(p);
    const a=p.x*Math.PI/128,b=p.z*Math.PI/256,n=new THREE.Vector3(Math.sin(a)*Math.cos(b),Math.cos(a)*Math.cos(b),Math.sin(b));
    return n.dot(this.camera.position.clone().add(new THREE.Vector3(0,70,0)))>70+h;
  }
  groundRing(mesh:THREE.Mesh,p:Point,radius:number){const pos=mesh.geometry.attributes.position;for(let i=0;i<pos.count;i++){const a=i%65/64*Math.PI*2,r=i<65?radius-.1:radius;const q={x:p.x+Math.cos(a)*r,z:p.z+Math.sin(a)*r};const v={x:q.x,y:(Math.max(0,height(this.world.terrain,q.x,q.z))+.16)*45/128,z:q.z};pos.setXYZ(i,v.x,v.y,v.z);}pos.needsUpdate=true;mesh.geometry.computeBoundingSphere();}

  rebuildTerrain() {
    const w=this.world,positions:number[]=[],altitudes:number[]=[],uv:number[]=[];
    const add=(x:number,z:number)=>{const h=w.terrain[(z+48)*GRID+x+48],p={x,y:Math.round(h*45)/128,z};positions.push(p.x,p.y,p.z);altitudes.push(h);uv.push(x,z);};
    for(let z=-48;z<48;z++)for(let x=-48;x<48;x++){
      const i=(z+48)*GRID+x+48,t=w.terrain;
      if(terrainCross(t[i],t[i+1],t[i+GRID],t[i+GRID+1])){add(x,z);add(x,z+1);add(x+1,z);add(x+1,z);add(x,z+1);add(x+1,z+1);}
      else{add(x,z);add(x+1,z+1);add(x+1,z);add(x,z);add(x,z+1);add(x+1,z+1);}
    }
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
      const g=new THREE.Group();g.add(nativeModel([13,14,15,16,17,18][Math.max(0,tree.model-1)]));this.locate(g,tree);g.userData.point=tree;this.decorations.add(g);
    }
    for(const center of [HOME,ENEMY])for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2,p={x:center.x+Math.sin(a)*2.8,z:center.z+Math.cos(a)*2.8},g=new THREE.Group();
      const pillar=nativeModel(30);g.add(pillar);this.locate(g,p);this.orientModel(g,a+Math.PI/2);this.decorations.add(g);
    }
  }
  makeShrines(){
    for(const shrine of this.world.shrines){
      const g=new THREE.Group();g.add(nativeModel(shrine.model));
      this.locate(g,shrine);this.orientModel(g,shrine.angle);this.objects.add(g);
      const label=document.createElement('button');label.className='shrine-label';label.setAttribute('aria-label',`Worship ${shrine.name}`);
      label.onclick=()=>{command(this.world,shrine);this.orderSound();this.onChange();};this.container.appendChild(label);this.shrineMeshes.set(shrine.id,{g,label});
    }
  }
  pick(event: PointerEvent): Point | null {
    const rect=this.renderer.domElement.getBoundingClientRect();this.mouse.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
    return this.view.pick(this.mouse,[this.terrain,this.water],this.camera)?.point??null;
  }
  pointerDown = ((event: PointerEvent) => { this.down = { x: event.clientX, y: event.clientY, button: event.button };this.dragLast={x:event.clientX,y:event.clientY}; this.renderer.domElement.setPointerCapture(event.pointerId); }) as EventListener;
  pointerMove = ((event: PointerEvent) => {
    if(!this.world.inputMask&&!this.overviewActive&&(event.buttons===2||event.buttons===4)){
      const dx=event.clientX-this.dragLast.x,dy=event.clientY-this.dragLast.y;
      if(event.buttons===2){this.cameraBearing+=dx*.008;this.pan(0,dy*.06);}else this.pan(-dx*.06,-dy*.06);
      this.dragLast={x:event.clientX,y:event.clientY};this.updateView();
    }
    this.pointer = this.world.mode?this.pick(event):null;
    if (event.buttons === 1 && event.pointerType !== 'touch' && !this.world.mode) {
      const rect = this.container.getBoundingClientRect(); Object.assign(this.dragBox.style, { display: 'block', left: `${Math.min(this.down.x, event.clientX) - rect.left}px`, top: `${Math.min(this.down.y, event.clientY) - rect.top}px`, width: `${Math.abs(event.clientX - this.down.x)}px`, height: `${Math.abs(event.clientY - this.down.y)}px` });
    }
  }) as EventListener;
  pointerUp = ((event: PointerEvent) => {
    if (this.world.inputMask) return;
    this.dragBox.style.display = 'none'; const moved = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y);
    if (moved > 7) {
      if (event.button === 0 && event.pointerType !== 'touch' && !this.world.mode) {
        const rect = this.renderer.domElement.getBoundingClientRect(); const ids = this.world.units.filter(u => {
          if (u.team !== 'blue') return false; const p = this.screen(u,this.y(u)+1); const x = (p.x + 1) / 2 * rect.width + rect.left, y = (-p.y + 1) / 2 * rect.height + rect.top;
          return x >= Math.min(this.down.x, event.clientX) && x <= Math.max(this.down.x, event.clientX) && y >= Math.min(this.down.y, event.clientY) && y <= Math.max(this.down.y, event.clientY);
        }).map(u => u.id); this.world.selected = event.shiftKey ? [...new Set([...this.world.selected, ...ids])] : ids; this.onChange();
      }
      return;
    }
    let p = this.pick(event); if (!p) return;
    if(!this.world.mode){const hit=this.view.pick(this.mouse,[...this.buildingMeshes.values()],this.camera);let object=hit?.object;while(object?.parent&&object.userData.building===undefined)object=object.parent;const b=this.world.buildings.find(b=>b.id===object?.userData.building);if(b)p={x:b.x,z:b.z};}
    if (event.button === 2) { this.world.mode = null; command(this.world, p); this.orderSound(); }
    else if (this.world.mode) {
      const mode = this.world.mode;
      const ok = SPELLS.some(s => s.id === mode) ? cast(this.world, mode as Parameters<typeof cast>[1], p) : placeBuilding(this.world, mode as Parameters<typeof placeBuilding>[1], p);
      if(!ok)this.onSound(0x25);else if(!SPELLS.some(s=>s.id===mode))this.onSound(0x24);
    } else {
      // Sprite dimensions are screen pixels in the native renderer.
      const rect=this.renderer.domElement.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
      const picked=this.world.units.filter(u=>u.team==='blue'&&u.inside===null&&this.visible(u)).find(u=>{
        const body=this.unitMeshes.get(u.id)?.userData.sprite as THREE.Sprite|undefined;if(!body)return false;
        const q=this.screen(u),px=(q.x+1)*rect.width/2,py=(1-q.y)*rect.height/2;
        return x>=px-body.center.x*body.scale.x&&x<=px+(1-body.center.x)*body.scale.x&&y>=py-(1-body.center.y)*body.scale.y&&y<=py+body.center.y*body.scale.y;
      })??this.world.units.filter(u=>u.team==='blue'&&u.inside===null&&distance(u,p)<2.1).sort((a,b)=>distance(a,p)-distance(b,p))[0];
      if (picked) { this.world.selected = event.shiftKey ? this.world.selected.includes(picked.id) ? this.world.selected.filter(id => id !== picked.id) : [...this.world.selected, picked.id] : [picked.id]; this.onSound(picked.kind==='shaman'?0x18:picked.kind==='warrior'?0x43:0x58); }
      else if (this.world.selected.length) { command(this.world, p); this.orderSound(); }
    }
    this.onChange();
  }) as EventListener;
  keyDown = ((event: KeyboardEvent) => {
    if (this.world.inputMask) return;
    if ((event.target as HTMLElement).closest('button,input,dialog,a') || event.ctrlKey || event.metaKey || event.altKey) return;
    this.keys.add(event.key.toLowerCase()); if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
  }) as EventListener;
  orientCamera(){if(this.overviewActive){this.camera.lookAt(this.controls.target);this.camera.updateMatrixWorld();}this.updateView();}
  pan(x:number,z:number){const a=this.cameraBearing;this.viewPoint={x:this.viewPoint.x+x*Math.cos(a)+z*Math.sin(a),z:this.viewPoint.z+z*Math.cos(a)-x*Math.sin(a)};for(const key of ['x','z'] as const)this.viewPoint[key]=((this.viewPoint[key]+128)%256+256)%256-128;}
  skipIntroduction() { interruptFlyby(this.world.flyby, this.flybyCamera); if (!(this.world.flyby.flags & 1)) this.world.inputMask &= ~64; this.onChange(); }
  updateFlyby(dt: number) {
    const state = this.world.flyby, active = !!(state.flags & 1);
    this.controls.enabled = this.overviewActive&&!this.world.inputMask;
    if (active && !this.wasFlying) {
      this.flybyCamera = {x: Math.round((this.viewPoint.x + 8) * 256), y: Math.round((-this.viewPoint.z - 8) * 256), angle: 0, zoom: 0};
      this.flybyTime = 0; this.keys.clear();
    }
    // ponytail: a 24 Hz presentation clock drives the recovered native timeline;
    // original frame throttling remains unported.
    if (!this.world.paused) {
      this.flybyTime += dt;
      while (this.flybyTime >= 1 / 24) {
        for (const event of stepFlyby(state, this.flybyCamera, 24)) {
          if (event.kind === 5) showObjectTooltip(this.tooltip,forcedTooltipObject(this.world,event.flags,event.value),event.duration);
        }
        // Native render_land_ui consumes the request before the next frame.
        this.tooltip.draw = 0;
        stepTooltip(this.tooltip,!!worldTooltipObject(this.world,this.tooltip.target),24);
        this.flybyTime -= 1 / 24;
      }
    }
    if (!active && !this.wasFlying) return false;
    const c = this.flybyCamera;
    const p = {x: c.x / 256 - 8, z: -c.y / 256 - 8};
    this.overviewActive=false;this.cameraBearing=c.angle*Math.PI/1024;this.viewZoom=c.zoom;this.viewPoint=p;this.updateView();
    this.wasFlying = !!(state.flags & 1);
    if (!this.wasFlying) {
      this.world.inputMask &= ~64;
      this.camera.up.set(0,0,-1);
      this.controls.enabled = this.overviewActive&&!this.world.inputMask;
    }
    return true;
  }
  renderTooltip() {
    const object = worldTooltipObject(this.world,this.tooltip.target);
    const element = this.tooltipElement;
    element.hidden = !this.tooltip.draw || !this.tooltip.text || !object;
    if (element.hidden || !object) return;
    const p=this.screen(object,this.y(object)+(object.type===1?128:512)/45);
    if(!this.visible(object)){element.hidden=true;return;}
    element.textContent = this.tooltip.text;
    const {width,height} = this.container.getBoundingClientRect();
    element.style.left = `${Math.max(4,Math.min(width-element.offsetWidth-4,(p.x+1)*width/2))}px`;
    element.style.top = `${Math.max(4,Math.min(height-element.offsetHeight-4,(1-p.y)*height/2))}px`;
  }
  focus(p:Point=HOME){this.overviewActive=false;this.controls.enabled=false;this.cameraBearing=0;this.viewZoom=0;this.viewPoint={...p};this.updateView();}
  overview(){this.overviewActive=true;this.controls.enabled=!this.world.inputMask;this.camera.position.set(30,155,0);this.controls.update();this.orientCamera();}
  zoom(amount:number){if(this.overviewActive){const offset=this.camera.position.clone().sub(this.controls.target).multiplyScalar(amount).clampLength(PLANET_RADIUS+14,PLANET_RADIUS+190);this.camera.position.copy(this.controls.target).add(offset);this.controls.update();}else this.viewZoom=Math.max(-16384,Math.min(16384,this.viewZoom+(amount-1)*32768));this.updateView();}
  animatePerson(body:THREE.Sprite,g:THREE.Group,heading:number,directions:{frames:number[];flip:boolean}[],age:number,once=false){
    const direction=spriteDirection(Math.round(this.cameraBearing*1024/Math.PI),Math.round((Math.PI-heading)*1024/Math.PI));
    const cycle=directions[direction],step=Math.floor(age*nativeUnits.fps),index=cycle.frames[once?Math.min(step,cycle.frames.length-1):step%cycle.frames.length],cell=nativeUnits.cell;
    const frame=nativeUnits.frames[index],map=body.material.map!;
    map.repeat.set((cycle.flip?-frame.w:frame.w)/nativeUnits.width,frame.h/nativeUnits.height);
    map.offset.set((index%nativeUnits.columns*cell+(cycle.flip?frame.w:0))/nativeUnits.width,1-(Math.floor(index/nativeUnits.columns)*cell+frame.h)/nativeUnits.height);
    body.center.set(cycle.flip?1+frame.x/frame.w:-frame.x/frame.w,1+frame.y/frame.h);const shaman=g.userData.signature?.endsWith('shaman')||g.userData.shaman,flags=this.view.config.scaledSprites?0x100:0;
    const size=(n:number)=>shaman||flags?spriteCoordinate(n,shaman?-1:1,flags,this.view.config):n;
    body.scale.set(Math.max(1,size(frame.w)),Math.max(1,size(frame.h)),1);
    body.material.rotation=0;
  }
  makeFx(f: Effect) {
    const g=new THREE.Group();this.locate(g,f,f.height);
    if(f.unit){
      const map=texture('units').clone(),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,alphaTest:.5,toneMapped:false}));
      sprite.center.set(.5,.25);sprite.scale.setScalar(nativeUnits.cell);g.add(sprite);g.userData.sprite=sprite;g.userData.shaman=f.unit.kind==='shaman';return g;
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
    sprite.scale.set(frame.w,frame.h,1);sprite.material.opacity=Math.min(1,(f.duration-f.age)*5);
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
      if(event.cue===0xe3){this.onSound(event.cue,1,0);continue;} // Native notification cue is not positional.
      const dx=Math.round((event.x-this.viewPoint.x)*256),dz=Math.round((event.z-this.viewPoint.z)*256);
      const screen=this.screen(event);
      // Native distance curve and projected pan; the full native mixer is still unported.
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
    if(!this.world.inputMask&&!this.overviewActive){this.pan(movingX*dt*20,movingZ*dt*20);this.cameraBearing+=(Number(this.keys.has('e'))-Number(this.keys.has('q')))*dt;}
    if(!this.updateFlyby(dt)){if(this.overviewActive)this.controls.update();this.orientCamera();}
    this.renderTooltip();
    for (const [id, g] of this.unitMeshes) if (!this.world.units.some(u => u.id === id)) { this.objects.remove(g); this.releaseGroup(g); this.unitMeshes.delete(id); }
    for (const u of this.world.units) {
      let g = this.unitMeshes.get(u.id);
      if (g && g.userData.signature !== `${u.team}-${u.kind}`) { this.objects.remove(g); this.releaseGroup(g); this.unitMeshes.delete(u.id); g = undefined; }
      if (!g) { g = makeUnit(u); this.unitMeshes.set(u.id, g); this.objects.add(g); }
      this.locate(g,u);g.position.y+=(.04+Math.sin(u.lift*Math.PI)*2)*45/128; g.visible=u.inside===null;
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
      this.locate(g,b,b.foundation);this.orientModel(g,b.angle);g.userData.scaffold.visible=b.progress<1;for(const child of g.userData.architecture)child.visible=b.progress>.35; g.userData.health.visible = b.hp < buildingHp(b.kind) || b.progress < 1; g.userData.health.quaternion.copy(g.quaternion.clone().invert().multiply(this.camera.quaternion)); g.userData.healthFill.scale.x = b.progress < 1 ? Math.max(.01, b.progress) : Math.max(.001, b.hp / buildingHp(b.kind));
      if(b.team==='blue'&&(b.kind==='camp'||b.progress<1)){
        let label=this.buildingLabels.get(b.id);if(!label){label=document.createElement('button');label.className='shrine-label building-label';label.onclick=()=>{command(this.world,b);this.onChange();};this.container.appendChild(label);this.buildingLabels.set(b.id,label);}
        const name=b.kind==='camp'?'Warrior Training Hut':'Hut',p=this.screen(b,b.foundation+5);
        label.hidden=!this.visible(b);
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
    for(const [id,entry] of this.shrineMeshes)if(!this.world.shrines.some(s=>s.id===id)){this.objects.remove(entry.g);this.releaseGroup(entry.g);entry.label.remove();this.shrineMeshes.delete(id);}
    for(const shrine of this.world.shrines){const entry=this.shrineMeshes.get(shrine.id)!;this.locate(entry.g,shrine);this.orientModel(entry.g,shrine.angle);
      let mesh=entry.g.children[0] as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;
      if(mesh.userData.nativeModel!==shrine.model){
        entry.g.remove(mesh);if(mesh.userData.morph)mesh.geometry.dispose();mesh.material.dispose();
        mesh=nativeModel(shrine.model);entry.g.add(mesh);
      }
      if(shrine.morph){
        const morph=shrine.morph,frame=Math.min(morph.duration,Math.max(0,this.world.turn-morph.started+1));
        if(!mesh.userData.morph){mesh.geometry=mesh.geometry.clone();mesh.userData.morph=true;}
        if(mesh.userData.morphFrame!==frame||mesh.userData.morphStart!==morph.started){
          const from=nativeModels[morph.from],to=nativeModels[morph.to];
          const position=mesh.geometry.getAttribute('position') as THREE.BufferAttribute,scale=from.scale*3;
          for(let i=0;i<position.array.length;i++)position.array[i]=morphCoordinate(Math.round(from.p[i]*scale),Math.round(to.p[i]*scale),frame,morph.duration)/scale;
          position.needsUpdate=true;mesh.geometry.computeBoundingSphere();
          mesh.userData.morphFrame=frame;mesh.userData.morphStart=morph.started;
        }
      }
      entry.g.visible=shrine.active||shrine.kind==='vault';
      const p=this.screen(shrine,this.y(shrine)+4.5);
      entry.label.hidden=!entry.g.visible||!this.visible(shrine);
      entry.label.style.left=`${(p.x+1)*this.container.clientWidth/2}px`;entry.label.style.top=`${(1-p.y)*this.container.clientHeight/2}px`;
      entry.label.textContent=`${shrine.kind==='vault'?'◈ WARRIOR KNOWLEDGE':shrine.kind==='bridge'?'≋ LAND BRIDGE':'ϟ LIGHTNING'} · ${shrine.active?shrine.progress>0?Math.floor(shrine.progress*100)+'%':shrine.kind==='lightning'?shrine.remaining+' gifts':'WORSHIP':'DISCOVERED'}`;
    }
    const shaman = this.world.units.find(u => u.team === 'blue' && u.kind === 'shaman');
    this.range.visible = !!this.world.mode && SPELLS.some(s => s.id === this.world.mode) && !!shaman;
    const spec=SPELLS.find(s=>s.id===this.world.mode);
    if(shaman&&spec&&this.range.visible)this.groundRing(this.range,shaman,spec.range);
    this.cursor.visible=!!this.pointer&&!!this.world.mode;
    if(this.pointer&&this.world.mode){const p=this.pointer;this.groundRing(this.cursor,p,spec?2:footprint(this.world.mode as Building['kind']));const valid=spec?!!shaman&&distance(shaman,p)<=spec.range&&!(!walkable(this.world.terrain,p)&&spec.id==='bridge'):!placementError(this.world,this.world.mode as Building['kind'],p);this.cursor.material.color.setHex(valid?0xebd398:0xec6e59);}
    (this.water.material as THREE.ShaderMaterial).uniforms.time.value = this.world.time;
    this.terrain.count=this.overviewActive?1:9;
    this.water.geometry=this.overviewActive?geometry('overview-water',()=>new THREE.PlaneGeometry(256,256,128,128).rotateX(-Math.PI/2)):geometry('ground-water',()=>new THREE.PlaneGeometry(252,252,126,126).rotateX(-Math.PI/2));
    this.water.position.set(this.overviewActive?0:Math.floor(this.viewPoint.x/2)*2,0,this.overviewActive?0:Math.floor(this.viewPoint.z/2)*2);
    if(this.skyDome)this.skyDome.visible=this.overviewActive;
    this.view.prepare(this.scene);this.renderer.render(this.scene, this.camera);
    this.uiTimer += dt; if (this.uiTimer > .2) { this.onChange(); this.drawMinimap(); this.uiTimer = 0; }
    this.frame = requestAnimationFrame(this.animate);
  };
  releaseGroup(g: THREE.Object3D) { const materials = new Set<THREE.Material>(); g.traverse(o => { if(o instanceof THREE.Sprite){o.material.map?.dispose();materials.add(o.material);} if (o instanceof THREE.Mesh || o instanceof THREE.Line) { if (![...meshes.values()].includes(o.geometry)) o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); } }); materials.forEach(m => m.dispose()); }
  dispose() { cancelAnimationFrame(this.frame); this.resize.disconnect(); this.disposeListeners.forEach(f => f()); this.controls.dispose(); this.releaseGroup(this.scene); this.terrainData.dispose();this.view.dispose(); this.renderer.dispose(); this.renderer.domElement.remove(); this.dragBox.remove();this.tooltipElement.remove();this.shrineMeshes.forEach(s=>s.label.remove());this.buildingLabels.forEach(label=>label.remove()); }
}
