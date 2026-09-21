import importlib.util
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('build_gate', Path(__file__).with_name('verify-build.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class BuildGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.out = self.root / 'dist'
        self.out.mkdir()
        self.pages = ['index.html', '新規/index.html', 'downloads/checklist.html']
        for rel in self.pages:
            for base in [self.root, self.out]:
                p = base / rel
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text('synthetic page: ' + rel)
        xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(
            '<url><loc>https://katachi-ai.com' + p + '</loc></url>'
            for p in ['/', '/%E6%96%B0%E8%A6%8F/', '/downloads/checklist']) + '</urlset>'
        self.sitemap(xml)

    def sitemap(self, xml):
        for base in [self.root, self.out]:
            (base / 'sitemap.xml').write_text(xml)

    def test_clean_real_output(self):
        self.assertEqual(gate.verify(self.root, self.out), self.pages)

    def test_new_directory_omitted_from_copy(self):
        (self.out / self.pages[1]).unlink()
        with self.assertRaisesRegex(ValueError, 'omitted'):
            gate.verify(self.root, self.out)

    def test_wrong_body(self):
        (self.out / self.pages[1]).write_text('stale body')
        with self.assertRaisesRegex(ValueError, 'differs'):
            gate.verify(self.root, self.out)

    def test_missing_source(self):
        (self.root / self.pages[1]).unlink()
        with self.assertRaisesRegex(ValueError, 'missing'):
            gate.verify(self.root, self.out)

    def test_symlink_escape(self):
        target = self.root / 'outside.html';target.write_text('synthetic')
        (self.out / 'index.html').unlink()
        (self.out / 'index.html').symlink_to(target)
        with self.assertRaisesRegex(ValueError, 'escapes'):
            gate.verify(self.root, self.out)

    def test_invalid_sitemaps(self):
        for xml in ['<urlset/>', '<broken', '<urlset><url><loc>https://other.example/</loc></url></urlset>',
                    '<urlset><url><loc>https://katachi-ai.com/%2E%2E/private</loc></url></urlset>']:
            self.sitemap(xml)
            with self.assertRaises((ValueError, gate.ET.ParseError)):
                gate.verify(self.root, self.out)

    def test_real_build_entry_rejects_unlisted_copy_directory(self):
        # Exercise the actual shell entry, with wholly synthetic publication files.
        for rel in ('privacy.html', 'robots.txt', 'favicon.svg', 'profile.png', 'ogp.png', '_headers'):
            (self.root / rel).write_text('fixture')
        for directory in ('samples', 'training', 'services', 'about', 'scripts'):
            (self.root / directory).mkdir(exist_ok=True)
        for name in ('build-cloudflare-pages.sh', 'verify-build.py'):
            shutil.copyfile(Path(__file__).with_name(name), self.root / 'scripts' / name)
        result = subprocess.run(['sh', 'scripts/build-cloudflare-pages.sh'], cwd=self.root,
                                capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('FAIL: build output', result.stdout)

    def test_output_sitemap_mismatch(self):
        (self.out / 'sitemap.xml').write_text('<urlset/>')
        with self.assertRaisesRegex(ValueError, 'sitemap differs'):
            gate.verify(self.root, self.out)


if __name__ == '__main__':
    unittest.main()
