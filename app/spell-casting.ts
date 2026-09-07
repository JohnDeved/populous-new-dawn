import rules from './original-rules.json' with {type: 'json'};
import type {ManaTribe, ManaWorld, SpellStock} from './mana.ts';
import {cellDistanceSquared,positionDistance} from './native-math.ts';

export type SpellCaster = {height: number; flags2: number;
  building: {class: number; model: number; state: number} | null};
export type SpellEntry = {model: number; mana: number};
const divide = (a: number, b: number) => Math.trunc(a / b) | 0;

export type TribeCasting = {flags: number; cooldown: number; aiCooldown: number;
  spells: {used: number; interval: number; remaining: number}[]};

// 0x461d70 sets computer recovery intervals to one (64 processor calls).
export function createTribeCasting(computer: boolean): TribeCasting {
  return {flags: computer ? 32 : 0, cooldown: 0, aiCooldown: 0,
    spells: Array.from({length:22},()=>({used:0,interval:computer?1:0,remaining:0}))};
}

// 0x4c2d80. The unlimited-range flag also bypasses cast-state eligibility.
export function canShamanCast(t: TribeCasting, playerType: number, p: {state: number; flags2: number; flags4: number}) {
  if (t.flags & 0x80000) return true;
  return p.state !== 22 && p.state !== 3 && !t.cooldown && !(p.flags2 & 3) && !(p.flags4 & 0x400)
    && (playerType !== 1 || !t.aiCooldown);
}

// 0x4f2100. These usage limits are separate from one-off spell stock.
export function computerSpellAllowed(t: TribeCasting, aiFlags: number, gameFlags: number, model: number) {
  const d = rules.spellCharging[model], limit = gameFlags & 32 ? d.alternateLimit : d.normalLimit;
  return !(aiFlags & 0x40000) || t.spells[model].used < limit;
}

// Counter/timer portion of 0x4c14c0. The allocator's 0x5bd delay is separate
// and is set even on allocation failure; this function requires successful init.
export function registerSpellCooldown(t: TribeCasting, playerType: number, aiFlags: number, gameFlags: number, openedFilesFlags: number, model: number) {
  if (!(openedFilesFlags & 16) && playerType !== 1) t.cooldown = 12;
  if (playerType !== 2 && (aiFlags & 0x40000)) {
    const s = t.spells[model], d = rules.spellCharging[model];
    if (s.used < (gameFlags & 32 ? d.alternateLimit : d.normalLimit)) s.used++;
    if (!s.remaining) s.remaining = s.interval << 6;
  }
}

// 0x461510's four-tribe timer pass precedes computer processing. Neither the
// special spell mode nor disabled AI processing suppresses this timer pass.
export function stepTribeCastCooldown(t: TribeCasting, active: boolean, landFlags: number, loadFlags: number) {
  if (!(landFlags & 2) && !(loadFlags & 0x200) && active && t.cooldown) t.cooldown = (t.cooldown - 1) & 255;
}

// Opening of 0x4615f0, before the campaign interpreter. Zero timers leave usage
// unchanged. On expiry, another interval starts only if usage remains nonzero.
export function stepComputerCastCooldown(t: TribeCasting, aiFlags: number) {
  if (t.aiCooldown) t.aiCooldown = (t.aiCooldown - 1) & 255;
  if (aiFlags & 0x40000) for (const s of t.spells) {
    if (s.remaining) {
      s.remaining = (s.remaining - 1) & 65535;
      if (!s.remaining && s.used) {
        s.used = (s.used - 1) & 255;
        if (s.used) s.remaining = s.interval << 6;
      }
    }
  }
}

// 0x4c2e30. Range is in native position units. The building is the raw object
// indexed by the caster's terrain cell, not a filtered list of living buildings.
export function nativeSpellRange(gameFlags: number, tribeFlags: number, caster: SpellCaster, model: number) {
  if (tribeFlags & 0x80000) return 0x0fffffff;
  const d = rules.spellCharging[model];
  if (gameFlags & 32) return d.alternateRange | 0;
  const h = (caster.height << 16) >> 16, band = Math.max(0, divide(h, 128));
  const i = Math.min(7, band), bands = rules.spellRangeBands;
  let factor = bands[i];
  if (band < 7) factor = (factor + divide(Math.imul(divide((h - i * 128) * 256, 128), bands[i + 1] - bands[i]), 256)) | 0;
  const range = divide(Math.imul(factor, d.normalRange), 256), b = caster.building;
  return caster.flags2 & 0x800000 && b?.class === 2 && b.model === 4 && b.state === 2 ? (range + divide(range, 3)) | 0 : range;
}

// 0x4f2f50: only task type 20 reserves the attack group's three spell costs.
export function reservedSpellMana(group: {type: number; spells: number[]} | null) {
  let mana = 0;
  if (group?.type === 20) for (const model of group.spells.slice(0,3)) if (model) mana = (mana + rules.spellCharging[model].cost) | 0;
  return mana;
}

// 0x4d1450 / 0x4c2e00. Each readiness byte is a coarse-cell range, not a boolean.
export function spellEntryRanges(gameFlags: number, tribeFlags: number, mana: number, caster: SpellCaster | null, entries: SpellEntry[], reserved: number) {
  return entries.map(e => caster && e.model && ((rules.spellCharging[e.model].cost + e.mana + reserved) | 0) <= mana
    ? divide(nativeSpellRange(gameFlags, tribeFlags, caster, e.model), 512) & 255 : 0);
}

// 0x4f3040. The AI keeps the full signed range here, not the readiness byte.
// Only the caster cell is forced even; callers may pass an odd target cell.
export function computerSpellInRange(gameFlags: number, tribeFlags: number, caster: SpellCaster & {x: number; y: number}, target: number, model: number) {
  const cell = ((caster.x >>> 8) & 254) | (caster.y & 0xfe00);
  const range = divide(nativeSpellRange(gameFlags,tribeFlags,caster,model),512);
  return cellDistanceSquared(target,cell) <= ((Math.imul(range,range) + 2) | 0);
}

export type TargetCaster = SpellCaster & {x:number;y:number;state:number;flags4:number;landIndex:number;
  casting:TribeCasting;playerType:number};
// 0x4c24f0. Results: 1 valid, -1 unavailable, -2 range, -3 bridge placement.
// Cursor blocking and the alternate-mode bridge anchor are native UI inputs.
export function validateSpellTarget(gameFlags:number, tribeFlags:number, origin:{x:number;y:number}, caster:TargetCaster|null,
  model:number, target:{x:number;y:number}, terrainFlags:number, checkCursor:boolean, notify:boolean,
  effects:{cursorBlocked:()=>boolean;bridgeStart:()=>{x:number;y:number};notify:(flags:number,message:number)=>void}) {
  if (model<1 || (checkCursor&&effects.cursorBlocked())) return -1;
  const d=rules.spellCharging[model];
  if ((gameFlags&32)&&d.alternateLimit) {
    const range=tribeFlags&0x80000?0x0fffffff:d.alternateRange|0;
    if (model===12&&positionDistance(origin,effects.bridgeStart())>range) return -2;
    return positionDistance(origin,target)>range?-2:1;
  }
  if (!caster || (caster.flags2&1)) {
    if (!(tribeFlags&0x80000)) return -1;
  } else {
    if (!canShamanCast(caster.casting,caster.playerType,caster)) return -1;
    if (positionDistance(caster,target)>nativeSpellRange(gameFlags,tribeFlags,caster,model)) return -2;
  }
  if (model!==12) return 1;
  if (tribeFlags&0x80000) return terrainFlags&2?-3:1;
  // A valid normal-mode shaman is guaranteed by the checks above.
  if (notify) {
    if (terrainFlags&2) effects.notify(0x8000,0x255);
    if (caster!.landIndex && (caster!.flags4&0x2000000)) effects.notify(0x8000000,0x261);
  }
  return !caster!.landIndex&&!(terrainFlags&2)?1:-3;
}

// 0x4d1340. Entry mode selects defense (nonzero) or offense (zero). The
// native area summary supplies three enemy specialist counts and an enemy total.
export function filterSpellEntries(ranges: number[], entries: {people: number; mode: number}[], defending: boolean, specialists: number[], enemies: number) {
  const people = defending ? (specialists[0]&65535)+(specialists[1]&65535)+(specialists[2]&65535) : enemies&65535;
  for (let i=0;i<ranges.length;i++) if (ranges[i] && (!!entries[i].mode !== defending || people < (entries[i].people&255))) ranges[i]=0;
}

// 0x4c29a0. Disabled charging does not prevent spending existing stock.
export function spellPaymentType(gameFlags: number, ownerFlags: number, stock: SpellStock, model: number) {
  const count = stock.stocks[model] & 15;
  if (gameFlags & 32) return rules.spellCharging[model].alternateLimit && count ? 3 : 0;
  const available = stock.available & (1 << model);
  if (!available && !count) return 0;
  return !count && !(ownerFlags & 8) ? 1 : 3;
}

// Payment portion of 0x4f4de0: stock is consumed before allocation, even if it
// fails. A zero availability type still supplies the price; callers gate casts.
export function prepareSpellPayment(w: Pick<ManaWorld,'gameFlags'|'spells'>, owner: number, ownerFlags: number, model: number) {
  const stock = w.spells[owner];
  if (spellPaymentType(w.gameFlags, ownerFlags, stock, model) !== 3) return rules.spellCharging[model].cost | 0;
  const count = stock.stocks[model] & 15;
  if (count) stock.stocks[model] = (stock.stocks[model] & 240) | (count - 1);
  return 0;
}

// Payment portion of 0x4c14c0 / add_mana: successful initialization debits
// incoming mana. The next distribution updates the computer's retained pool.
export function debitSpellMana(t: Pick<ManaTribe,'available'>, flags: number, price: number) {
  if (!(flags & 8)) t.available = (t.available - price) | 0;
}
