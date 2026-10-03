import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { skyEnvironment } from '../app/sky-environment.ts'
import { missionData } from '../app/mission-data.ts'

test('normal early mission data selects each original backdrop and both cloud layers', () => {
  for (const [level, bank, suffix] of [[1, 12, ''], [2, 28, '-s'], [3, 25, '-p']]) {
    assert.equal(missionData(level).level.landscapeBank, bank)
    assert.deepEqual(skyEnvironment(bank), {
      backdrop: `sky${suffix}`,
      clouds: [`clouds${suffix}`, `clouds-high${suffix}`],
      typeOne: false,
    })
  }
})

test('same-bank Mission 10 uses the same p sky set without mission-number overrides', () => {
  assert.equal(missionData(10).level.landscapeBank, 25)
  assert.deepEqual(skyEnvironment(missionData(10).level.landscapeBank), skyEnvironment(25))
})

test('previous bank d and g sky modes and unhandled banks remain unchanged', () => {
  assert.deepEqual(skyEnvironment(13), {
    backdrop: 'sky-d', clouds: ['clouds-d', 'clouds-high-d'], typeOne: false,
  })
  assert.deepEqual(skyEnvironment(16), {
    backdrop: 'sky', clouds: ['clouds', 'clouds-high'], typeOne: true,
  })
  assert.deepEqual(skyEnvironment(0), skyEnvironment(12))
  assert.deepEqual(skyEnvironment(7), skyEnvironment(12))
})

test('early mission sky PNGs preserve exact original bytes', () => {
  const assets = {
    'sky-s': '77d128e30013429d46e16af4027a96d9badff16c814a731467afdce6d5b3556c',
    'clouds-s': '7e89bb2c0e44d2dff3b482fb315bf8ff0602df31a0e1e3daee436b74a9c59134',
    'clouds-high-s': '03a8afaba9e2e9570f902959e59dcc7c9cb0c9014d27f8973281228cf288e90c',
    'sky-p': '552578d0cc9de5a026f99425377aa1ee47d8eb2655b39e3bac29dfd058d06987',
    'clouds-p': '8c8e716aaa4f83050f239ee0ccf13ed81535c85be0209c31b2131c629b8c9a64',
    'clouds-high-p': '4451cc7feb91c902cd1de930e4b263a83a16dda02ae81f73b0020104be3d450a',
  }
  for (const [name, expected] of Object.entries(assets)) {
    const bytes = readFileSync(new URL(`../public/original/${name}.png`, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, name)
  }
})
