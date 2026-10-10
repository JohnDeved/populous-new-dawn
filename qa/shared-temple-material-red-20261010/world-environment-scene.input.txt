// Execute the production constructor's authored-resource assignment and preload
// statements. IO/GPU are supplied by tests; selection/loading decisions are not.
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = ts.createSourceFile('scene.ts', readFileSync(new URL('../../app/scene.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
const sceneClass = source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'GameScene')
const constructor = sceneClass.members.find(ts.isConstructorDeclaration)
const assignment = name => constructor.body.statements.find(node => ts.isExpressionStatement(node) && node.expression.left?.getText(source) === `this.${name}`)
const execute = (body, scene, bindings) => {
  const js = ts.transpileModule(`(function(){${body}})`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  return new Function(...Object.keys(bindings), `return ${js}`)(...Object.values(bindings)).call(scene)
}
export async function bindSceneEnvironment(scene) {
  const statement = assignment('environment')
  // Before the correction this assignment is absent. The real terrain/model
  // callers still execute and fail on their existing c/2 resource selection.
  if (statement) execute(statement.getText(source), scene, { world: scene.world, ...await import('../../app/world-environment.ts') })
}
export async function preloadScene(scene, terrain) {
  const preload = constructor.body.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => declaration.name.getText(source) === 'preload'))
  const { default: nativeUnits } = await import('../../app/original-units.json')
  const { vaultKnowledgeAtlas } = await import('../../app/vault-appearance.ts')
  const { templeArt } = await import('../../app/temple-art.ts')
  execute(`${preload.getText(source)}\n${assignment('ready').getText(source)}`, scene, {
    world: scene.world, terrain, nativeUnits, vaultKnowledgeAtlas, templeArt,
    ...await import('../../app/scene-assets.ts'),
  })
  return scene.ready
}
