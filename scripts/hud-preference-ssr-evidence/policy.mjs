import assert from 'node:assert/strict'
export const URL = 'https://49ad051f-populous-new-dawn.webtorrent.workers.dev/'
export const APP = '5a90b78b5c4745d7f6accc4bfa7247782d43af8f'
export const LIMITS = Object.freeze({ wall: 240000, cleanup: 10000, case: 45000, server: 15000, navigation: 12000, action: 5000, launch: 15000, contexts: 5, navigations: 6, images: 8, html: 6, imageBytes: 4*1024**2, htmlBytes: 2*1024**2, evidenceBytes: 48*1024**2, diagnosticCount: 256, diagnosticChars: 2048 })
export function admitTarget(url, redirected = false) {
  assert.equal(url, URL, 'Only the exact approved version root may be navigated')
  assert.equal(redirected, false, 'Unexpected document redirect')
}
export class Budget {
  constructor(clock, maximum, outer = Infinity) { this.clock=clock; this.end=Math.min(clock()+maximum,outer) }
  left(cap = Infinity) { const left=Math.floor(Math.min(cap,this.end-this.clock())); assert.ok(left>0,'Deadline exhausted'); return left }
}
export class Counts {
  constructor() { this.contexts=0;this.navigations=0;this.images=0;this.html=0;this.bytes=0;this.diagnostics=0 }
  context() { assert.ok(++this.contexts<=LIMITS.contexts,'Context cap') }
  navigation(url, redirected) { admitTarget(url,redirected); assert.ok(++this.navigations<=LIMITS.navigations,'Navigation cap') }
  record(kind,size) {
    assert.ok(Number.isSafeInteger(size)&&size>=0,'Invalid output size')
    assert.ok(['image','html','json'].includes(kind),'Unknown output kind')
    if(kind==='image') { assert.ok(size<=LIMITS.imageBytes,'Image cap');assert.ok(this.images+1<=LIMITS.images,'Image count cap') }
    if(kind==='html') { assert.ok(size<=LIMITS.htmlBytes,'HTML cap');assert.ok(this.html+1<=LIMITS.html,'HTML count cap') }
    assert.ok(this.bytes+size<=LIMITS.evidenceBytes,'Evidence cap')
    this.bytes+=size;if(kind==='image')this.images++;if(kind==='html')this.html++
  }
  diagnostic(text) { assert.ok(++this.diagnostics<=LIMITS.diagnosticCount,'Diagnostic count cap');assert.ok(text.length<=LIMITS.diagnosticChars,'Diagnostic text cap') }
}
export class HeldStartup {
  constructor(clock) { this.clock=clock;this.events={};this.released=false;this.observed=false }
  intercept() { assert.equal(this.events.intercept,undefined,'Duplicate held request');this.events.intercept=this.clock() }
  observation() { assert.notEqual(this.events.intercept,undefined,'Missing held request');assert.equal(this.released,false,'Request already released');assert.ok(this.clock()-this.events.intercept<=3000,'Pending observation deadline');this.observed=true;this.events.observation=this.clock() }
  release(reason) { if(this.released)return false;assert.notEqual(this.events.intercept,undefined);this.released=true;this.events.release=this.clock();this.events.reason=reason;return true }
  complete(status) { assert.equal(this.released,true);assert.equal(status,200,'Original composition response must succeed');this.events.complete=this.clock();this.events.status=status }
  verify() { assert.equal(this.observed,true,'No pending-startup proof');assert.equal(this.events.reason,'observed','Deadline/cleanup release is not acceptance');assert.ok(this.events.release-this.events.intercept<=4000,'Release deadline');assert.equal(this.events.status,200,'No original response completion') }
}
export function hydrationDiagnostic(text) { return /hydrat|server[- ]rendered|did not match|Minified React error #(418|419|421|422|423|425)\b/i.test(text) }

export function admitDeployment(value) {
  assert.equal(value.version,1);assert.equal(value.sha,APP);assert.equal(value.source,42236689124);assert.equal(value.sourceAttempt,1);assert.equal(value.pr,885);assert.equal(value.status,'preview-published')
  const lines=value.output.split('\n')
  assert.equal(lines.filter(line=>line.startsWith('Worker Version ID:')).length,1)
  assert.equal(lines.filter(line=>line.startsWith('Version Preview URL:')).length,1)
  assert.ok(lines.includes('Worker Version ID: 49ad051f-3138-456f-ac4e-2fdf91bc1cb3'))
  assert.ok(lines.includes('Version Preview URL: '+URL.slice(0,-1)))
}
export function admitRuntime(value,hash) { assert.equal(value.approved,true);assert.equal(value.bindingSha256,hash) }

// Used directly by the top-level document route. No redirect follow or fallback.
export async function guardDocumentResponse(route, timeout) {
  const request=route.request()
  admitTarget(request.url(),!!request.redirectedFrom())
  const response=await route.fetch({maxRedirects:0,maxRetries:0,timeout})
  try {
    admitTarget(response.url())
    assert.equal(response.status(),200,'Only the approved 200 document may be fulfilled; redirects rejected')
    assert.match(response.headers()['content-type']??'',/text\/html/i)
    const body=await response.body()
    assert.ok(body.length<=LIMITS.htmlBytes,'HTML cap')
    await route.fulfill({response,body})
  } finally { await response.dispose() }
}
