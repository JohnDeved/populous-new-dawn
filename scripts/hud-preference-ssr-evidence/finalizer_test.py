"""Portable synthetic final consumer tests. No browser, processes, /proc or network."""
import copy, json, tempfile, time, unittest
from pathlib import Path
from finalizer import CASES,HTML,PNG,CAP,validate_result,inventory,verify_binding,check_time

def good():
    binding={'application':'app','url':'https://fixed/','composition':{'sha256':'digest','bytes':583816}}
    cases=[]
    for name,seed,enabled,blocked,count in zip(CASES,[None,None,'1.5','invalid','2.5'],[False,True,True,True,True],[False,False,False,False,True],[0,1,4,1,2]):
        cases.append({'name':name,'seed':seed,'javaScriptEnabled':enabled,'blockedHudRead':blocked,'status':'passed','measurements':[{} for _ in range(count)]})
    cases[0]['serverDom']={'shell':True,'hud':True,'restore':True,'effectsNotClaimed':True}
    cases[2]['pendingEvents']={'intercept':0,'observation':2000,'release':2100,'reason':'observed','status':200}
    cases[2]['compositionResponse']=binding['composition'].copy()
    report={'status':'passed-awaiting-pixel-review','application':'app','url':'https://fixed/','cases':cases,
        'documents':[{'name':name,'url':'https://fixed/','status':200,'contentType':'text/html'} for name in HTML],
        'images':[{'name':name} for name in PNG], 'counts':{'contexts':5,'navigations':6,'html':6,'images':8},
        'diagnostics':[],'cleanup':[{'context':name,'closed':True} for name in CASES]+[{'owner':'browser','closed':True}],
        'browserVersion':'observed','elapsedMs':1000}
    owner={'status':'passed-awaiting-evidence-review','exitCode':0,'stopReason':None,'failures':[],
        'cleanupComplete':True,'laneReleasePermitted':True,'inputStability':True,'remainingOwned':{},'unreadableProcessIdentities':[],
        'processCleanupComplete':True,'runtimeTemporary':{'retired':True,'outsidePathAbsent':True,'socketPathBytes':62,
            'identity':{'device':1,'inode':2,'uid':1000,'mode':0o700},'retiredIdentity':{'device':1,'inode':2,'uid':1000,'mode':0o700}},
        'runtimeHome':{'allocated':True,'identity':{'device':1,'inode':3,'uid':1000,'mode':0o700},
                       'verifiedAfterProcessAbsence':True,'retainedInOutput':True},
        'sampledProfilePeak':{'temporaryBytes':2,'homeBytes':3,'totalBytes':5},
        'sampledOwnedPeakRss':7,'sampledOwnedPeakProcesses':{'processes':[{'pid':12,'ppid':10,'start':100,'rss':7,'state':'S'}],'truncated':False},
        'streams':{'stdout':{'overflow':False},'stderr':{'overflow':False}}}
    return report,owner,binding

class MembershipDiagnosticTests(unittest.TestCase):
    def test_added_removed_names_and_counts_are_bounded(self):
        from finalizer import membership_delta
        self.assertEqual(membership_delta(['old','same'],['new','same']),
                         {'added':{'count':1,'names':['new'],'truncated':False},'removed':{'count':1,'names':['old'],'truncated':False}})
        result=membership_delta([],['x'*300]+[str(i) for i in range(40)])
        self.assertEqual(result['added']['count'],41);self.assertEqual(len(result['added']['names']),32)
        self.assertTrue(result['added']['truncated'])
        self.assertEqual(len(membership_delta([],['x'*300])['added']['names'][0]),256)

    def test_mismatch_still_fails_with_names_and_on_truncation(self):
        with tempfile.TemporaryDirectory() as base:
            root=Path(base);(root/'new').write_text('not read')
            binding={'files':[],'links':[],'directories':{str(root):{'excluded':[],'names':['old']}}}
            with self.assertRaisesRegex(AssertionError,'Runtime directory membership changed:') as error:
                verify_binding(binding,time.monotonic()+5)
            self.assertIn('new',str(error.exception));self.assertIn('old',str(error.exception))
            for i in range(40):(root/str(i)).touch()
            with self.assertRaisesRegex(AssertionError,'"truncated":true'):verify_binding(binding,time.monotonic()+5)

class FinalConsumerTests(unittest.TestCase):
    def test_exact_good(self):validate_result(*good())
    def test_new_resource_proof_missing_or_false_never_passes(self):
        for key in ['runtimeHome','sampledProfilePeak','sampledOwnedPeakRss','sampledOwnedPeakProcesses']:
            report,owner,binding=good();del owner[key]
            with self.assertRaises((AssertionError,KeyError,TypeError)):validate_result(report,owner,binding)
        for key in ['allocated','verifiedAfterProcessAbsence','retainedInOutput']:
            for value in [False,None,1]:
                report,owner,binding=good();owner['runtimeHome'][key]=value
                with self.assertRaises(AssertionError):validate_result(report,owner,binding)
        for key in ['identity','allocated','verifiedAfterProcessAbsence','retainedInOutput']:
            report,owner,binding=good();del owner['runtimeHome'][key]
            with self.assertRaises((AssertionError,KeyError,TypeError)):validate_result(report,owner,binding)
        for key,value in [('mode',0o755),('uid',1001),('inode',None),('device',-1)]:
            report,owner,binding=good();owner['runtimeHome']['identity'][key]=value
            with self.assertRaises(AssertionError):validate_result(report,owner,binding)

    def test_combined_profile_proof_requires_exact_sum_and_single_limit(self):
        for key in ['temporaryBytes','homeBytes','totalBytes']:
            for value in [-1,True,1.5,'3']:
                report,owner,binding=good();owner['sampledProfilePeak'][key]=value
                with self.assertRaises(AssertionError):validate_result(report,owner,binding)
            report,owner,binding=good();del owner['sampledProfilePeak'][key]
            with self.assertRaises(KeyError):validate_result(report,owner,binding)
        for profile in [{'temporaryBytes':2,'homeBytes':3,'totalBytes':4},
                        {'temporaryBytes':256*1024**2,'homeBytes':256*1024**2+1,'totalBytes':512*1024**2+1}]:
            report,owner,binding=good();owner['sampledProfilePeak']=profile
            with self.assertRaises(AssertionError):validate_result(report,owner,binding)
        report,owner,binding=good();owner['sampledProfilePeak']={'temporaryBytes':256*1024**2,'homeBytes':256*1024**2,'totalBytes':512*1024**2}
        validate_result(report,owner,binding)

    def test_peak_proof_requires_complete_unique_numeric_rows_and_unchanged_limit(self):
        for key in ['processes','truncated']:
            report,owner,binding=good();del owner['sampledOwnedPeakProcesses'][key]
            with self.assertRaises(KeyError):validate_result(report,owner,binding)
        for value in [True,None,0]:
            report,owner,binding=good();owner['sampledOwnedPeakProcesses']['truncated']=value
            with self.assertRaises(AssertionError):validate_result(report,owner,binding)
        for key in ['pid','start','rss']:
            for value in [-1,True,1.5,'7']:
                report,owner,binding=good();owner['sampledOwnedPeakProcesses']['processes'][0][key]=value
                with self.assertRaises(AssertionError):validate_result(report,owner,binding)
            report,owner,binding=good();del owner['sampledOwnedPeakProcesses']['processes'][0][key]
            with self.assertRaises(KeyError):validate_result(report,owner,binding)
        for value in [-1,True,1.5,'7',8,1536*1024**2+1]:
            report,owner,binding=good();owner['sampledOwnedPeakRss']=value
            with self.assertRaises(AssertionError):validate_result(report,owner,binding)
        for rows in [[{'pid':12,'start':100,'rss':3},{'pid':12,'start':101,'rss':4}],
                     [{'pid':0,'start':100,'rss':7}],
                     [{'pid':i+1,'start':i,'rss':0} for i in range(257)]]:
            report,owner,binding=good();owner['sampledOwnedPeakProcesses']['processes']=rows
            owner['sampledOwnedPeakRss']=sum(row['rss'] for row in rows)
            with self.assertRaises(AssertionError):validate_result(report,owner,binding)
        for peak in [1536*1024**2,1536*1024**2+1]:
            report,owner,binding=good();owner['sampledOwnedPeakRss']=peak;owner['sampledOwnedPeakProcesses']['processes'][0]['rss']=peak
            if peak==1536*1024**2:validate_result(report,owner,binding)
            else:
                with self.assertRaises(AssertionError):validate_result(report,owner,binding)
    def test_missing_reordered_cases_and_evidence(self):
        for field in ['cases','documents','images']:
            for operation in ['missing','duplicate','unexpected']:
                report,owner,binding=good()
                if operation=='missing':report[field].pop()
                elif operation=='duplicate':report[field][0]=copy.deepcopy(report[field][1])
                else:report[field][0]['name']='unexpected'
                with self.assertRaises(AssertionError):validate_result(report,owner,binding)
        report,owner,binding=good();report['cases'].reverse()
        with self.assertRaises(AssertionError):validate_result(report,owner,binding)
    def test_owner_failure_never_accepted(self):
        for key,value in [('exitCode',1),('stopReason','deadline'),('failures',['error']),('cleanupComplete',False),
                          ('laneReleasePermitted',False),('inputStability',False),('remainingOwned',{'12':{}}),
                          ('unreadableProcessIdentities',[12]),('status','failed')]:
            report,owner,binding=good();owner[key]=value
            with self.assertRaises(AssertionError):validate_result(report,owner,binding)
    def test_temp_retirement_cannot_substitute_for_process_absence_or_failed_retirement(self):
        for key,value in [('retired',False),('outsidePathAbsent',False),('retiredIdentity',{}),('socketPathBytes',108)]:
            report,owner,binding=good();owner['runtimeTemporary'][key]=value
            with self.assertRaises(AssertionError):validate_result(report,owner,binding)
        report,owner,binding=good();owner['processCleanupComplete']=False
        with self.assertRaises(AssertionError):validate_result(report,owner,binding)
    def test_pending_timeout_and_wrong_composition_fail(self):
        for key,value in [('observation',3001),('release',4001),('reason','cleanup'),('status',500)]:
            report,owner,binding=good();report['cases'][2]['pendingEvents'][key]=value
            with self.assertRaises(AssertionError):validate_result(report,owner,binding)
    def test_absolute_deadline(self):
        with self.assertRaises(TimeoutError):check_time(time.monotonic()-1)
    def test_payload_rejects_unknown_symlinks_and_large_files(self):
        with tempfile.TemporaryDirectory(prefix='hud-finalizer-') as temp:
            root=Path(temp);p=root/'unknown';p.write_bytes(b'x')
            with self.assertRaises(AssertionError):inventory(root,time.monotonic()+5)
            p.unlink();p=root/'runtime.stdout';p.symlink_to('/dev/null')
            with self.assertRaises(AssertionError):inventory(root,time.monotonic()+5)
            p.unlink()
            with p.open('wb') as stream:stream.truncate(CAP+1)
            with self.assertRaises(AssertionError):inventory(root,time.monotonic()+5)
    def test_directory_membership_mutation_fails(self):
        with tempfile.TemporaryDirectory(prefix='hud-membership-') as temp:
            binding={'files':[],'links':[],'directories':{temp:{'names':[],'excluded':[]}}}
            verify_binding(binding,time.monotonic()+5)
            (Path(temp)/'unexpected').write_text('x')
            with self.assertRaises(AssertionError):verify_binding(binding,time.monotonic()+5)

# These fixtures call the production file finalizer, not a substitute implementation.
import hashlib
from unittest.mock import patch
import finalizer
from finalizer import finalize_payload,verify_payload,failure_payload,bounds_for_upload,authoritative_return
from launch import write_upload_safety

def complete_files(root):
    report,owner,binding=good()
    binding.update(identity={'candidateSha':'app','workflowSha':'infra','runId':'123','runAttempt':'1'})
    (root/'binding.json').write_text(json.dumps(binding))
    digest=hashlib.sha256((root/'binding.json').read_bytes()).hexdigest()
    report['sourceBindingSha256']=digest;owner['bindingSha256']=digest
    (root/'runtime-admission.json').write_text(json.dumps({'identity':binding['identity']}))
    evidence=root/'evidence';evidence.mkdir()
    for item in report['documents']+report['images']:
        data=('synthetic '+item['name']).encode();(evidence/item['name']).write_bytes(data)
        item.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
    (evidence/'receipt.json').write_text(json.dumps(report))
    return report,owner,binding

class ActualFinalizationTests(unittest.TestCase):
    def test_complete_payload_readback_and_final_return(self):
        with tempfile.TemporaryDirectory(prefix='hud-complete-') as tmp:
            root=Path(tmp);report,owner,binding=complete_files(root);deadline=time.monotonic()+5
            finalize_payload(root,binding,owner,deadline)
            result=verify_payload(root,deadline)
            self.assertEqual(len([n for n in result['files'] if n.endswith('.png')]),8)
            self.assertEqual(len([n for n in result['files'] if n.endswith('.html')]),6)
            self.assertEqual(authoritative_return(root,owner,deadline),0)
            self.assertEqual(bounds_for_upload(root,deadline),{'exitCode':0,'uploadSafe':True})
    def test_actual_missing_reordered_corrupt_artifacts_fail_acceptance(self):
        for variant in ['missing','reordered','corrupt']:
            with self.subTest(variant=variant),tempfile.TemporaryDirectory(prefix='hud-invalid-') as tmp:
                root=Path(tmp);report,owner,binding=complete_files(root)
                if variant=='missing':(root/'evidence'/PNG[0]).unlink()
                elif variant=='corrupt':(root/'evidence'/PNG[0]).write_bytes(b'corrupt')
                else:
                    report['documents'].reverse();(root/'evidence/receipt.json').write_text(json.dumps(report))
                finalize_payload(root,binding,owner,time.monotonic()+5)
                self.assertEqual(owner['status'],'failed')
                verify_payload(root,time.monotonic()+5)
                self.assertEqual(authoritative_return(root,owner,time.monotonic()+5),1)
    def test_expiry_during_actual_copy_and_inventory_persistence(self):
        for boundary in ['copy','inventory-persistence']:
            with self.subTest(boundary=boundary),tempfile.TemporaryDirectory(prefix='hud-expiry-') as tmp:
                root=Path(tmp);report,owner,binding=complete_files(root);clock=[0]
                original_open=Path.open;original_write=Path.write_bytes
                def open_file(path,*args,**kwargs):
                    result=original_open(path,*args,**kwargs)
                    if boundary=='copy' and args and args[0]=='xb' and 'payload' in path.parts:clock[0]=11
                    return result
                def write_file(path,data):
                    result=original_write(path,data)
                    if boundary=='inventory-persistence' and path.name=='artifact-inventory.json':clock[0]=11
                    return result
                with patch.object(finalizer.time,'monotonic',lambda:clock[0]),patch.object(Path,'open',open_file),patch.object(Path,'write_bytes',write_file):
                    with self.assertRaises(TimeoutError):finalize_payload(root,binding,owner,10)
                failure_payload(root,TimeoutError(boundary))
                verify_payload(root,time.monotonic()+5)
                self.assertFalse(json.loads((root/'payload/supervisor-blocker.json').read_text())['acceptance'])
    def test_expiry_and_corruption_during_actual_final_inventory_verification(self):
        for boundary in ['expiry','corruption']:
            with self.subTest(boundary=boundary),tempfile.TemporaryDirectory(prefix='hud-inventory-') as tmp:
                root=Path(tmp);report,owner,binding=complete_files(root);clock=[0];calls=[0]
                original=finalizer.inventory
                def inspect(directory,deadline):
                    calls[0]+=1
                    if calls[0]==2:
                        if boundary=='expiry':clock[0]=11
                        else:(Path(directory)/'evidence'/PNG[0]).write_bytes(b'corrupt')
                    return original(directory,deadline)
                with patch.object(finalizer.time,'monotonic',lambda:clock[0]),patch.object(finalizer,'inventory',inspect):
                    with self.assertRaises((TimeoutError,AssertionError)) as failure:finalize_payload(root,binding,owner,10)
                if boundary=='expiry':failure_payload(root,failure.exception)
                self.assertEqual(bounds_for_upload(root,time.monotonic()+5),{'exitCode':0 if boundary=='expiry' else 1,'uploadSafe':True})
                blocker=json.loads((root/'payload/supervisor-blocker.json').read_text())
                self.assertFalse(blocker['acceptance'])
    def test_actual_authoritative_return_expiry_is_nonpassing(self):
        with tempfile.TemporaryDirectory(prefix='hud-terminal-') as tmp:
            root=Path(tmp);report,owner,binding=complete_files(root)
            finalize_payload(root,binding,owner,time.monotonic()+5)
            self.assertEqual(authoritative_return(root,owner,time.monotonic()-1),1)
            self.assertEqual(owner['status'],'failed');self.assertTrue(owner['finalDeadlineExceeded'])
            verify_payload(root,time.monotonic()+5)
            facts=json.loads((root/'payload/supervisor-blocker.json').read_text())['facts']
            self.assertTrue(facts['cleanup']['known'])
            self.assertTrue(facts['cleanup']['recorded']['cleanupComplete'])
    def test_real_sparse_overflow_retains_failed_receipt_only(self):
        with tempfile.TemporaryDirectory(prefix='hud-overflow-') as tmp:
            root=Path(tmp);report,owner,binding=complete_files(root)
            # Requires separately admitted >=64 MiB per-file allowance; stream caps stay 2 MiB.
            with (root/'runtime.stdout').open('wb') as stream:stream.truncate(CAP+1)
            finalize_payload(root,binding,owner,time.monotonic()+5)
            self.assertEqual(owner['status'],'failed');self.assertGreater(owner['artifactOverflowBytes'],CAP)
            result=verify_payload(root,time.monotonic()+5)
            self.assertEqual(set(result['files']),{'supervisor-receipt.json'})
    def test_source_drift_and_setup_missing_payload_keep_failed_but_upload_safe(self):
        for variant in ['source-drift','setup-failure']:
            with self.subTest(variant=variant),tempfile.TemporaryDirectory(prefix='hud-bounds-') as tmp:
                root=Path(tmp)
                if variant=='source-drift':
                    report,owner,binding=complete_files(root)
                    finalize_payload(root,binding,owner,time.monotonic()+5)
                    (root/'evidence'/PNG[0]).write_bytes(b'changed source evidence')
                else:
                    (root/'setup-blocker.json').write_text(json.dumps({'status':'blocked','identity':{'candidateSha':'app','workflowSha':'infra','runId':'123','runAttempt':'1'}}))
                result=bounds_for_upload(root,time.monotonic()+5)
                self.assertEqual(result,{'exitCode':1,'uploadSafe':True})
                marker=root/'github-output'
                self.assertEqual(write_upload_safety(result,marker),1)
                self.assertEqual(marker.read_text(),'upload_safe=true\n')
                verify_payload(root,time.monotonic()+5)
                blocker=json.loads((root/'payload/supervisor-blocker.json').read_text())
                self.assertFalse(blocker['acceptance']);self.assertEqual(blocker['facts']['identity']['runId'],'123')
                self.assertEqual(blocker['facts']['cleanup']['known'],variant=='source-drift')
    def test_false_safety_never_writes_upload_marker(self):
        with tempfile.TemporaryDirectory(prefix='hud-marker-') as tmp:
            marker=Path(tmp)/'github-output'
            with self.assertRaises(AssertionError):write_upload_safety({'exitCode':1,'uploadSafe':False},marker)
            self.assertFalse(marker.exists())
    def test_unverified_fallback_never_returns_upload_safe(self):
        with tempfile.TemporaryDirectory(prefix='hud-unsafe-') as tmp:
            with patch.object(finalizer,'failure_payload',side_effect=OSError('Cannot persist safe fallback')):
                with self.assertRaises(OSError):bounds_for_upload(Path(tmp),time.monotonic()+5)

if __name__=='__main__':unittest.main()
