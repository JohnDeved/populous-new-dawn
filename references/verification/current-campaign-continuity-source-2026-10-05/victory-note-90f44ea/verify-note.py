from pathlib import Path
import hashlib,json,re,struct,subprocess
base='3b899125cc8cedef938823718ad5d44f49957b66';evidence='473da60f62d8a08e95a18d9802d4444e71a4c636';native='5f8298e898ac4a1ae624c066dee3515b09e7940a'
folder='references/verification/current-campaign-victory-2026-10-05';report=f'{folder}/README.md';png=f'{folder}/victory.png';index='references/README.md';public='references/verification/current-campaign-continuity-source-2026-10-05/mission-three-victory-ce37f851'
git=lambda *args:subprocess.check_output(['git',*args]);sha=lambda b:hashlib.sha256(b).hexdigest()
changed=git('diff','--name-only',base,'HEAD').decode().splitlines();assert sorted(changed)==sorted([report,png,index]),changed
image=Path(png).read_bytes();published=git('show',f'{evidence}:{public}/campaign-continuity/mission-three-segment-02/m3-genuine-campaign-victory-result.png');assert image==published;assert sha(image)=='61c3c6f51925190ae4374c31ed5e41ccbbac33cce022a29b74f5a90e44683154';assert struct.unpack('>II',image[16:24])==(1440,1000)
text=Path(report).read_text();links=re.findall(r'\]\(([^)]+)\)',text);objects=[]
for url in links:
 if url.startswith('https:'):
  m=re.fullmatch(r'https://github.com/JohnDeved/populous-new-dawn/blob/([a-f0-9]{40})/(.+)',url);assert m,url;commit,path=m.groups();assert commit in[evidence,native];content=git('show',f'{commit}:{path}');objects.append({'url':url,'bytes':len(content),'sha256':sha(content)})
 else:assert(Path(folder)/url).is_file(),url
assert f'(verification/current-campaign-victory-2026-10-05/README.md)' in Path(index).read_text()
review=json.loads(git('show',f'{evidence}:{public}/independent-review/review.json'));assert sha(git('show',f'{evidence}:{public}/independent-review/review.json'))=='8946a7b3ad332038c7bbaf622e5ffd61aa0bdbde8b6f7498ed430249f8d47198'
s=json.loads(git('show',f'{evidence}:{public}/campaign-continuity/mission-three-segment-02/m3-genuine-campaign-victory-result.json'));assert(s['level'],s['turn'],s['status'],s['paused'])==(3,13480,'won',True);assert not any(u['team']=='yellow'for u in s['units']);assert[(b['id'],b['hp'],b['inside'])for b in s['buildings']if b['team']=='yellow']==[(1023,52,0),(1022,65,0)]
assert sum(u['team']=='blue'and u['kind']=='warrior'for u in s['units'])==5
j=json.loads(git('show',f'{evidence}:{public}/campaign-continuity/mission-three-segment-02/journey.json'));assert len(j['failures'])==3 and len(j['controlStops'])==2;assert j['protectedLatest']['checkpoint']['turn']==9047
assert sha(git('show',f'{native}:evidence/native-sermon-order-handoff/independent-review.md'))=='4b7b648eed2168b608fec24aca07b8e6cd153adbdd573b15193c8ff7b3bf80f6'
assert 'no captured-terrain native Erosion replay' in text and 'supplied flat world' in text and 'intercepted audio/selection/acknowledgement' in text
assert 'read back at 22:51:34.515 UTC' in text and 'No application, QA driver, private profile' in text
result={'status':'passed','head':git('rev-parse','HEAD').decode().strip(),'base':base,'files':changed,'pngSha256':sha(image),'pngBytes':len(image),'dimensions':[1440,1000],'immutableLinks':objects,'reviewSha256':'8946a7b3ad332038c7bbaf622e5ffd61aa0bdbde8b6f7498ed430249f8d47198','nativeReviewSha256':'4b7b648eed2168b608fec24aca07b8e6cd153adbdd573b15193c8ff7b3bf80f6','scope':'Docs/image/index integrity and source-bound fact checks only; no browser/profile/package activity'}
print(json.dumps(result,indent=2))
