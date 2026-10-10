// Isolated local-test configuration; never changes the game's deployment config.
import { readFileSync } from 'node:fs'
import vinext from 'vinext'
import { cloudflare } from '@cloudflare/vite-plugin'
import { resolve } from 'node:path'
const root = process.env.POPULOUS_GAME_ROOT
if (!root) throw Error('POPULOUS_GAME_ROOT is required')
const hosting = JSON.parse(readFileSync(resolve(root, '.openai/hosting.json'), 'utf8'))
export default {
  root,
  cacheDir: resolve(root, 'work/local-render-vite-cache-tornado-4393'),
  server: { watch: { ignored: ['**/work/**'] } },
  plugins: [vinext(), cloudflare({
    inspectorPort: false,
    viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    config: {
      main: resolve(root, 'worker/index.ts'),
      compatibility_flags: ['nodejs_compat'],
      d1_databases: hosting.d1 ? [{ binding: hosting.d1, database_name: 'local-render-test', database_id: '00000000-0000-4000-8000-000000000000' }] : [],
      r2_buckets: hosting.r2 ? [{ binding: hosting.r2, bucket_name: 'local-render-test' }] : [],
    },
  })],
}
