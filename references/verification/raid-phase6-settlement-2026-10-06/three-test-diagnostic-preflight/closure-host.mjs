import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname, relative, extname } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const root=process.cwd(), folder=resolve(root,'work/orchestration/preacher-raid-regressions-20261006')
const queue=[resolve(folder,'diagnostic.mjs')], seen=new Set(), external=new Set(), files={}
while(queue.length) {
  const path=queue.pop()
  if(seen.has(path))continue
  seen.add(path)
  const raw=readFileSync(path)
  files[relative(root,path)]=createHash('sha256').update(raw).digest('hex')
  if(!['.ts','.mjs','.js'].includes(extname(path)))continue
  let source=raw.toString()
  if(extname(path)==='.ts')source=stripTypeScriptTypes(source,{mode:'strip'})
  for(const [,specifier] of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)) {
    if(specifier.startsWith('.')) {
      const target=resolve(dirname(path),specifier)
      assert.ok(existsSync(target),target)
      queue.push(target)
    } else external.add(specifier)
  }
}
assert.ok([...external].every(name=>name.startsWith('node:')),JSON.stringify([...external]))
const closure={kind:'Static runtime import closure after built-in TypeScript stripping; no imported module executed',external:[...external].sort(),files:Object.fromEntries(Object.entries(files).sort())}
writeFileSync(resolve(folder,'import-closure.json'),JSON.stringify(closure,null,2)+'\n')
console.log(JSON.stringify({localFiles:seen.size,external:[...external].sort(),nativeCalls:0,appExecution:false,packageAccess:false}))
