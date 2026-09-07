import rules from './original-rules.json' with {type: 'json'};
import type {ManaTribe, ManaWorld, SpellStock} from './mana.ts';

export type SpellCaster = {height: number; flags2: number;
  building: {class: number; model: number; state: number} | null};
export type SpellEntry = {model: number; mana: number};
const divide = (a: number, b: number) => Math.trunc(a / b) | 0;

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
