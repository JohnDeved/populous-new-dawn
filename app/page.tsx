'use client';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { BUILDINGS, SPELLS, HOME, createWorld, select, tell, manaRate, housing, guardShaman, type World, type UnitKind } from './model';
import type { GameScene } from './scene';
import { Soundscape } from './audio';
const timeLabel = (time: number) => `${Math.floor(time / 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`;

export default function Home() {
  const [world, setWorld] = useState<World>(createWorld);
  const [, setRevision] = useState(0);
  const [tab, setTab] = useState<'spells' | 'buildings' | 'followers'>('spells');
  const [sound, setSound] = useState(false);
  const [volume, setVolume] = useState(.35);
  const [menu, setMenu] = useState(false);
  const [hints, setHints] = useState(true);
  const [ready, setReady] = useState(false);
  const [desktopNotice, setDesktopNotice] = useState(true);
  const [error, setError] = useState('');
  const [hover, setHover] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null), minimap = useRef<HTMLCanvasElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const engine = useRef<GameScene | null>(null), audio = useRef<Soundscape | null>(null);
  const update = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    audio.current = new Soundscape(); return () => { audio.current?.dispose(); audio.current = null; };
  }, []);
  useEffect(() => {
    let disposed = false; setReady(false); setError('');
    if (window.innerWidth < 900) world.paused = true;
    import('./scene').then(({ GameScene }) => {
      if (disposed || !viewport.current || !minimap.current) return;
      try { engine.current = new GameScene(viewport.current, minimap.current, world, update, kind => audio.current?.cue(kind)); setReady(true); }
      catch (e) { setError(e instanceof Error ? e.message : 'Unable to start the 3D world.'); }
    }).catch(e => setError(String(e)));
    return () => { disposed = true; engine.current?.dispose(); engine.current = null; };
  }, [world, update]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest('input,dialog')) return;
      const s = SPELLS.find(s => s.key === e.key);
      if (s) { world.mode = world.mode === s.id ? null : s.id; setTab('spells'); }
      if(e.key==='Enter'&&!(e.target as HTMLElement).closest('button'))engine.current?.overview();
      if (e.key === 'Escape') { world.mode = null; }
      if(e.key.toLowerCase()==='g')guardShaman(world);
      if (e.key.toLowerCase() === 'h') select(world, 'shaman');
      if (e.key.toLowerCase() === 'f') { const u = world.units.find(u => world.selected.includes(u.id)); engine.current?.focus(u ?? HOME); }
      if (e.key.toLowerCase() === 'b') { setTab('buildings'); world.mode = null; }
      if (e.code === 'Space' && !(e.target as HTMLElement).closest('button')) { e.preventDefault(); world.paused = !world.paused; }
      update();
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [world, update]);
  useEffect(() => { if (menu) { world.paused = true; dialog.current?.showModal(); } else if (dialog.current?.open) dialog.current.close(); }, [menu, world]);
  async function toggleSound() {
    if (sound) { audio.current?.mute(); setSound(false); }
    else try { await audio.current?.enable(); setSound(true); } catch { tell(world, 'Audio could not start. Try the sound button again.'); update(); }
  }
  function choose(kind: UnitKind | 'all') { select(world, kind); audio.current?.cue(kind === 'shaman' ? 'select' : 'command'); update(); }
  function restart() { setMenu(false); setWorld(createWorld()); setTab('spells'); }
  const blue = world.units.filter(u => u.team === 'blue'), red = world.units.filter(u => u.team === 'red');
  const shaman = blue.find(u => u.kind === 'shaman'), selected = blue.filter(u => world.selected.includes(u.id));
  const isShaman = selected.length === 1 && selected[0]?.kind === 'shaman';
  const beds=world.buildings.filter(b=>b.team==='blue'&&b.kind==='hut'&&b.progress===1).reduce((n,b)=>n+housing(b),0);
  const flow=manaRate(world);
  const focused = SPELLS.find(s => s.id === (hover ?? world.mode)) ?? BUILDINGS.find(b => b.id === (hover ?? world.mode));
  const modeName = SPELLS.find(s => s.id === world.mode)?.name ?? BUILDINGS.find(b => b.id === world.mode)?.name;
  const objectives = [ { text: 'Bridge to the central island', done: world.stats.bridges > 0 }, { text: 'Discover warrior training', done: world.unlockedCamp }, { text: 'Defeat the Dakini tribe', done: world.status === 'won' } ];
  return <main className="game-shell">
    <div className="world-viewport" ref={viewport} />
    <div className="world-vignette" />
    {desktopNotice && <aside className="desktop-recommendation"><span className="brand-rune">⟡</span><h2>A world worth a bigger screen.</h2><p>For the best experience, play on a desktop monitor with a keyboard and mouse.</p><button className="primary-button" onClick={() => { setDesktopNotice(false); world.paused = false; update(); }}>Continue anyway <span>↗</span></button></aside>}
    <header className="topbar">
      <a className="wordmark" href="#" onClick={e => { e.preventDefault(); setMenu(true); }} aria-label="Populous game menu"><span className="brand-rune">⟡</span><span>POPULOUS<small>THE BEGINNING</small></span></a>
      <div className="resource-strip">
        <div className="resource" title="Your followers / places inside huts"><span className="resource-icon people-icon">♟</span><span><strong>{blue.length}<em> / {beds}</em></strong><small>FOLLOWERS</small></span></div>
        <div className="resource" title="Logs in the world. Builders fetch timber from trees."><span className="resource-icon wood-icon">⫻</span><span><strong>{Math.floor(world.wood)}</strong><small>TIMBER</small></span></div>
        <div className="resource mana-resource" title="Mana flows into Blast charges and warrior training"><span className="resource-icon mana-icon">✧</span><span><strong>{flow.toFixed(1)}<em className="rate"> /s</em></strong><small>MANA FLOW</small></span><div className="tiny-mana"><i style={{ width: `${world.mana * 10}%` }} /></div></div>
      </div>
      <div className="top-actions"><span className="clock-label">{timeLabel(world.time)}</span><button className={`icon-button sound-button ${sound ? 'on' : ''}`} onClick={toggleSound} title={sound ? 'Mute sound' : 'Enable sound'} aria-label={sound ? 'Mute sound' : 'Enable sound'}><span>{sound ? '♪' : '♫'}</span>{!sound && <i />}</button><button className="icon-button pause-button" onClick={() => { world.paused = !world.paused; update(); }} aria-label={world.paused ? 'Resume game' : 'Pause game'} title="Pause / resume · Space">{world.paused ? '▷' : 'Ⅱ'}</button><button className="menu-button" aria-label="Menu" onClick={() => setMenu(true)}><span>☰</span><span>Menu</span></button></div>
    </header>

    <div className="chapter-heading"><span className="eyebrow"><i /> WORLD 01 <b> / </b> THE ORIGINAL CAMPAIGN</span><h1>The Journey Begins</h1><p>Three islands. A first step towards godhood.</p><div className="chapter-rule"><span />◆<span /></div></div>

    <aside className="left-hud">
      <details className="objective-panel"><summary>Objectives · {objectives.filter(o => o.done).length} / 3</summary><ol>{objectives.map((o, i) => <li key={o.text} className={o.done ? 'complete' : ''}><span>{o.done ? '✓' : `0${i + 1}`}</span>{o.text}</li>)}</ol></details>
      <section className="tribe-panel"><div className="tribe-heading"><span className="tribe-dot blue-dot" />YOUR TRIBE<span className="live-label">THRIVING</span></div><div className="tribe-classes">{([{ kind: 'brave', label: 'Braves', icon: '♟' }, { kind: 'warrior', label: 'Warriors', icon: '⚔' }, { kind: 'shaman', label: 'Shaman', icon: '✧' }] as const).map(u => <button key={u.kind} title={`Select all ${u.label.toLowerCase()}`} aria-label={`Select all ${u.label.toLowerCase()}`} onClick={() => choose(u.kind)} className={selected.length > 0 && selected.every(s => s.kind === u.kind) ? 'selected' : ''}><img className="native-icon" src={`/original/${u.kind}.png`} alt="" /><strong>{blue.filter(b => b.kind === u.kind).length}</strong><small>{u.label}</small></button>)}</div><button className="select-all" onClick={() => choose('all')}>Select all followers <span>↗</span></button></section>
      <div className="enemy-status"><span className="tribe-dot red-dot" /><span>DAKINI</span><span>{red.length} followers</span></div>
    </aside>

    {ready && world.messageUntil > world.time && <div className="world-message" role="status"><span>✧</span>{world.message}</div>}
    {ready && world.paused && !menu && world.status === 'playing' && <button className="paused-badge" onClick={() => { world.paused = false; update(); }}>Ⅱ <span>WORLD PAUSED</span><small>Click to resume</small></button>}
    {world.mode && <div className="target-prompt"><span>◎</span> Choose where to {SPELLS.some(s => s.id === world.mode) ? 'cast' : 'build'} <strong>{modeName}</strong><button onClick={() => { world.mode = null; update(); }}>Cancel <kbd>ESC</kbd></button></div>}

    <div className="bottom-left">
      {hints && <div className="hint"><span className="hint-icon">✧</span><div><strong>A little faith goes a long way.</strong><p>Send one brave to the Land Bridge stone head. Bring your shaman to the shore, then cast onto the central island.</p></div><button aria-label="Dismiss tip" onClick={() => setHints(false)}>×</button></div>}
      <section className="selection-panel"><button className={`portrait ${isShaman ? 'shaman-portrait' : 'follower-portrait'}`} onClick={() => { choose('shaman'); engine.current?.focus(shaman ?? HOME); }} aria-label="Select and focus shaman"><img src="/original/portrait.png" alt="" /></button><div className="selected-info"><div className="panel-eyebrow">{isShaman ? 'THE CHOSEN ONE' : selected.length ? 'YOUR FOLLOWERS' : 'YOUR SHAMAN'}</div><h3>{isShaman ? 'Shaman' : selected.length ? `${selected.length} selected` : world.respawn ? 'Reincarnating' : 'Awaiting orders'}</h3><div className="health-bar"><i style={{ width: `${isShaman ? selected[0].hp : shaman?.hp ?? 0}%` }} /></div><div className="selection-meta"><span>{isShaman ? `${Math.ceil(selected[0].hp)} / 100 health` : world.respawn ? `${Math.ceil(world.respawn)}s until rebirth` : 'Click the world to move'}</span><button onClick={() => engine.current?.focus(selected[0] ?? shaman ?? HOME)} title="Focus selection · F" aria-label="Focus selection">⌖</button></div></div></section>
    </div>

    <section className="command-dock" aria-label="Command panel">
      <nav className="dock-tabs" aria-label="Command categories">{(['spells', 'buildings', 'followers'] as const).map(t => <button key={t} aria-label={`${t} ${t === 'spells' ? '1–3' : t === 'buildings' ? 'B' : ''}`} onClick={() => { setTab(t); world.mode = null; setHover(null); update(); }} className={tab === t ? 'active' : ''}><img className="native-icon" src={`/original/${t}.png`} alt="" />{t}<small>{t === 'spells' ? '1–3' : t === 'buildings' ? 'B' : ''}</small></button>)}</nav>
      <div className="dock-content">
        {tab === 'spells' && <div className="spell-list">{SPELLS.map(s => <button key={s.id} className={`spell-card ${world.mode === s.id ? 'active' : ''} ${world.shots[s.id] === 0 ? 'unaffordable' : ''}`} style={{ '--spell-color': s.color } as CSSProperties} onContextMenu={e=>{e.preventDefault();if(s.id==='blast'){world.charging=!world.charging;update();}}} onClick={() => { world.mode = world.mode === s.id ? null : s.id; update(); }} onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(s.id)} onBlur={() => setHover(null)} aria-label={`${s.name}, ${world.shots[s.id]} shots`} aria-pressed={world.mode === s.id}><span className={`spell-art spell-${s.id}`}><kbd>{s.key}</kbd><img className="spell-glyph" src={`/original/${s.id}.png`} alt="" /><span className="spell-orbit" /></span><strong>{s.name}</strong><small>{world.shots[s.id]} / 4 <span>{s.id==='blast'?world.charging?'CHARGING':'PAUSED':'GIFTS'}</span></small>{s.id==='blast'&&<i className="charge-track"><i style={{width:`${world.mana*10}%`}} /></i>}</button>)}</div>}
        {tab === 'buildings' && <div className="building-list">{BUILDINGS.map(b => <button key={b.id} disabled={b.id==='camp'&&!world.unlockedCamp} className={`building-card ${world.mode === b.id ? 'active' : ''} ${b.id==='camp'&&!world.unlockedCamp ? 'unaffordable' : ''}`} onClick={() => { world.mode = world.mode === b.id ? null : b.id; update(); }} onMouseEnter={() => setHover(b.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(b.id)} onBlur={() => setHover(null)} aria-label={`${b.name}, ${b.cost} wood`} aria-pressed={world.mode === b.id}><img className="native-icon" src={`/original/${b.id}.png`} alt="" /><strong>{b.name}</strong><small>{b.id==='camp'&&!world.unlockedCamp?'◈ Discover at vault':`⫻ ${b.cost} logs`}</small></button>)}</div>}
        {tab === 'followers' && <div className="follower-list">{([{ id: 'shaman', label: 'Shaman', description: 'Lead & cast spells', icon: '✧' }, { id: 'brave', label: 'Braves', description: 'Gather & construct', icon: '♟' }, { id: 'warrior', label: 'Warriors', description: 'Defend & conquer', icon: '⚔' }, { id: 'all', label: 'Everyone', description: 'Command your tribe', icon: '♟♟' }] as const).map(u => <button key={u.id} onClick={() => choose(u.id)}><img className="native-icon" src={`/original/${u.id==='all'?'followers':u.id}.png`} alt="" /><strong>{u.label}</strong><small>{u.description}</small></button>)}</div>}
      </div>
      <div className="dock-caption"><span className="caption-spark">✦</span><span>{focused?.description ?? (tab === 'spells' ? 'Your followers give you faith. Your faith gives you power.' : tab === 'buildings' ? 'Dry, level ground is required. Free braves fetch logs and build.' : 'Select your people, then click a destination or enemy.')}</span></div>
    </section>

    <aside className="map-panel"><div className="map-top"><span>THE KNOWN WORLD</span><span>⌖</span></div><div className="minimap-wrap"><canvas ref={minimap} width={220} height={220} aria-label="Minimap. Click to move the camera." /><span className="map-north">N</span></div><div className="map-bottom"><span><i className="blue-dot" /> You</span><span><i className="red-dot" /> Dakini</span><button onClick={() => engine.current?.focus(HOME)} title="Return to your settlement" aria-label="Focus home settlement">⌂</button></div></aside>
    <div className="camera-tools"><button onClick={() => engine.current?.overview()} aria-label="Planet overview" title="Planet overview · Enter">◎</button><button onClick={() => engine.current?.zoom(.82)} aria-label="Zoom in">+</button><button onClick={() => engine.current?.zoom(1.22)} aria-label="Zoom out">−</button><button onClick={() => engine.current?.focus(HOME)} aria-label="Centre camera">⌖</button></div>
    <footer className="controls-footer"><span><kbd>CLICK</kbd> Select / move</span><span><kbd>DRAG</kbd> Select group</span><span><kbd>RIGHT DRAG</kbd> Orbit</span><span><kbd>W A S D</kbd> Rotate</span><span><kbd>SCROLL</kbd> Zoom</span><button onClick={() => { world.speed = world.speed === 1 ? 2 : 1; update(); }} title="Change game speed">{world.speed}× <span>GAME SPEED</span></button><span className="tribute-label">A BROWSER TRIBUTE</span></footer>

    {(!ready || error) && <div className="loading-world" role="status"><span className="loading-rune">⟡</span><h2>{error ? 'The world could not awaken' : 'A world is awakening'}</h2><p>{error ? 'This game needs WebGL 2. Try a current browser with hardware acceleration enabled.' : 'Raising the earth. Gathering your people.'}</p>{error && <><details><summary>Technical details</summary>{error}</details><button className="primary-button" onClick={restart}>Try again</button></>}</div>}
    {world.status !== 'playing' && <div className="end-screen"><span className="end-rune">{world.status === 'won' ? '✺' : '◈'}</span><p className="eyebrow">{world.status === 'won' ? 'THE FIRST STEP TO GODHOOD' : 'THE CIRCLE IS BROKEN'}</p><h2>{world.status === 'won' ? 'A world united.' : 'Even gods can fall.'}</h2><p>{world.status === 'won' ? 'The Dakini are defeated. Your people will remember this dawn.' : 'Your tribe has fallen, but every beginning is another chance.'}</p><div className="end-stats"><span>{timeLabel(world.time)}<small>TIME</small></span><span>{world.stats.cast}<small>SPELLS CAST</small></span><span>{world.stats.built}<small>BUILDINGS RAISED</small></span></div><button className="primary-button" onClick={restart}>Begin again <span>↗</span></button></div>}
    <dialog ref={dialog} className="game-dialog" onClose={() => { setMenu(false); world.paused = false; update(); }}><button className="dialog-close" onClick={() => setMenu(false)} aria-label="Close menu">×</button><span className="eyebrow">POPULOUS · THE FIRST DAWN</span><h2>The world can wait.</h2><p>Worship for Land Bridge, discover warrior training, then defeat every Dakini follower.</p><div className="menu-actions"><button className="primary-button" onClick={() => setMenu(false)}>Return to the world <span>↗</span></button><button className="secondary-button" onClick={restart}>Restart world</button></div><h3>Your powers, at a glance</h3><div className="help-grid"><span>Click</span><strong>Select a follower or give a move / attack order</strong><span>Drag on land</span><strong>Select a group · Shift adds to selection</strong><span>Right / middle drag</span><strong>Rotate around the planet</strong><span>Scroll</span><strong>Zoom · WASD to rotate the planet</strong><span>1–3 / B</span><strong>Choose a spell / open buildings</strong><span>H / F / G / Space / Esc</span><strong>Shaman / focus / guard shaman / pause / cancel</strong></div><p className="help-tip">Each spell shows its own casting range. Blast recharges; right-click its card to pause charging and direct more mana to training. Worship the southern head for Land Bridge (four held at once), and the central head for four Lightning gifts. Only your shaman can learn at the vault. Select braves and click a friendly hut to house them, or a completed training hut to train them. Builders carry logs from trees. Followers drown in water; Blast can knock them off a shore.</p><div className="audio-settings"><button className="secondary-button" onClick={toggleSound}>{sound ? '♪ Sound on' : '♫ Enable sound'}</button><label>Volume <input type="range" min="0" max="1" step=".05" value={volume} onChange={e => { const v = Number(e.target.value); setVolume(v); audio.current?.setVolume(v); }} /></label></div><details className="reference-details"><summary>About this recreation & references</summary><p>Level 1: The Journey Begins. Terrain, starting objects and shrine timings were read from the supplied original level file. Building and tree meshes, texture coordinates, layered unit animations, HUD artwork and landscape bank c were decoded from the supplied game archive. The browser renderer approximates the original lighting, terrain displacement and water animation. Audio is synthesised. Combat, breeding timing and defensive AI remain browser adaptations.</p><div><a href="https://store.steampowered.com/app/2616430/Populous_The_Beginning/" target="_blank" rel="noreferrer">Original game & visual references ↗</a><a href="https://wiki.popre.net/Populous%3A_The_Beginning" target="_blank" rel="noreferrer">Gameplay reference ↗</a><a href="https://www.youtube.com/watch?v=kIY_4F47R6Q" target="_blank" rel="noreferrer">Mark Knight’s original soundtrack ↗</a><a href="https://sounds.spriters-resource.com/pc_computer/populousbegin/asset/393974/" target="_blank" rel="noreferrer">Shaman voice reference ↗</a></div></details></dialog>
  </main>;
}
