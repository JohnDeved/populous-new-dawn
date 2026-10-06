import ast
import subprocess
from pathlib import Path
head='bc5debd5c0271efc9cd892111563cc740eeebc91'
manifest='bd01037046ca3e8b846f43c7eb1370ea5da9dbef6ebeb288c25f58fb507aeb77'
python='/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python'
node='/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node'
for name in ['scripts/probe-native-raid-phase6.py','scripts/run-preacher-response-once.py']:
    ast.parse(Path(name).read_text(),filename=name)
for command in [[python,'-E','-s','-B','scripts/probe-native-raid-phase6.py'],
                [python,'-E','-s','-B','scripts/run-preacher-response-once.py','--settlement']]:
    subprocess.run(command+['--expected-source-head',head,'--expected-manifest-sha',manifest],check=True)
subprocess.run([node,'--check','scripts/raid-phase6-pair.mjs'],check=True)
print('PASS: frozen host preflight, AST and Node syntax; native/app invocations0')
