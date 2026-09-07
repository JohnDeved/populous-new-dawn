import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GRID, SIZE, HOME, ENEMY, PLANET_RADIUS, normal, planetPoint, mapPoint, worldPoint, footprint, placementError, height, walkable, distance, maxHp, buildingHp, cast, command, placeBuilding, SPELLS, tick, type World, type Point, type Unit, type Building, type Effect } from './model';

const teamColor = { blue: 0x39aaf2, red: 0xe96549, wild: 0xc6bf9b };
const material = (color: number, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .95, flatShading: true, ...extra });
const textures = new Map<string, THREE.CanvasTexture>();
function texture(kind: string) {
  if (textures.has(kind)) return textures.get(kind)!;
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  let seed = 37; const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  ctx.fillStyle = kind === 'ground' ? '#eeeeea' : kind.startsWith('thatch') ? '#d9c7a1' : '#d6c6a2'; ctx.fillRect(0,0,128,128);
  for (let i = 0; i < 2300; i++) {
    const light = rand() > .5; ctx.fillStyle = light ? '#fff4cc12' : '#1e281d10';
    const x = rand()*128, y = rand()*128;
    ctx.fillRect(x,y,kind.startsWith('thatch') ? .6+rand()*1.3 : 1+rand()*2.5,kind.startsWith('thatch') ? 6+rand()*18 : 1+rand()*2);
  }
  if (kind.startsWith('thatch')) {
    ctx.strokeStyle = kind.endsWith('blue') ? '#2873b2' : '#b54836'; ctx.lineWidth = 13; ctx.lineJoin = 'miter';
    ctx.beginPath();ctx.moveTo(-10,85);for(let x=0;x<=144;x+=16)ctx.lineTo(x,x%32===0?65:91);ctx.stroke();
  }
  if (kind.startsWith('wall')) {
    ctx.strokeStyle = kind.endsWith('blue') ? '#2466a9' : '#a83e30'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(64,66,23,.1,Math.PI*1.85); ctx.stroke(); ctx.beginPath(); ctx.arc(64,66,11,0,Math.PI*1.8); ctx.stroke();
    ctx.beginPath();ctx.moveTo(42,94);ctx.lineTo(64,19);ctx.lineTo(86,94);ctx.stroke();
    ctx.lineWidth=3;ctx.strokeRect(8,8,112,112);
  }
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (kind.startsWith('thatch')) t.repeat.set(3,1); if (kind.startsWith('wall')) t.repeat.set(4,1);
  textures.set(kind,t); return t;
}
const meshes = new Map<string, THREE.BufferGeometry>();
function geometry(key: string, create: () => THREE.BufferGeometry) { if (!meshes.has(key)) meshes.set(key, create()); return meshes.get(key)!; }
const cylinder = (top: number, bottom: number, h: number, segments = 8) => geometry(`c${top},${bottom},${h},${segments}`, () => new THREE.CylinderGeometry(top, bottom, h, segments));
const sphere = (r: number) => geometry(`s${r}`, () => new THREE.IcosahedronGeometry(r, 0));
const box = (x: number, y: number, z: number) => geometry(`b${x},${y},${z}`, () => new THREE.BoxGeometry(x, y, z));
function part(group: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
}
function ring(radius: number, color: number, width = .075) {
  const g = new THREE.RingGeometry(radius - width, radius, 64); g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, depthWrite: false, side: THREE.DoubleSide }));
}
function makeUnit(u: Unit) {
  const g = new THREE.Group(), cloth = material(teamColor[u.team]), skin = material(u.team === 'wild' ? 0xaa977b : 0xba8154), dark = material(0x353139), gold = material(0xecc383);
  const shaman = u.kind === 'shaman', warrior = u.kind === 'warrior';
  part(g, cylinder(.22, .38, .62, 6), cloth, 0, .63);
  part(g, sphere(.22), skin, 0, 1.17);
  part(g, cylinder(.14, .2, .32, 5), shaman ? cloth : skin, 0, .99);
  const leg1 = part(g, cylinder(.07, .085, .4, 5), dark, -.14, .2), leg2 = part(g, cylinder(.07, .085, .4, 5), dark, .14, .2);
  const arm1 = part(g, cylinder(.075, .08, .44, 5), skin, -.3, .79), arm2 = part(g, cylinder(.075, .08, .44, 5), skin, .3, .79);
  arm1.rotation.z = .23; arm2.rotation.z = -.25;
  if (shaman) {
    part(g, cylinder(.07, .055, 1.75, 6), gold, .48, .88);
    part(g, new THREE.TorusGeometry(.19, .05, 5, 10), gold, .48, 1.9);
    part(g, sphere(.105), material(teamColor[u.team], { emissive: teamColor[u.team], emissiveIntensity: 2 }), .48, 1.9);
    for (let i = -2; i <= 2; i++) { const f = part(g, cylinder(0, .09, .65 - Math.abs(i) * .1, 4), i % 2 ? gold : cloth, i * .12, 1.53); f.rotation.z = -i * .2; }
    g.scale.setScalar(1.28);
  } else if (warrior) {
    part(g, cylinder(.04, .055, 1.7, 5), dark, .48, .85);
    part(g, cylinder(0, .14, .35, 4), gold, .48, 1.8);
    const shield = part(g, sphere(.26), cloth, -.38, .8); shield.scale.set(1, 1.2, .28);
    part(g, cylinder(.23, .24, .12), gold, 0, 1.27);
  } else if (u.team === 'wild') { part(g, sphere(.26), dark, 0, 1.26); }
  const cargo=part(g,cylinder(.13,.16,.85,6),material(0x795637),0,.8,.4);cargo.rotation.z=Math.PI/2;cargo.visible=false;
  const selection = ring(.8, 0x85d7ff); selection.position.y = .05; g.add(selection);
  const health = new THREE.Group();
  part(health, box(.9, .075, .045), material(0x263635), 0, 2.3);
  const healthFill = part(health, box(.88, .06, .05), material(teamColor[u.team]), 0, 2.3, .01); g.add(health);
  g.userData = { unit: u.id, signature: `${u.team}-${u.kind}`, leg1, leg2, arm1, arm2, cargo, selection, health, healthFill };
  return g;
}
function makeBuilding(b: Building) {
  const g = new THREE.Group(), wood = material(0x68503b), thatch = material(0xb29a65), wall = material(0xd1bc8e), cloth = material(teamColor[b.team]), dark = material(0x26292b), stone = material(0x808c82);
  const tower = b.kind === 'tower', temple = b.kind === 'temple', camp = b.kind === 'camp';
  thatch.map = texture(`thatch-${b.team}`); wall.map = texture(`wall-${b.team}`);
  const base = tower ? 3.7 : 0, radius = temple ? 2.5 : camp ? 1.8 : 1.6;
  part(g, cylinder(radius + .3, radius + .5, .3, 10), stone, 0, .15);
  if (tower) {
    part(g, cylinder(.65, .95, 4, 7), wall, 0, 2);
    for (const x of [-.6, .6]) { const leg = part(g, cylinder(.12, .17, 4.5, 6), wood, x, 2, .4); leg.rotation.z = x * .14; }
    for (let i = 0; i < 7; i++) part(g, box(.65, .08, .12), wood, 0, .4 + i * .48, 1);
  }
  part(g, cylinder(radius * .9, radius, 1.6, 10), wall, 0, base + .95);
  part(g, cylinder(radius + .02, radius + .02, .3, 10), cloth, 0, base + 1.45);
  part(g, cylinder(radius * .56, radius + .7, .5, 12), thatch, 0, base + 1.93);
  part(g, cylinder(.16, radius * .58, .95, 12), thatch, 0, base + 2.58);
  part(g, cylinder(0, .3, .55, 8), cloth, 0, base + 3.1);
  if (temple) { part(g, cylinder(.8, 1.1, .8, 10), wall, 0, 3); part(g, cylinder(.1, 1.6, 1, 10), thatch, 0, 3.8); part(g, cylinder(0,.25,.5,6),cloth,0,4.55); }
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2;
    const r = part(g, cylinder(.035, .055, 2.35, 4), wood, Math.sin(a) * (radius + .35) / 2, base + 2.27, Math.cos(a) * (radius + .35) / 2);
    r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.sin(a) * (radius + .35), -1.25, Math.cos(a) * (radius + .35)).normalize());
  }
  part(g, box(.62, 1.12, .1), dark, 0, base + .7, radius * .96);
  const awning = part(g, box(1.1, .15, .8), thatch, 0, base + 1.3, radius + .25); awning.rotation.x = .18;
  if (!tower) {
    for (let i = 3; i < 29; i++) { const a = i / 30 * Math.PI * 2; part(g, cylinder(.055, .08, .75, 4), wood, Math.sin(a) * (radius + 1), .38, Math.cos(a) * (radius + 1)); }
  }
  if (!tower) for (const y of [.3, .6]) { const rail = part(g, new THREE.TorusGeometry(radius + 1, .045, 3, 32, Math.PI * 1.73), wood, 0, y); rail.rotation.x = Math.PI / 2; rail.rotation.z = Math.PI * .13; }
  if (camp) for (let i = 0; i < 3; i++) { const spear = part(g, cylinder(.035, .05, 3, 5), wood, -1.2 + i * .25, 1.6, 2.1); spear.rotation.z = .2 - i * .2; part(g, cylinder(0, .14, .4, 4), stone, -1.2 + i * .25, 3.2, 2.1); }
  if (temple) { part(g, cylinder(.6, .8, 1, 7), stone, 0, .55, 2.8); part(g, sphere(.32), material(0x72c8eb, { emissive: 0x52b9e2, emissiveIntensity: 1.5 }), 0, 1.3, 2.8); }
  const pole = part(g, cylinder(.04, .07, 3.2, 5), wood, radius + .8, 1.6, -.3);
  part(g, box(.8, .5, .04), cloth, pole.position.x + .35, 2.7, -.3);
  // Merge the static architecture by material, keeping construction and health animation independent.
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  for (const child of [...g.children]) if (child instanceof THREE.Mesh) { child.updateMatrix(); const geo = (child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone()).applyMatrix4(child.matrix); const mat = child.material as THREE.Material; if (!batches.has(mat)) batches.set(mat, []); batches.get(mat)!.push(geo); g.remove(child); }
  for (const [mat, geos] of batches) { const merged = new THREE.Mesh(mergeGeometries(geos), mat); merged.castShadow = true; merged.receiveShadow = true; g.add(merged); geos.forEach(geo => geo.dispose()); }
  const health = new THREE.Group(); part(health, box(2.5, .09, .05), dark, 0, base + 3.7);
  const healthFill = part(health, box(2.5, .09, .06), cloth, 0, base + 3.7, .01); g.add(health);
  const scaffold = new THREE.Group();
  for(const x of [-2.4,2.4])for(const z of [-2.4,2.4])part(scaffold,cylinder(.06,.09,3.8,5),wood,x,1.9,z);
  for(const y of [1.1,2.3,3.5]){part(scaffold,box(4.8,.09,.12),wood,0,y,-2.4);part(scaffold,box(.12,.09,4.8),wood,-2.4,y,0);part(scaffold,box(.12,.09,4.8),wood,2.4,y,0);}
  g.add(scaffold);g.userData = { building: b.id, signature: b.level, health, healthFill, scaffold, architecture:g.children.filter(c=>c!==health&&c!==scaffold) };
  // Hut upgrades add a visible upper thatch tier while preserving the footprint.
  if(b.kind==='hut'&&b.level>1){part(g,cylinder(.6,1.1,.8,10),wall,0,3.1);part(g,cylinder(.08,1.5,.9,12),thatch,0,3.85);health.position.y=1.5;if(b.level===3){part(g,cylinder(.4,.65,.65,10),wall,0,4.35);part(g,cylinder(.05,.95,.8,12),thatch,0,4.95);health.position.y=2.2;}}

  return g;
}

export class GameScene {
  world: World;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, .2, 500);
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
  down = { x: 0, y: 0, button: 0 };
  dragBox: HTMLDivElement;
  keys = new Set<string>();
  resize: ResizeObserver;
  frame = 0;
  previous = 0;
  accumulator = 0;
  uiTimer = 0;
  terrainVersion = -1;
  treeSignature = '';
  onChange: () => void;
  onSound: (kind: string) => void;
  disposeListeners: (() => void)[] = [];
  container: HTMLElement;
  mini: HTMLCanvasElement;
  minimapBackground = document.createElement('canvas');

  constructor(container: HTMLElement, minimap: HTMLCanvasElement, world: World, onChange: () => void, onSound: (kind: string) => void) {
    this.container = container; this.mini = minimap; this.world = world; this.onChange = onChange; this.onSound = onSound;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.15;
    this.renderer.setClearColor(0x172c36, 0);
    this.renderer.domElement.setAttribute('aria-label', 'Island battlefield. Click to select, right-click to move, drag to select a group.');
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);
    this.scene.fog = new THREE.FogExp2(0x263c46, .0036);
    this.scene.add(new THREE.HemisphereLight(0xb6d4e3, 0x65563e, 2.1));
    const sun = new THREE.DirectionalLight(0xffd59b, 2.8); sun.position.set(-10, 65, -50); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -62; sun.shadow.camera.right = 62; sun.shadow.camera.top = 62; sun.shadow.camera.bottom = -62; sun.shadow.normalBias = .16; sun.shadow.bias = -.0001; this.scene.add(sun);
    this.camera.up.set(0,0,-1);this.camera.position.set(30,155,0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); this.controls.target.set(0, -PLANET_RADIUS, 0);
    this.controls.enableDamping = true; this.controls.dampingFactor = .09; this.controls.minDistance = PLANET_RADIUS + 14; this.controls.maxDistance = PLANET_RADIUS + 190; this.controls.enablePan = false;
    this.controls.minPolarAngle = .03; this.controls.maxPolarAngle = Math.PI - .03;
    this.controls.mouseButtons = { LEFT: null as unknown as THREE.MOUSE, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.ROTATE };
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.update();
    this.terrainData = new THREE.DataTexture(new Float32Array(world.terrain), GRID, GRID, THREE.RedFormat, THREE.FloatType); this.terrainData.needsUpdate = true;
    this.terrain = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, map: texture('ground'), roughness: 1, flatShading: true })); this.terrain.receiveShadow = true; this.terrain.castShadow = true; this.scene.add(this.terrain);
    const waterGeo = new THREE.SphereGeometry(PLANET_RADIUS, 144, 96);
    this.water = new THREE.Mesh(waterGeo, new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, heights: { value: this.terrainData } },
      vertexShader: `varying vec3 vPos; uniform float time; void main() { vec3 p=position; p+=normalize(p)*(.06+sin(p.x*.5+time)*cos(p.z*.4+time*.7)*.035); vPos=p; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `varying vec3 vPos; uniform float time; uniform sampler2D heights; void main(){
        vec2 map=vec2(atan(vPos.x,vPos.y),asin(clamp(vPos.z/length(vPos),-1.,1.)))*70.;
        vec2 uv=(map+48.)/96.; float h=-3.; if(all(greaterThanEqual(uv,vec2(0.)))&&all(lessThanEqual(uv,vec2(1.))))h=texture2D(heights,uv).r;
        vec3 color=mix(vec3(.018,.085,.12),vec3(.12,.38,.37),smoothstep(-2.,.5,h));
        float wave=sin(map.x*2.+time*.65+sin(map.y*1.5))*sin(map.y*1.6-time*.6);color+=pow(max(0.,wave),10.)*.075;
        float foam=smoothstep(.03,.45,h)*(1.-smoothstep(.5,.9,h))*(.6+.4*sin(map.x*2.4+map.y*2.1+time));color+=foam*vec3(.32,.37,.3);
        color*=.65+.35*max(0.,dot(normalize(vPos),normalize(vec3(-.1,1.,-.6))));gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
      }`,
    })); this.water.position.y=-PLANET_RADIUS;this.scene.add(this.water);
    this.scene.add(this.objects, this.decorations, this.cursor, this.range); this.cursor.visible = false; this.range.visible = false;
    this.rebuildTerrain(); this.makeDecorations(); this.makeShrines(); this.focus({x:0,z:36});this.drawMinimap();
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
  listen(target: EventTarget, name: string, handler: EventListener) { target.addEventListener(name, handler); this.disposeListeners.push(() => target.removeEventListener(name, handler)); }
  setSize() { const { width, height } = this.container.getBoundingClientRect(); this.renderer.setSize(width, height); this.camera.aspect = width / Math.max(1, height); this.camera.updateProjectionMatrix(); }
  y(p: Point) { return height(this.world.terrain,p.x,p.z); }
  locate(g:THREE.Object3D,p:Point,h?:number){const q=h===undefined?worldPoint(this.world.terrain,p):planetPoint(p,h);g.position.set(q.x,q.y,q.z);const n=normal(p);g.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(n.x,n.y,n.z));}
  groundRing(mesh:THREE.Mesh,p:Point,radius:number){const pos=mesh.geometry.attributes.position;for(let i=0;i<pos.count;i++){const a=i%65/64*Math.PI*2,r=i<65?radius-.1:radius;const q={x:p.x+Math.cos(a)*r,z:p.z+Math.sin(a)*r};const v=planetPoint(q,Math.max(0,height(this.world.terrain,q.x,q.z))+.16);pos.setXYZ(i,v.x,v.y,v.z);}pos.needsUpdate=true;mesh.geometry.computeBoundingSphere();}

  rebuildTerrain() {
    const w = this.world, positions: number[] = [], colors: number[] = [];
    const sand = new THREE.Color(0xb9ad76), grass = new THREE.Color(0x71824a), highGrass = new THREE.Color(0x586740), rock = new THREE.Color(0x8d8972);
    const add = (x: number, z: number, shade: number) => {
      const h = w.terrain[(z + 48) * GRID + x + 48]; const p=planetPoint({x,z},h);positions.push(p.x,p.y,p.z);
      const c = h < 1.2 ? sand.clone().lerp(grass, Math.max(0, h - .45) / .75) : h < 5.6 ? grass.clone().lerp(highGrass, (h - 1.2) / 4.4) : highGrass.clone().lerp(rock, Math.min(1, (h - 5.6) / 2.8));
      c.multiplyScalar(shade); colors.push(c.r, c.g, c.b);
    };
    for (let z = -48; z < 48; z++) for (let x = -48; x < 48; x++) {
      const shade = .92 + (Math.sin(x * 32.56 + z * 75.12) * 43758.54 % 1) * .085;
      add(x, z, shade); add(x, z + 1, shade); add(x + 1, z, shade);
      add(x + 1, z, shade + .02); add(x, z + 1, shade + .02); add(x + 1, z + 1, shade + .02);
    }
    this.terrain.geometry.dispose(); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); const uv = []; for (let i=0;i<positions.length;i+=3) uv.push(positions[i]/6,positions[i+2]/6); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.computeVertexNormals(); this.terrain.geometry = geo;
    (this.terrainData.image.data as Float32Array).set(w.terrain); this.terrainData.needsUpdate = true; this.terrainVersion = w.terrainVersion;
    for (const d of this.decorations.children) { const p = d.userData.point as Point | undefined; if (p) { this.locate(d,p); d.visible = walkable(w.terrain, p); } }
    const bg = this.minimapBackground; bg.width = GRID; bg.height = GRID; const ctx = bg.getContext('2d')!; const data = ctx.createImageData(GRID, GRID);
    for (let i = 0; i < w.terrain.length; i++) { const h = w.terrain[i]; const c = h < .4 ? [25, 55, 63] : h < 1.2 ? [153, 146, 106] : h > 7 ? [114, 121, 113] : [71 + h * 4, 93 + h * 3, 61 + h * 2]; data.data.set([...c, 255], i * 4); } ctx.putImageData(data, 0, 0);
  }
  makeDecorations() {
    let seed = 426; const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const wood = material(0x605644), leaf = material(0x385c3a), leafLight = material(0x547b43), stone = material(0x868778);
    const trunkGeos: THREE.BufferGeometry[] = [], leafGeos: THREE.BufferGeometry[] = [], leafLightGeos: THREE.BufferGeometry[] = [];
    const stamp = (geo: THREE.BufferGeometry, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...Object.values(planetPoint({x,z},y)) as [number,number,number]), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...Object.values(normal({x,z})) as [number,number,number])), new THREE.Vector3(sx, sy, sz)));
    // Static foliage is merged into three draws; rebuilding the island removes trees under new structures.
    for (const tree of this.world.trees) {
      if(tree.logs<1)continue;const p = tree, h = height(this.world.terrain, p.x, p.z);
      if (h < .3 || this.world.buildings.some(b => distance(b, p) < 3.7) || distance(p, HOME) < 5 || distance(p, ENEMY) < 4) continue;
      const y = this.y(p), size = .75 + rand() * .7;
      trunkGeos.push(stamp(cylinder(.12, .24, 2.7, 5), p.x, y + 1.3 * size, p.z, size, size, size));
      if (rand() > .6) {
        for (let j = 0; j < 3; j++) (j % 2 ? leafGeos : leafLightGeos).push(stamp(cylinder(0, 1.3 - j * .25, 2, 6), p.x, y + (2.1 + j * .7) * size, p.z, size, size, size));
      } else if (rand() > .42) {
        leafGeos.push(stamp(sphere(1.3), p.x, y + 3 * size, p.z, size * 1.2, size * .7, size));
        leafLightGeos.push(stamp(sphere(.95), p.x - .5 * size, y + 3.5 * size, p.z + .3, size, size * .8, size));
      } else {
        for (let j=0;j<6;j++) { const angle=j*Math.PI/3; const geo=sphere(1).clone(); geo.scale(.42*size,.15*size,1.8*size);geo.rotateX(.18);geo.rotateY(angle);geo.translate(p.x+Math.sin(angle)*1.1*size,y+2.8*size,p.z+Math.cos(angle)*1.1*size);leafLightGeos.push(geo); }
      }
    }
    for (const [geos, mat] of [[trunkGeos, wood], [leafGeos, leaf], [leafLightGeos, leafLight]] as const) if (geos.length) { const merged = mergeGeometries(geos); const m = new THREE.Mesh(merged, mat); m.castShadow = true; m.receiveShadow = true; this.decorations.add(m); geos.forEach(g => g.dispose()); }
    for (const center of [HOME, ENEMY]) {
      const g = new THREE.Group();
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const m = part(g, cylinder(.22, .36, 1.6 + (i % 3) * .15, 5), stone, Math.sin(a) * 2.8, .7, Math.cos(a) * 2.8); m.rotation.z = Math.sin(a) * .12; }
      const sacred = ring(2.3, center === HOME ? 0x6bcafa : 0xee8660, .12); sacred.position.y = .07; g.add(sacred); this.locate(g,center); g.userData.point = center; this.decorations.add(g);
    }
    for (let i = 0; i < 65; i++) { const p = { x: rand() * 76 - 38, z: rand() * 72 - 36 }; if (!walkable(this.world.terrain, p) || this.world.buildings.some(b => distance(b, p) < 4)) continue; const g = new THREE.Group(); const r = height(this.world.terrain,p.x,p.z) < 2.3 ? .65 + rand()*1.1 : .3 + rand() * .8; part(g, sphere(r), stone, 0, r * .3); g.scale.y = .65; this.locate(g,p); g.userData.point = p; this.decorations.add(g); }
  }
  makeShrines(){
    for(const shrine of this.world.shrines){
      const g=new THREE.Group(),stone=material(0x848a75),dark=material(0x364a40),gold=material(0xd7b978);
      part(g,cylinder(1.1,1.5,.4,8),stone,0,.1);
      if(shrine.kind==='vault'){
        for(const x of [-1.2,1.2])part(g,cylinder(.45,.6,2.5,5),stone,x,1.3);
        part(g,box(3.2,.55,1.2),stone,0,2.7);part(g,cylinder(0,1.8,1.3,4),gold,0,3.5);
        part(g,box(1.4,1.7,.6),dark,0,1.1);part(g,new THREE.TorusGeometry(.4,.07,4,12),gold,0,1.8,.4);
      }else{
        const head=part(g,sphere(1),stone,0,1.7);head.scale.set(.95,1.4,.8);
        for(const x of [-.35,.35])part(g,box(.27,.12,.15),dark,x,2.05,.7);
        part(g,box(.24,.5,.25),stone,0,1.75,.85);part(g,box(.48,.1,.12),dark,0,1.35,.76);
        part(g,new THREE.TorusGeometry(.25,.06,4,10),gold,0,2.7,.3);
      }
      this.locate(g,shrine);this.objects.add(g);
      const label=document.createElement('button');label.className='shrine-label';label.setAttribute('aria-label',`Worship ${shrine.name}`);
      label.onclick=()=>{command(this.world,shrine);this.onSound('command');this.onChange();};this.container.appendChild(label);this.shrineMeshes.set(shrine.id,{g,label});
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
    if (event.button === 2) { this.world.mode = null; command(this.world, p); this.onSound('command'); }
    else if (this.world.mode) {
      const mode = this.world.mode;
      const ok = SPELLS.some(s => s.id === mode) ? cast(this.world, mode as Parameters<typeof cast>[1], p) : placeBuilding(this.world, mode as Parameters<typeof placeBuilding>[1], p);
      this.onSound(ok ? mode : 'error');
    } else {
      // Raycast actual unit geometry before using a ground-distance fallback.
      const hits = this.ray.intersectObjects([...this.unitMeshes.values()].filter(g=>g.visible), true); let obj = hits[0]?.object;
      while (obj?.parent && obj.userData.unit === undefined) obj = obj.parent;
      const picked = this.world.units.find(u => u.id === obj?.userData.unit && u.team === 'blue') ?? this.world.units.filter(u => u.team === 'blue' && u.inside===null && distance(u, p) < 2.1).sort((a, b) => distance(a, p) - distance(b, p))[0];
      if (picked) { this.world.selected = event.shiftKey ? this.world.selected.includes(picked.id) ? this.world.selected.filter(id => id !== picked.id) : [...this.world.selected, picked.id] : [picked.id]; this.onSound(picked.kind === 'shaman' ? 'select' : 'command'); }
      else if (this.world.selected.length) { command(this.world, p); this.onSound('command'); }
    }
    this.onChange();
  }) as EventListener;
  keyDown = ((event: KeyboardEvent) => {
    if ((event.target as HTMLElement).closest('button,input,dialog,a') || event.ctrlKey || event.metaKey || event.altKey) return;
    this.keys.add(event.key.toLowerCase()); if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
  }) as EventListener;
  orientCamera(){const distance=this.camera.position.distanceTo(this.controls.target),tilt=Math.min(.22,Math.max(0,(180-distance)/70*.22));const p=mapPoint(this.camera.position);p.z=Math.max(-100,Math.min(100,p.z-tilt*PLANET_RADIUS));const q=planetPoint(p);this.camera.lookAt(q.x,q.y,q.z);this.camera.updateMatrixWorld();}
  focus(p: Point = HOME) { const n=normal({x:p.x,z:p.z+(.22*55/70)*PLANET_RADIUS});this.camera.position.set(n.x,n.y,n.z).multiplyScalar(125).add(this.controls.target);this.controls.update();this.orientCamera(); }
  overview(){this.camera.position.set(30,155,0);this.controls.update();this.orientCamera();}
  zoom(amount: number) { const offset = this.camera.position.clone().sub(this.controls.target).multiplyScalar(amount); offset.clampLength(PLANET_RADIUS+14, PLANET_RADIUS+190); this.camera.position.copy(this.controls.target).add(offset); this.controls.update();this.orientCamera(); }
  makeFx(f: Effect) {
    const g = new THREE.Group(), color = f.kind === 'birth' ? 0x88deee : f.kind === 'lightning' ? 0xdddbff : 0xffab52;
    if (f.kind === 'lightning') {
      const points = []; for (let i = 0; i <= 10; i++) points.push(new THREE.Vector3(Math.sin(i * 17) * (i === 10 ? 0 : 1.5), 22 - i * 2.2, Math.cos(i * 13) * .5));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xeeedff, transparent: true })));
      part(g, cylinder(.1, .3, 22, 6), new THREE.MeshBasicMaterial({ color: 0xc9d4ff, transparent: true, opacity: .35 }), 0, 11);
    }
    const halo = ring(1, color, .12); halo.position.y = .3; g.add(halo);
    for (let i = 0; i < (f.kind === 'hit' ? 4 : 22); i++) { const m = part(g, sphere(.15), new THREE.MeshBasicMaterial({ color, transparent: true })); m.userData.velocity = new THREE.Vector3(Math.sin(i * 2.4) * (1 + i % 4), 2 + i % 5, Math.cos(i * 2.4) * (1 + i % 4)); }
    this.locate(g,f); g.userData.halo = halo; return g;
  }
  drawMinimap() {
    const ctx = this.mini.getContext('2d'); if (!ctx) return; const s = this.mini.width; ctx.clearRect(0, 0, s, s); ctx.drawImage(this.minimapBackground, 0, 0, s, s);
    const at = (p: Point) => [(p.x + 48) / 96 * s, (p.z + 48) / 96 * s];
    for (const b of this.world.buildings) { ctx.fillStyle = b.team === 'blue' ? '#54bffe' : '#ef8069'; const [x, z] = at(b); ctx.fillRect(x - 2, z - 2, 4, 4); }
    for (const u of this.world.units) { ctx.fillStyle = u.team === 'blue' ? '#82d5ff' : u.team === 'red' ? '#f78b74' : '#d8d5b3'; const [x, z] = at(u); ctx.beginPath(); ctx.arc(x, z, u.kind === 'shaman' ? 3 : 1.5, 0, Math.PI * 2); ctx.fill(); }
    for(const shrine of this.world.shrines){const [x,z]=at(shrine);ctx.fillStyle=shrine.active?'#f5cf86':'#777e6c';ctx.beginPath();ctx.arc(x,z,3,0,Math.PI*2);ctx.fill();}
    const [x, z] = at(mapPoint(this.camera.position)); ctx.strokeStyle = '#f1e0b599'; ctx.lineWidth = 1; const size = this.camera.position.distanceTo(this.controls.target) * .5; ctx.strokeRect(x - size / 2, z - size / 3, size, size * .67);
  }
  animate = (now: number) => {
    const dt = Math.min(.1, (now - (this.previous || now)) / 1000); this.previous = now;
    this.accumulator += dt * this.world.speed;
    while (this.accumulator >= 1 / 30) { tick(this.world, 1 / 30); this.accumulator -= 1 / 30; }
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
      if (u.path.length) { g.rotateY(Math.atan2(u.path[0].x - u.x, u.path[0].z - u.z)); const step = Math.sin(this.world.time * 11 + u.id) * .45; g.userData.leg1.rotation.x = step; g.userData.leg2.rotation.x = -step; g.position.addScaledVector(new THREE.Vector3(n.x,n.y,n.z),Math.abs(Math.sin(this.world.time*11+u.id))*.075); }
      else { g.userData.leg1.rotation.x = 0; g.userData.leg2.rotation.x = 0; }
      g.userData.selection.visible = this.world.selected.includes(u.id);g.userData.cargo.visible=u.cargo>0;
      g.userData.health.visible = u.hp < maxHp(u.kind) || this.world.selected.includes(u.id);
      g.userData.health.quaternion.copy(g.quaternion.clone().invert().multiply(this.camera.quaternion)); g.userData.healthFill.scale.x = Math.max(.001, u.hp / maxHp(u.kind));
    }
    for (const [id, g] of this.buildingMeshes) if (!this.world.buildings.some(b => b.id === id)) { this.objects.remove(g); this.releaseGroup(g); this.buildingMeshes.delete(id);this.buildingLabels.get(id)?.remove();this.buildingLabels.delete(id); }
    for (const b of this.world.buildings) {
      let g = this.buildingMeshes.get(b.id);if(g&&g.userData.signature!==b.level){this.objects.remove(g);this.releaseGroup(g);this.buildingMeshes.delete(b.id);g=undefined;} if (!g) { g = makeBuilding(b); this.buildingMeshes.set(b.id, g); this.objects.add(g); if (b.progress < 1) { this.releaseGroup(this.decorations); this.decorations.clear(); this.makeDecorations(); } }
      this.locate(g,b,b.foundation);g.rotateY(b.angle);g.userData.scaffold.visible=b.progress<1;for(const child of g.userData.architecture)child.visible=b.progress>.35; g.userData.health.visible = b.hp < buildingHp(b.kind) || b.progress < 1; g.userData.health.quaternion.copy(g.quaternion.clone().invert().multiply(this.camera.quaternion)); g.userData.healthFill.scale.x = b.progress < 1 ? Math.max(.01, b.progress) : Math.max(.001, b.hp / buildingHp(b.kind));
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
      const life = 1 - f.age / f.duration; g.userData.halo.scale.setScalar(.5 + f.age * (f.kind === 'hit' ? 1 : 4)); g.userData.halo.material.opacity = life * .8;
      for (const m of g.children) if (m instanceof THREE.Mesh && m.userData.velocity) { m.position.copy(m.userData.velocity).multiplyScalar(f.age); m.position.y -= f.age * f.age * 1.5; (m.material as THREE.MeshBasicMaterial).opacity = life; }
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
    (this.water.material as THREE.ShaderMaterial).uniforms.time.value = now * .0003;
    this.renderer.render(this.scene, this.camera);
    this.uiTimer += dt; if (this.uiTimer > .2) { this.onChange(); this.drawMinimap(); this.uiTimer = 0; }
    this.frame = requestAnimationFrame(this.animate);
  };
  releaseGroup(g: THREE.Object3D) { const materials = new Set<THREE.Material>(); g.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Line) { if (![...meshes.values()].includes(o.geometry)) o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); } }); materials.forEach(m => m.dispose()); }
  dispose() { cancelAnimationFrame(this.frame); this.resize.disconnect(); this.disposeListeners.forEach(f => f()); this.controls.dispose(); this.releaseGroup(this.scene); this.terrainData.dispose(); this.renderer.dispose(); this.renderer.domElement.remove(); this.dragBox.remove();this.shrineMeshes.forEach(s=>s.label.remove());this.buildingLabels.forEach(label=>label.remove()); }
}
