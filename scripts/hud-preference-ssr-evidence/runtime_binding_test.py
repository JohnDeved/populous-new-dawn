"""Pure policy/queue/resolver fixtures; never call main, readelf, ldconfig or Chrome."""
from pathlib import Path
import unittest
from runtime_binding import ElfRoots, QT_RESOURCES, admit_resource_policy, resolve_needed

class RuntimeBindingTests(unittest.TestCase):
    def test_exact_version_and_browser_required(self):
        valid={'chromeVersion':'Google Chrome 156.0.8078.79','browser':'/opt/google/chrome/chrome'}
        admit_resource_policy(valid)
        for change in [{'chromeVersion':'Google Chrome 157.0.0.1'},{'browser':'/tmp/chrome'}]:
            with self.assertRaises(AssertionError):admit_resource_policy({**valid,**change})

    def test_both_optional_resources_are_inventoried(self):
        roots=ElfRoots()
        for name in QT_RESOURCES:roots.inventory(name)
        self.assertEqual(roots.resources,{Path(name) for name in QT_RESOURCES})
        self.assertEqual(roots.required,set())
        self.assertEqual(roots.pending,[])

    def test_all_other_roots_stay_mandatory(self):
        roots=ElfRoots()
        names=['/opt/google/chrome/chrome','/opt/google/chrome/chrome-sandbox',
            '/opt/google/chrome/chrome_crashpad_handler','/opt/google/chrome/libEGL.so',
            '/opt/google/chrome/libGLESv2.so','/opt/google/chrome/libvk_swiftshader.so',
            '/opt/google/chrome/libvulkan.so.1','/tmp/libqt6_shim.so',
            '/opt/google/chrome/libqt6_shim.so.extra','/usr/bin/python3','/usr/bin/readelf']
        for name in names:roots.inventory(name)
        self.assertEqual(roots.required,{Path(name) for name in names})

    def test_resource_later_reached_is_promoted(self):
        roots=ElfRoots();name=Path('/opt/google/chrome/libqt6_shim.so')
        roots.inventory(name)
        roots.promote(name)
        self.assertEqual(roots.required,{name})
        self.assertEqual(roots.pending,[name])
        with self.assertRaisesRegex(AssertionError,'libQt6Core.so.6'):
            resolve_needed(name,'libQt6Core.so.6',[],{})

    def test_explicit_required_overrides_resource_status(self):
        roots=ElfRoots();name=Path('/opt/google/chrome/libqt5_shim.so')
        roots.inventory(name,required=True)
        self.assertEqual(roots.pending,[name])

    def test_cycles_and_repeated_promotion_do_not_duplicate(self):
        roots=ElfRoots()
        for name in ['/one','/two','/one','/two']:roots.promote(name)
        self.assertEqual(roots.pending,[Path('/one'),Path('/two')])

    def test_required_dependency_missing_remains_fatal(self):
        with self.assertRaisesRegex(AssertionError,'Unresolved static ELF dependency: /chrome: libRequired.so'):
            resolve_needed(Path('/chrome'),'libRequired.so',[],{})
        with self.assertRaises(AssertionError):resolve_needed(Path('/chrome'),'../outside.so',[],{})
        self.assertEqual(resolve_needed(Path('/chrome'),'libRequired.so',[],{'libRequired.so':['/lib/bound.so']}),Path('/lib/bound.so'))

    def test_inventory_does_not_consume_dependency_queue(self):
        roots=ElfRoots();name=Path('/opt/google/chrome/libqt6_shim.so')
        roots.inventory(name);roots.promote(name);roots.inventory(name)
        self.assertEqual(roots.pending,[name])
        self.assertIn(name,roots.resources)

if __name__=='__main__':unittest.main(verbosity=2)
