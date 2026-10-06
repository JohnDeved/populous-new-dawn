import ast
import subprocess
from pathlib import Path
head='af314f0230d2a2ef66bf44c9e3e69b97635106fc'
manifest='f6151550615395f305651deb5f41046a99c71432be05c7054928868707b854ed'
python='/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python'
node='/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node'
for name in ['scripts/probe-native-raid-phase6.py','scripts/run-preacher-response-once.py']:
    ast.parse(Path(name).read_text(),filename=name)
for command in [[python,'-E','-s','-B','scripts/probe-native-raid-phase6.py'],
                [python,'-E','-s','-B','scripts/run-preacher-response-once.py','--settlement']]:
    subprocess.run(command+['--expected-source-head',head,'--expected-manifest-sha',manifest],check=True)
subprocess.run([node,'--check','scripts/raid-phase6-pair.mjs'],check=True)
print('PASS: frozen host preflight, AST and Node syntax; native/app invocations0')
