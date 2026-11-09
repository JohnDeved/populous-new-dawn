"""Pure fixture runner under Python isolated mode; never imports runtime entry points."""
from pathlib import Path
import importlib.util, sys, unittest

def load(name):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).resolve().parent/(name+'.py'))
    module=importlib.util.module_from_spec(spec);sys.modules[name]=module;spec.loader.exec_module(module)
    return module
if __name__=='__main__':
    load('finalizer');load('supervisor');load('launch');load('runtime_binding')
    suite=unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromModule(load(name)) for name in ['supervisor_test','finalizer_test','runtime_binding_test'])
    raise SystemExit(0 if unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful() else 1)
