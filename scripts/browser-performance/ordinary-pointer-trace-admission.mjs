import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {pathToFileURL} from 'node:url'
import {resolve} from 'node:path'

const repo = 'JohnDeved/populous-new-dawn'
const api = `https://api.github.com/repos/${repo}`
const owner = user => user?.id === 24187269 && user?.login === 'JohnDeved' && user?.type === 'User'
const workflowRef = `${repo}/.github/workflows/ordinary-pointer-trace.yml@refs/heads/main`

// One explicitly authorized comment, not distributed deduplication. Never retry selection automatically.
export function ordinaryPointerTraceSelection(event, env) {
  return env.GITHUB_EVENT_NAME === 'issue_comment' && event?.action === 'created' &&
    env.GITHUB_RUN_ATTEMPT === '1' && env.GITHUB_REF === 'refs/heads/main' &&
    env.GITHUB_REPOSITORY === repo && env.GITHUB_REPOSITORY_ID === '1365430845' &&
    env.GITHUB_WORKFLOW_REF === workflowRef && env.GITHUB_WORKFLOW_SHA === env.GITHUB_SHA && env.GITHUB_ACTOR === 'JohnDeved' &&
    env.GITHUB_ACTOR_ID === '24187269' && env.GITHUB_TRIGGERING_ACTOR === 'JohnDeved' &&
    /^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? '') &&
    event?.repository?.id === 1365430845 && event.repository.full_name === repo &&
    event.repository.default_branch === 'main' && owner(event.sender) &&
    event?.issue?.number === 898 && event.issue.url === `${api}/issues/898` &&
    event.issue.pull_request?.url === `${api}/pulls/898` &&
    Number.isSafeInteger(event?.comment?.id) && event.comment.id > 0 &&
    event.comment.issue_url === `${api}/issues/898` && owner(event.comment.user) &&
    event.comment.author_association === 'OWNER' &&
    event.comment.body === `/ordinary-pointer-trace ${env.GITHUB_SHA}`
}

async function readJson(url, token) {
  const response = await fetch(url, {redirect:'error', signal:AbortSignal.timeout(10000),
    headers:{Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28'}})
  assert.equal(response.status,200,'Comment admission API request failed')
  const chunks=[];let size=0
  for await (const chunk of response.body) {
    size += chunk.length; assert.ok(size <= 1024*1024,'Comment admission response exceeds cap'); chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export async function verifyOrdinaryPointerTraceComment(event, env, get = readJson) {
  assert.equal(ordinaryPointerTraceSelection(event,env),true,'Unauthorized trace diagnostic comment')
  assert.ok(typeof env.GH_TOKEN === 'string' && env.GH_TOKEN.length > 0,'Read-only GitHub token required')
  const pr = await get(`${api}/pulls/898`,env.GH_TOKEN)
  assert.equal(pr.id,5114325745); assert.equal(pr.number,898); assert.equal(pr.url,`${api}/pulls/898`)
  assert.equal(pr.merged,true); assert.equal(pr.state,'closed'); assert.equal(pr.base?.ref,'main')
  assert.equal(pr.base.repo.id,1365430845); assert.equal(pr.base.repo.full_name,repo)
  const comment = await get(`${api}/issues/comments/${event.comment.id}`,env.GH_TOKEN)
  assert.equal(comment.id,event.comment.id); assert.equal(comment.url,`${api}/issues/comments/${event.comment.id}`)
  assert.equal(comment.issue_url,`${api}/issues/898`); assert.equal(owner(comment.user),true)
  assert.equal(comment.author_association,'OWNER'); assert.equal(comment.body,event.comment.body)
  // Last API read: fail closed if main advanced during preparation. Checkout always stays pinned.
  const main = await get(`${api}/git/ref/heads/main`,env.GH_TOKEN)
  assert.equal(main.ref,'refs/heads/main'); assert.equal(main.url,`${api}/git/refs/heads/main`)
  assert.equal(main.object?.type,'commit'); assert.equal(main.object.sha,env.GITHUB_SHA)
  return {event:'issue_comment',commentId:comment.id,ownerId:comment.user.id,sha:env.GITHUB_SHA,
    runId:env.GITHUB_RUN_ID,attempt:1,selection:'one-authorized-comment-no-automatic-retry',
    currentMainVerified:true,atomicMainLock:false}
}

export function verifyOrdinaryPointerTraceEnvironment(env=process.env) {
  return verifyOrdinaryPointerTraceComment(JSON.parse(readFileSync(env.GITHUB_EVENT_PATH,'utf8')),env)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await verifyOrdinaryPointerTraceEnvironment()
  console.log(JSON.stringify(result))
}
