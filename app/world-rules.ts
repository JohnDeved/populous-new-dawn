import type { Unit, Spell, BuildingKind } from './world-types.ts'
import type { UnitKind } from './unit-kinds.ts'
import constants from './original-constants.json' with { type: 'json' }

export const isShaman = (u: Pick<Unit, 'kind' | 'ghost'>) => u.kind === 'shaman' && !u.ghost
export const TURNS_PER_SECOND = 12
export const unitSpeed = (u: Unit) =>
  u.kind === 'shaman'
    ? constants.MEDICINE_MAN_SPEED
    : u.kind === 'warrior'
      ? constants.WARRIOR_SPEED
      : u.kind === 'spy'
        ? constants.SPY_SPEED
      : u.kind === 'firewarrior'
        ? constants.SUPER_WARRIOR_SPEED
        : u.kind === 'preacher'
          ? constants.RELIGIOUS_SPEED
          : constants.BRAVE_SPEED
export const SPELLS: {
  id: Spell
  model: number
  name: string
  cost: number
  key: string
  symbol: string
  color: string
  description: string
}[] = [
  {
    id: 'blast',
    model: 2,
    name: 'Blast',
    cost: 10,
    key: '1',
    symbol: '✹',
    color: '#e8b076',
    description: 'Rechargeable · throws followers back. Water is deadly.',
  },
  {
    id: 'convertWild',
    model: 17,
    name: 'Convert Wild',
    cost: 10,
    key: '',
    symbol: '✦',
    color: '#f1e1a2',
    description: 'Recruits nearby wild people to your tribe.',
  },
  {
    id: 'hypnotise',
    model: 7,
    name: 'Hypnotise',
    cost: 85,
    key: '',
    symbol: '◈',
    color: '#d5a6e6',
    description: 'Temporarily turns up to six nearby enemy followers to your tribe.',
  },
  {
    id: 'ghostArmy',
    model: 9,
    name: 'Ghost Army',
    cost: 18,
    key: '',
    symbol: '◇',
    color: '#b9dcff',
    description: 'Creates ghost followers that vanish when they meet an enemy.',
  },
  {
    id: 'bridge',
    model: 12,
    name: 'Land Bridge',
    cost: 70,
    key: '2',
    symbol: '≋',
    color: '#bbca8a',
    description: 'Worship the southern stone head. Cast from one shore onto the other.',
  },
  {
    id: 'lightning',
    model: 3,
    name: 'Lightning',
    cost: 80,
    key: '3',
    symbol: 'ϟ',
    color: '#c6b8f2',
    description: 'Four gifts from the central stone head. A direct hit kills a follower.',
  },
  {
    id: 'flatten',
    model: 15,
    name: 'Flatten',
    cost: 125,
    key: '4',
    symbol: '▰',
    color: '#c7a77b',
    description: 'Levels nearby terrain to the height beneath the target.',
  },
  {
    id: 'erosion',
    model: 10,
    name: 'Erosion',
    cost: 210,
    key: '5',
    symbol: '▽',
    color: '#98b9a5',
    description: 'Cuts branching channels through nearby high ground.',
  },
  {
    id: 'swamp',
    model: 11,
    name: 'Swamp',
    cost: 100,
    key: '6',
    symbol: '◉',
    color: '#718763',
    description: 'Creates a persistent trap that swallows up to ten people.',
  },
  {
    id: 'firestorm',
    model: 8,
    name: 'Firestorm',
    cost: 400,
    key: '7',
    symbol: '☄',
    color: '#d6653d',
    description: 'Rains fire that burns buildings and blasts nearby followers.',
  },
  {
    id: 'earthquake',
    model: 14,
    name: 'Earthquake',
    cost: 175,
    key: '8',
    symbol: '≋',
    color: '#9b755c',
    description: 'Tears open the ground and damages buildings across the fault.',
  },
  {
    id: 'volcano',
    model: 16,
    name: 'Volcano',
    cost: 800,
    key: '',
    symbol: '▲',
    color: '#c95632',
    description: 'Raises a volcano that destroys nearby buildings and reshapes the land.',
  },
  {
    id: 'tornado',
    model: 4,
    name: 'Tornado',
    cost: 90,
    key: '9',
    symbol: '↻',
    color: '#aeb5b8',
    description: 'A roaming whirlwind that carries followers away and throws them clear.',
  },
  {
    id: 'shield',
    model: 19,
    name: 'Magical Shield',
    cost: 60,
    key: '0',
    symbol: '◌',
    color: '#8fd7ff',
    description: 'Protects up to six nearby followers for two minutes.',
  },
  {
    id: 'invisibility',
    model: 6,
    name: 'Invisibility',
    cost: 50,
    key: '',
    symbol: '◐',
    color: '#a9b7c6',
    description: 'Conceals up to six nearby followers until they fight or the spell expires.',
  },
  {
    id: 'swarm',
    model: 5,
    name: 'Swarm',
    cost: 40,
    key: '',
    symbol: '※',
    color: '#d8c56e',
    description: 'Sends enemy followers fleeing in panic.',
  },
]
export const BUILDINGS: {
  id: BuildingKind
  name: string
  cost: number
  symbol: string
  description: string
}[] = [
  {
    id: 'hut',
    name: 'Hut',
    cost: 3,
    symbol: '⌂',
    description: 'Three logs. Send braves inside to breed faster and generate more mana.',
  },
  {
    id: 'tower',
    name: 'Guard Tower',
    cost: 5,
    symbol: '△',
    description: 'Five logs. A follower stationed inside watches and defends the surrounding area.',
  },
  {
    id: 'camp',
    name: 'Warrior Training Hut',
    cost: 8,
    symbol: '⚔',
    description: 'Eight logs. Unlock at the vault, then send braves inside to train with mana.',
  },
  {
    id: 'temple',
    name: 'Temple',
    cost: 8,
    symbol: '☼',
    description: 'Eight logs. Unlock at the vault, then send braves inside to train as preachers.',
  },
  {
    id: 'spyHut',
    name: 'Spy Training Hut',
    cost: 8,
    symbol: '◈',
    description: 'Eight logs. Unlock at the vault, then send braves inside to train as Spies.',
  },
  {
    id: 'firewarriorHut',
    name: 'Firewarrior Training Hut',
    cost: 8,
    symbol: '✹',
    description:
      'Eight logs. Unlock at the vault, then send braves inside to train as Firewarriors.',
  },
  {
    id: 'boatHouse',
    name: 'Boat House',
    cost: 5,
    symbol: '⚓',
    description: 'Five logs. Unlock at the vault, then build at the shore to launch a Boat.',
  },
  {
    id: 'balloonHut',
    name: 'Balloon Hut',
    cost: 11,
    symbol: '◉',
    description: 'Eleven logs. Unlock at the vault, then send braves inside to launch a Balloon.',
  },
]
export const SIZE = 96,
  GRID = 97
export const PLANET_RADIUS = 70
export const maxHp = (kind: UnitKind) =>
  (kind === 'shaman'
    ? constants.LIFE_SHAMEN
    : kind === 'warrior'
      ? constants.LIFE_WARR
      : kind === 'spy'
        ? constants.LIFE_SPY
      : kind === 'firewarrior'
        ? constants.LIFE_SWARR
        : kind === 'preacher'
          ? constants.LIFE_PREACH
          : constants.LIFE_BRAVE) / 20
export const buildingHp = (kind: BuildingKind) => (kind === 'hut' ? 170 : 260)
export const ROUTE_FAILURE_TEXT = "One or more of your people can't get to this point."
