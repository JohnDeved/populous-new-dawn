"""Read-only authentic mesh bank comparison; never execute original software."""
import hashlib, importlib.util, json, pathlib, sys
root=pathlib.Path(sys.argv[1]); project=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('original_import',project/'scripts/import-original.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
expected=json.loads((pathlib.Path(__file__).parent/'banks.json').read_text());actual={}
for bank in [2,6]:
 raw=[(root/f'objects/{k}0-{bank}.dat').read_bytes() for k in ['objs','facs','pnts']]
 actual[str(bank)]={'inputs':{f'{k}0-{bank}.dat':hashlib.sha256(b).hexdigest() for k,b in zip(['objs','facs','pnts'],raw)},'models':{str(i):hashlib.sha256(json.dumps(module.decode_original_model(*raw,i)[0],sort_keys=True,separators=(',',':')).encode()).hexdigest() for i in range(87,91)}}
assert actual==expected
assert actual['2']['models']==actual['6']['models']
print(json.dumps(actual,indent=2))
