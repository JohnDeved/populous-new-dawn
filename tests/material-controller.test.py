import copy
import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('material_controller', ROOT / 'scripts/material-lifecycle-evidence/controller.py')
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)


def valid():
    source = dict(commit=c.REVISION, tree=c.TREE, status='', untracked=[])
    return dict(observerJoined=True, resources=dict(failure=None, unexpectedFailure=None,
        sampleCount=2, sampledPeakOwnerRssBytes=100, history=[dict(executables=['/browser'], positiveRss=True)]),
        survivors=[], payload=dict(exitCode=0, stopReason=None, failure=None, cleanupFailure=None),
        sourceBefore=source, sourceAfter=copy.deepcopy(source),
        opening=dict(MemAvailable=c.OPENING_MEMORY, availableBytes=4*1024**3, freeInodes=40000),
        browser=dict(version=c.BROWSER_VERSION, sha256=c.BROWSER_SHA256,
                     archiveSha256=c.ARCHIVE_SHA256, sandbox=True),
        timing=dict(envelopeSeconds=2, payloadSeconds=1, harnessSeconds=.8,
                    browserLaunchSeconds=.2, serverReadinessSeconds=.3, cleanupSeconds=.1),
        rawLengths={'transport.stdout': 100, 'server.log': 50},
        finalBudget=dict(evidenceBytes=100, allocatedBytes=100, MemAvailable=3*1024**3,
                         availableBytes=3*1024**3, freeInodes=40000),
        contract={'status':'passed','moduleSha256':c.CONTRACT_SHA256}, contractSha256=c.CONTRACT_SHA256,
        screenshots={name:dict(verifiedPng=True, bytes=100, sha256='b'*64) for name in c.SCREENSHOTS},
        rendering={'webglVersion':'WebGL 2.0 synthetic fixture'})


class PolicyTests(unittest.TestCase):
    def reject(self, mutate):
        value=valid(); mutate(value)
        with self.assertRaises((ValueError,KeyError,TypeError)):
            c.validate_terminal(value, '/browser')
    def test_positive_is_only_pending_review(self):
        self.assertEqual(c.validate_terminal(valid(), '/browser')['status'], 'passed-pending-independent-rendered-review')
    def test_late_observer_failure(self):
        self.reject(lambda x:x['resources'].update(unexpectedFailure='late sample failed'))
    def test_not_joined(self):
        self.reject(lambda x:x.update(observerJoined=False))
    def test_missing_samples(self):
        self.reject(lambda x:x['resources'].update(sampleCount=0))
    def test_cleanup_unknown(self):
        self.reject(lambda x:x.update(survivors=None))
    def test_cleanup_survivor(self):
        self.reject(lambda x:x.update(survivors=[{'pid':123}]))
    def test_nonzero_payload(self):
        self.reject(lambda x:x['payload'].update(exitCode=1))
    def test_cleanup_failure(self):
        self.reject(lambda x:x['payload'].update(cleanupFailure={'message':'unknown'}))
    def test_rss_limit(self):
        self.reject(lambda x:x['resources'].update(sampledPeakOwnerRssBytes=2147483649))
    def test_nan(self):
        self.reject(lambda x:x['resources'].update(sampledPeakOwnerRssBytes=float('nan')))
    def test_source_drift(self):
        self.reject(lambda x:x['sourceAfter'].update(tree='other'))
    def test_wrong_candidate(self):
        self.reject(lambda x:(x['sourceAfter'].update(commit='other'),x['sourceBefore'].update(commit='other')))
    def test_missing_positive_browser(self):
        self.reject(lambda x:x['resources'].update(history=[]))
    def test_unpinned_browser(self):
        self.reject(lambda x:x['browser'].update(sha256='other'))
    def test_disabled_sandbox(self):
        self.reject(lambda x:x['browser'].update(sandbox=False))
    def test_opening_memory(self):
        self.reject(lambda x:x['opening'].update(MemAvailable=c.OPENING_MEMORY-1))
    def test_continuing_memory(self):
        self.reject(lambda x:x['finalBudget'].update(MemAvailable=0))
    def test_all_time_caps(self):
        for key, limit in [('envelopeSeconds',240),('payloadSeconds',210),('harnessSeconds',180),
                           ('browserLaunchSeconds',30),('serverReadinessSeconds',60),('cleanupSeconds',5)]:
            with self.subTest(key=key):
                self.reject(lambda x:x['timing'].update({key:limit+.1}))
    def test_combined_raw_cap(self):
        self.reject(lambda x:x.update(rawLengths={'a':16000000,'b':1000000}))
    def test_receipt_reserve(self):
        self.reject(lambda x:x['finalBudget'].update(evidenceBytes=c.LIMITS['evidence_bytes']-65536))
    def test_self_consistent_substitute_contract(self):
        self.reject(lambda x:(x.update(contractSha256='a'*64),x['contract'].update(moduleSha256='a'*64)))
    def test_contract_failure(self):
        self.reject(lambda x:x['contract'].update(status='failed'))
    def test_acknowledgement_not_screenshot(self):
        self.reject(lambda x:x.update(screenshots={}))
    def test_incomplete_screenshot(self):
        self.reject(lambda x:x['screenshots']['replacement.png'].update(verifiedPng=False))
    def test_webgl_provenance(self):
        self.reject(lambda x:x['rendering'].update(webglVersion='WebGL 1.0'))
    def test_execution_disabled(self):
        with self.assertRaises(RuntimeError): c.execute()
    def test_only_original_harness_flags(self):
        command=c.harness_command('/node','/game','/probe','/output','/browser')
        self.assertEqual(command[-4:],['--port','4198','--timeout','180000'])
        self.assertNotIn('--no-sandbox',command)
    def test_symlink_ancestor(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); (root/'real').mkdir(); (root/'link').symlink_to(root/'real')
            with self.assertRaises(ValueError): c.harness_command('/node',root/'link','/probe','/output','/browser')
    def test_parent_traversal(self):
        with self.assertRaises(ValueError): c.harness_command('/node','/game/../other','/probe','/output','/browser')

if __name__=='__main__': unittest.main()
