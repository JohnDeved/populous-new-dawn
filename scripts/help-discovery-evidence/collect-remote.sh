#!/usr/bin/env bash
# Fixed read-only GitHub projections. No project command or test can run here.
set -euo pipefail
ulimit -c 0
ulimit -f 1024
test "$#" = 1
output="$1"
test -d "$output"
[[ "${GITHUB_RUN_ID}" =~ ^[0-9]+$ ]]
[[ "${GITHUB_RUN_ATTEMPT}" = 1 ]]
[[ "${GITHUB_SHA}" =~ ^[0-9a-f]{40}$ ]]
[[ "${PND_INFRA_PR}" =~ ^[0-9]+$ ]]
test "$GITHUB_REPOSITORY" = JohnDeved/populous-new-dawn
test "$GITHUB_EVENT_NAME" = pull_request
test -n "$GH_TOKEN"
export GH_PROMPT_DISABLED=1 GH_HOST=github.com GIT_CONFIG_NOSYSTEM=1
export GIT_CONFIG_GLOBAL=/dev/null
export GH_CONFIG_DIR="$RUNNER_TEMP/help943-empty-gh-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
mkdir -m 700 "$GH_CONFIG_DIR"
trap 'rmdir "$GH_CONFIG_DIR" 2>/dev/null || true' EXIT

python3 -I -B - "$output" <<'PY'
import json, os, pathlib
out = pathlib.Path(os.sys.argv[1])
fs = os.statvfs(out)
assert fs.f_bavail * fs.f_frsize >= 160 * 1024**2 and fs.f_favail >= 128
event_cap = 2 * 1024 * 1024
with pathlib.Path(os.environ['GITHUB_EVENT_PATH']).open('rb') as stream:
    data = stream.read(event_cap + 1)
assert len(data) <= event_cap
event = json.loads(data)
def source(value):
    return {k: value[k] for k in ('sha', 'ref')} | {'repo': {'full_name': value['repo']['full_name']}}
pr = event['pull_request']
projected = {k: pr[k] for k in ('number', 'state', 'draft')}
projected.update(head=source(pr['head']), base=source(pr['base']))
context = dict(repository=os.environ['GITHUB_REPOSITORY'], eventName=os.environ['GITHUB_EVENT_NAME'],
    sha=os.environ['GITHUB_SHA'], runId=os.environ['GITHUB_RUN_ID'], attempt=os.environ['GITHUB_RUN_ATTEMPT'],
    event=dict(action=event['action'], label={'name': event['label']['name']},
               sender={'id': event['sender']['id']}, pull_request=projected),
    runner=json.loads(os.environ['PND_RUNNER_CONTEXT']), job=json.loads(os.environ['PND_JOB_CONTEXT']))
with (out / 'context.json').open('x') as stream:
    json.dump(context, stream, indent=2)
    stream.write('\n')
PY

api() {
  local name="$1" endpoint="$2" projection="$3"
  test ! -e "$output/$name.json"
  # Fixed GNU timeout owns this trusted gh read. There is no automatic retry.
  timeout --signal=TERM --kill-after=2s 12s gh api --hostname github.com "$endpoint" \
    --jq "$projection" > "$output/$name.json"
}
repo=repos/JohnDeved/populous-new-dawn
pr_projection='{number,state,draft,head:{sha:.head.sha,ref:.head.ref,repo:{full_name:.head.repo.full_name}},base:{sha:.base.sha,ref:.base.ref,repo:{full_name:.base.repo.full_name}}}'
runs_projection='{total_count,workflow_runs:[.workflow_runs[]|{id,run_attempt,event,head_sha,head_branch,status,conclusion,workflow_id,path}]}'
api main "$repo/git/ref/heads/main" '{sha:.object.sha}'
api infrastructure "$repo/pulls/$PND_INFRA_PR" "$pr_projection"
api infrastructureMerge "$repo/git/commits/$GITHUB_SHA" '{sha,tree:{sha:.tree.sha},parents:[.parents[]|{sha}]}'
api target "$repo/pulls/943" "$pr_projection"
api targetCommit "$repo/git/commits/a1f506f82e8c95b55ca1b1c7dde1b5217f266466" '{sha,tree:{sha:.tree.sha},parents:[.parents[]|{sha}]}'
api run "$repo/actions/runs/$GITHUB_RUN_ID" '{id,run_attempt,event,head_sha,head_branch,status,workflow_id,path,actor:{id:.actor.id},triggering_actor:{id:.triggering_actor.id}}'
api jobs "$repo/actions/runs/$GITHUB_RUN_ID/attempts/1/jobs?per_page=100" '{total_count,jobs:[.jobs[]|{id,run_id,run_attempt,name,status,conclusion,runner_id,runner_name,runner_group_id,runner_group_name,labels,started_at,completed_at}]}'
api ledger "$repo/actions/workflows/help-discovery-evidence.yml/runs?per_page=100" "$runs_projection"
for status in queued in_progress waiting pending requested; do
  api "active-$status" "$repo/actions/runs?status=$status&per_page=100" "$runs_projection"
done

# Only these public projections are retained; never copy gh config or credentials.
python3 -I -B - "$output" <<'PY'
import hashlib, json, os, pathlib, shutil, sys
out = pathlib.Path(sys.argv[1]); rows = {}
for name in ('python3', 'gh', 'git', 'timeout'):
    path = pathlib.Path(shutil.which(name)).resolve()
    assert path.is_file() and path.stat().st_size <= 128 * 1024 * 1024
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(65536), b''):
            digest.update(chunk)
    rows[name] = dict(path=str(path), bytes=path.stat().st_size, sha256=digest.hexdigest())
rows['pythonVersion'] = sys.version
with (out / 'tools.json').open('x') as stream:
    json.dump(rows, stream, indent=2)
    stream.write('\n')
PY
