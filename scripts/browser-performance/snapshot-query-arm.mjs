// Separately selected v5 observation; no comparison or schema migration.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, realpathSync, lstatSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { createSnapshotFixture, validateSnapshotFixture, loadSnapshot } from './snapshot-setup.mjs'
import { captureSnapshotQueryArm } from './snapshot-query-arm-core.mjs'
import { captureSnapshotQueryWitness } from './snapshot-query-witness.mjs'
import { readerDependencyManifest, readerBundleManifest, readerBuildProvenance, readerSourceEvidence } from './reader-build.mjs'
import { inspectDragSource } from './snapshot-drag-contract.mjs'
import { readerImportSha256 } from './snapshot-reader-proof.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

export default async function snapshotQueryArm(options) {
  // The hosted owner must qualify this exact source closure before import.
  // All adapter preflight is inside the core's browser ownership finally.
  let root, dependencies, bundle
  const repository = resolve(import.meta.dirname, '../..')
  return captureSnapshotQueryArm(options, {
    checkpointVersion: CHECKPOINT_VERSION,
    prepareReaders: () => {
      root = realpathSync(options.output)
      assert.equal(root, resolve(options.output)); assert.ok(lstatSync(root).isDirectory())
      assert.ok(options.dist, 'Source/runtime reader provenance required')
      dependencies = readerDependencyManifest(repository); bundle = readerBundleManifest(options.dist)
      const dragSource = inspectDragSource(repository), readerSource = readerSourceEvidence(repository, dragSource)
      assert.ok(readerSource.profile && readerSource.importSha256 === readerImportSha256, 'Unadmitted source/import reader contract')
      const readerProvenance = readerBuildProvenance(repository, dependencies, bundle,
        ['scripts/tutorial-browser/build-home.mjs', 'scripts/tutorial-browser/fixture/main.tsx', 'scripts/browser-performance/reader-build.mjs'])
      return { readerSource, readerProvenance, dependencies, bundle, dragSource }
    },
    createFixture: args => {
      assert.equal(hash(readFileSync(new URL('./snapshot-setup.mjs', import.meta.url))), options.expectedGeneratorSha256)
      assert.equal(hash(readFileSync(new URL('../tutorial-browser/checkpoint-codec.mjs', import.meta.url))), options.expectedCodecSha256)
      return createSnapshotFixture(args)
    },
    validateFixture: validateSnapshotFixture, loadSnapshot, captureQueries: captureSnapshotQueryWitness,
    verifyReaders: () => {
      assert.equal(readerDependencyManifest(repository).sha256, dependencies.sha256)
      assert.deepEqual(readerBundleManifest(options.dist), bundle)
    },
    writeExclusive: (name, text) => { assert.equal(typeof root, 'string'); writeFileSync(resolve(root, name), text, { flag: 'wx' }) },
  })
}
