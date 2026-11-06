"""Pure dry fixtures only: no process launch, signal, browser, prctl or /proc reads."""
import unittest
from supervisor import Owners,bounded_chunk,cleanup_proven,stop_reason,WORK,RSS,PROFILE

def row(ppid,start,rss=1,state='S'):return {'ppid':ppid,'start':start,'rss':rss,'state':state}
class OwnershipTests(unittest.TestCase):
    def test_detached_descendants_follow_parentage_not_process_group(self):
        o=Owners(10);live=o.update({11:row(10,100),12:row(11,101),13:row(12,102),99:row(1,999)})
        self.assertEqual(set(live),{11,12,13});self.assertNotIn(99,o.known)
    def test_reparented_detached_browser_is_adopted_by_subreaper(self):
        o=Owners(10);live=o.update({12:row(10,101),13:row(12,102)})
        self.assertEqual(set(live),{12,13})
    def test_pid_reuse_never_authorizes_signal(self):
        o=Owners(10);o.update({11:row(10,100)})
        self.assertFalse(o.signalable(11,row(1,200)));self.assertEqual(o.update({11:row(1,200)}),{})
    def test_cleanup_requires_no_known_survivor(self):
        o=Owners(10);o.update({11:row(10,100),12:row(11,101)})
        self.assertTrue(o.update({12:row(10,101)}));self.assertEqual(o.update({}),{})
    def test_orphan_with_unknown_parent_is_not_signaled(self):
        o=Owners(10);self.assertEqual(o.update({99:row(1,1)}),{});self.assertFalse(o.signalable(99,row(1,1)))
    def test_deadline_and_sampled_limits_fail_without_a_retry_budget(self):
        self.assertIsNone(stop_reason(WORK-1,RSS,PROFILE))
        self.assertEqual(stop_reason(WORK,1,1),'work deadline')
        self.assertEqual(stop_reason(0,RSS+1,1),'sampled owned RSS limit')
        self.assertEqual(stop_reason(0,1,PROFILE+1),'sampled profile size limit')
    def test_unknown_cleanup_never_releases_lane(self):
        self.assertTrue(cleanup_proven({},[]))
        self.assertFalse(cleanup_proven({12:row(1,1)},[]))
        self.assertFalse(cleanup_proven({},[12]))
    def test_stream_cap_preserves_prefix_and_flags_overflow(self):
        self.assertEqual(bounded_chunk(2,b'abcdef',5),(b'abc',True))
        self.assertEqual(bounded_chunk(5,b'x',5),(b'',True))
        self.assertEqual(bounded_chunk(2,b'abc',5),(b'abc',False))
if __name__=='__main__':unittest.main()
