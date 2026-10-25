from contextlib import nullcontext
from copy import deepcopy
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parents[1]/'scripts/material-lifecycle-evidence'
sys.path.insert(0,str(HERE))
import qualification_review as q
import hosted_entry as entry

class QualificationTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)/'qualification/evidence';self.root.mkdir(parents=True)
        self.tools={'python':'/usr/bin/python3','bwrap':'/usr/bin/bwrap','readonly':['/tmp/tools']}
        self.ref={'terminal':{'path':str(self.root/'terminal.json'),'sha256':'sealed'},'finalBudget':{}}
        gate={'hostPid':30,'namespacePid':2,'startTicks':100,'initStartTicks':99,'pidNamespace':'pid:[77]'}
        history=[{'pid':30,'startTicks':100,'namespaces':['pid:[77]'],'positiveRss':True,
                  'executables':['/usr/bin/python3'],'parents':[29],'sessions':[29]}]
        cases={}
        for name in q.CASES:
            cases[name]={'result':{'gateBinding':gate,'exitCode':0,'stopReason':None,'failure':None,
                                 'survivors':[],'cleanupFailure':None},
                         'resources':{'sampleCount':3,'sampledPeakOwnerRssBytes':1000,'failure':None,
                                      'failureMarker':None,'unexpectedFailure':None,'gateBinding':gate,'history':deepcopy(history)}}
            (self.root/name/'control').mkdir(parents=True)
        sentinel=str(self.root.parent/'sentinels'/'sentinel')
        for name in ('readonly','frozen'):
            denied=[str(self.root.parent/'sentinels'/leaf) for leaf in ('sentinel','alias','link')]
            denied+=['/proc/'+pid+'/root'+sentinel for pid in ('1','2')]
            if name=='frozen':denied+=['/pnd-fixture/node_modules/state.json']
            self.save(name,'control/result.json',{'preparationHostAliasAbsent':True,'allVisibleProcRootAliasesChecked':True,
                'pythonCommandAlias':{'bareCommandExecuted':True,'readonly':True,'path':'/usr/bin/python3','inode':[27,123],
                                      'readonlyMountFlags':q.os.ST_RDONLY,'writeDeniedErrno':q.errno.EACCES},
                'deniedPaths':denied,'visiblePrivateProcesses':{pid:{'pid':int(pid),'pidNamespace':'pid:[77]','nspid':[int(pid)],'ppid':0 if pid=='1' else 1,'startTicks':99 if pid=='1' else 100} for pid in ('1','2')}})
        self.save('rename','control/result.json',{'fixtureOnlyNotPnpm':True,'state':{'sha256':'identity'}})
        cases['clock']['result'].update(producer={'clock':'CLOCK_BOOTTIME','durationUpperBoundSeconds':.5},wallSeconds=3)
        cases['escape']['resources']['history'].append({'pid':31,'parents':[30],'sessions':[31],'positiveRss':True})
        cases['overflow']['result'].update(failure={'type':'ValueError','message':'Outer raw output hard byte cap exceeded','injectedFault':None},
            stopReason='ValueError: Outer raw output hard byte cap exceeded',storedRawBytes=1024**2,observedRawBytes=1024**2+10,
            initialSurvivors=[{'pid':31}]) # Expected: cleanup removed a previously live process.
        cases['observer']['result'].update(failure={'type':'QualificationObservationFault','injectedFault':'fault'},stopReason='injected',survivors=None)
        self.save('observer','independent-cleanup-proof.json',{'injectedFault':'fault','knownLiveSurvivors':[],
            'payloadOutcomeRetained':'failed-or-unknown','payloadWasNotRelabeled':True})
        self.terminal={'kind':'shared-execution-qualification','error':None,'adapterSha256':'identity','platform':'linux',
            'capabilities':['qualified'],'cases':cases,'selectedBackend':{'python':'/usr/bin/python3','bwrap':'/usr/bin/bwrap'},
            'tools':{'/tmp/tools':'inventory'},'limits':q.LIMITS.copy(),'sentinelInputs':['unchanged'],
            'pnpmExecuted':False,'applicationExecuted':False}
        self.verified=0;self.accepted=[]
        def sealed(ref):self.verified+=1;return deepcopy(self.terminal)
        def observer(result):
            q.policy.require(result['failure']=={'type':'QualificationObservationFault','injectedFault':'fault'} and
                             result['survivors'] is None and result['stopReason'], 'Wrong injected fault')
        self.shared=types.SimpleNamespace(__file__='/tmp/helper/shared_execution.py',VERSION=1,CAPABILITIES=['qualified'],
            STATE='state.json',QUALIFIER_OBSERVER_FAULT='fault',verify_sealed_receipt=sealed,
            file_identity=lambda p,**k:({'sha256':'identity','key':[27,123]} if str(p)=='/usr/bin/python3' else {'sha256':'identity'}),inventory_hash=lambda p:'inventory',
            tree_inventory=lambda p:['unchanged'],Limits=lambda **k:k,require_qualifier_observer_failure=observer,
            save_new=lambda p,v:self.accepted.append(v),backend_qualification=lambda *a:None)
    def save(self,name,leaf,value):
        (self.root/name/leaf).write_text(json.dumps(value))
    def review(self):return q.review(self.shared,self.ref,self.tools,Path(self.tmp.name)/'backend.json')
    def rejects(self):
        with self.assertRaises((ValueError,KeyError)):self.review()
        self.assertEqual(self.accepted,[])
    def test_valid_actual_semantics_accept_and_reseal(self):
        self.review();self.assertEqual(self.verified,2);self.assertEqual(self.accepted[0]['status'],'accepted')
    def recorded_observer_fault(self):
        resources=self.terminal['cases']['observer']['resources']
        resources.update(failure='Observer failure: QualificationObservationFault: Injected persistent qualification observation failure',
                         failureMarker='fault')
        return resources
    def test_recorded_expected_observer_timing_accepts(self):
        self.recorded_observer_fault();self.review();self.assertEqual(self.accepted[0]['status'],'accepted')
    def test_unrecorded_expected_observer_timing_accepts(self):
        self.assertIsNone(self.terminal['cases']['observer']['resources']['failure'])
        self.review();self.assertEqual(self.accepted[0]['status'],'accepted')
    def test_recorded_observer_wrong_marker_rejected(self):
        self.recorded_observer_fault()['failureMarker']='wrong';self.rejects()
    def test_recorded_observer_missing_marker_rejected(self):
        self.recorded_observer_fault()['failureMarker']=None;self.rejects()
    def test_recorded_observer_unrelated_error_rejected(self):
        self.recorded_observer_fault()['failure']='Observer failure: OSError: unrelated';self.rejects()
    def test_recorded_observer_unexpected_failure_rejected(self):
        self.recorded_observer_fault()['unexpectedFailure']='late unrelated failure';self.rejects()
    def test_expected_marker_cannot_waive_other_case_failure(self):
        self.terminal['cases']['readonly']['resources']=deepcopy(self.recorded_observer_fault());self.rejects()
    def test_status_alone_is_not_acceptance(self):self.terminal['cases'].pop('escape');self.rejects()
    def test_wrong_adapter(self):self.terminal['adapterSha256']='other';self.rejects()
    def test_wrong_tools(self):self.terminal['tools']['/tmp/tools']='changed';self.rejects()
    def test_duplicate_mount(self):self.tools['readonly']*=2;self.rejects()
    def test_sentinel_changed(self):self.shared.tree_inventory=lambda p:['changed'];self.rejects()
    def test_limit_expansion(self):self.terminal['limits']['cleanup_seconds']=60;self.rejects()
    def test_pnpm_cannot_be_sentinel(self):self.terminal['pnpmExecuted']=True;self.rejects()
    def test_missing_positive_memory(self):self.terminal['cases']['frozen']['resources']['sampledPeakOwnerRssBytes']=0;self.rejects()
    def test_joined_failure(self):self.terminal['cases']['clock']['resources']['unexpectedFailure']={'type':'x'};self.rejects()
    def test_wrong_namespace(self):self.terminal['cases']['readonly']['resources']['history'][0]['namespaces']=[];self.rejects()
    def test_unrelated_observer_failure(self):self.terminal['cases']['observer']['result']['failure']={'type':'Oops'};self.rejects()
    def test_observer_relabel_forbidden(self):self.terminal['cases']['observer']['result']['survivors']=[];self.rejects()
    def test_unknown_observer_cleanup(self):
        self.save('observer','independent-cleanup-proof.json',{'knownLiveSurvivors':None});self.rejects()
    def test_initial_overflow_survivors_allowed_only_after_cleanup(self):
        self.terminal['cases']['overflow']['result']['survivors']=[31];self.rejects()
    def test_wrong_overflow_failure(self):self.terminal['cases']['overflow']['result']['failure']['message']='timeout';self.rejects()
    def test_raw_overflow_not_observed(self):self.terminal['cases']['overflow']['result']['observedRawBytes']=100;self.rejects()
    def test_fake_readonly_count(self):
        path=self.root/'readonly/control/result.json';value=json.loads(path.read_bytes());value['deniedPaths']=['x']*5
        path.write_text(json.dumps(value));self.rejects()
    def test_missing_private_init_alias(self):
        path=self.root/'readonly/control/result.json';value=json.loads(path.read_bytes());del value['visiblePrivateProcesses']['1']
        path.write_text(json.dumps(value));self.rejects()
    def alias(self,case='readonly'):
        path=self.root/case/'control/result.json';return path,json.loads(path.read_bytes())
    def test_python_alias_requires_each_exact_identity_field(self):
        for key,value in [('bareCommandExecuted',False),('readonly',False),('path','/foreign/python3'),
                          ('inode',[27,999]),('inode',[True,123]),('readonlyMountFlags',0),
                          ('readonlyMountFlags',True),('writeDeniedErrno',1),('writeDeniedErrno',True)]:
            with self.subTest(key=key,value=value):
                path,proof=self.alias();original=path.read_text();proof['pythonCommandAlias'][key]=value
                path.write_text(json.dumps(proof));self.rejects();path.write_text(original)
    def test_python_alias_missing_proof_rejected_in_both_cases(self):
        for case in ('readonly','frozen'):
            path,proof=self.alias(case);original=path.read_text();del proof['pythonCommandAlias']
            path.write_text(json.dumps(proof));self.rejects();path.write_text(original)
    def test_python_alias_extra_unreviewed_fields_rejected(self):
        path,proof=self.alias();proof['pythonCommandAlias']['skipped']=True
        path.write_text(json.dumps(proof));self.rejects()
    def test_python_alias_all_three_readonly_denial_errnos_accepted(self):
        for error in (q.errno.EROFS,q.errno.EACCES,q.errno.ETXTBSY):
            path,proof=self.alias();proof['pythonCommandAlias']['writeDeniedErrno']=error
            path.write_text(json.dumps(proof));self.accepted.clear();self.review()
            self.assertEqual(self.accepted[0]['status'],'accepted')

    def test_rename_identity_changed(self):self.save('rename','control/result.json',{'fixtureOnlyNotPnpm':True,'state':{}});self.rejects()
    def test_clock_not_separate(self):self.terminal['cases']['clock']['result']['wallSeconds']=.8;self.rejects()
    def test_no_escaped_session(self):self.terminal['cases']['escape']['resources']['history'].pop();self.rejects()
    def test_seal_changed_during_review(self):
        original=self.shared.verify_sealed_receipt
        def verify(ref):
            value=original(ref)
            if self.verified==2:value['error']='changed'
            return value
        self.shared.verify_sealed_receipt=verify;self.rejects()

class DispatchTests(unittest.TestCase):
    def run_entry(self,qualification_status='passed',proof_status='passed-pending-rendered-review'):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        dest=Path(self.tmp.name)/'run'
        saved={};calls=[]
        def save(path,value):saved[str(path)]=value;path.write_text(json.dumps(value))
        shared=types.SimpleNamespace(envelope=lambda n:nullcontext(),assert_capacity=lambda *a,**k:None,
            host_snapshot=lambda p:{'MemAvailable':entry.policy.OPENING_MEMORY},save_new=save,
            file_identity=lambda p,**k:{'sha256':'identity'},inventory_hash=lambda p:'inventory',
            qualify_backend=lambda *a:{'status':qualification_status,'error':None if qualification_status=='passed' else 'denied'})
        value={'sharedAdapter':{'path':'/tmp/other-helper/shared.py','sha256':'identity'},'checkout':'/tmp/other-checkout',
               'tools':{'readonly':['/tmp/other-tools'],'python':'/usr/bin/python3'},'git':'/usr/bin/git',
               'installation':{},'toolRoots':{},'browser':{}}
        def execute(spec,path):calls.append((spec,path));return {'status':proof_status,'error':None if proof_status.startswith('passed') else 'sandbox denied'}
        with patch.object(entry.hosted_resources,'guard',return_value=nullcontext()),\
             patch.object(entry.execution,'load_shared',return_value=shared),patch.object(entry,'admit'),\
             patch.object(entry.policy,'material_limits'),patch.object(entry.fresh,'build_profile',return_value={'version':2}),\
             patch.object(entry.qualification_review,'review',return_value={'accepted':'verified'}),\
             patch.object(entry.execution,'execute',side_effect=execute):
            result=entry.run(value,dest)
            with self.assertRaisesRegex(ValueError,'Fresh single-attempt'):entry.run(value,dest)
        return result,calls,saved
    def test_accepted_qualifier_reaches_one_controller(self):
        result,calls,_=self.run_entry();self.assertEqual(len(calls),1);self.assertEqual(result['status'],'passed-pending-rendered-review')
        self.assertEqual(calls[0][0]['backend'],{'accepted':'verified'});self.assertEqual(calls[0][1].name,'attempt-01')
    def test_failed_qualifier_never_dispatches(self):
        result,calls,_=self.run_entry('failed-or-unknown');self.assertEqual(calls,[]);self.assertEqual(result['status'],'failed-or-unknown')
    def test_sandbox_failure_not_retried_or_relabelled(self):
        result,calls,_=self.run_entry(proof_status='failed-or-unknown');self.assertEqual(len(calls),1);self.assertEqual(result['error'],'sandbox denied')

if __name__=='__main__':unittest.main()
