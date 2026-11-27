"""Pure tests: no invocation of a build or observer subprocess."""
import io
import json
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch
from stage import MAX_LOG_BYTES, emit, measure

def samples(n=60, pss=999_999_999):
    return {
        "rows": [
            {"status": "observed", "elapsedMs": i * 250, "readSpanNs": 249_999_999,
             "members": 32, "pssKiB": pss-i, "sampleStartOffsetNs": i * 250_000_000,
             "sampleEndOffsetNs": i * 250_000_000 + 249_999_999}
            for i in range(n)
        ],
        "maximaKiB": {"pssKiB": pss, "rssSummedKiB": pss, "vmRssApproxSummedKiB": pss},
        "anchorUtcNs": [1_795_747_200_123_456_789, 1_795_747_200_123_458_789],
        "endAnchorUtcNs": [1_795_747_215_123_456_789, 1_795_747_215_123_458_789],
        "anchorElapsedNs": 15_000_000_000,
    }

def through(o):
    signal, r = measure("/trusted/pnpm", spawn=lambda *_a, **_kw: (0,o),
                        free=lambda: 12345678901234, clock=iter([0,18_000_000_000]).__next__)
    assert signal == 0
    return r

class SeriesTests(unittest.TestCase):
    def test_60_rows_round_trip_and_bounds(self):
        r = through(samples())
        self.assertEqual(r["schema"], "pnd-quality-build-telemetry-v2")
        s = r["sampleSeries"]
        self.assertEqual(len(s["rows"]), 60)
        self.assertEqual(s["anchorUtcNs"], ["1795747200123456789", "1795747200123458789"])
        self.assertEqual(max(row[3] for row in s["rows"]),r["observation"]["maximaKiB"]["pssKiB"])
        buf=io.StringIO()
        with redirect_stdout(buf):
            emit(r)
        lines = buf.getvalue().strip().splitlines()
        self.assertEqual(len(lines),1)
        prefix,value=lines[0].split(" ",1)
        self.assertEqual(prefix,"PND_QUALITY_BUILD_TELEMETRY_V2")
        self.assertLessEqual(len(value.encode()),MAX_LOG_BYTES)
        self.assertEqual(json.loads(value),r)

    def test_tight_budget_falls_back_losslessly(self):
        o=samples()
        v2=through(o)
        with patch("stage.MAX_LOG_BYTES",1_000):
            v1=through(o)
        self.assertEqual(v1["schema"],"pnd-quality-build-telemetry-v1")
        self.assertNotIn("sampleSeries",v1)
        self.assertEqual(v1["observation"],v2["observation"])
        self.assertEqual(v1["buildExitCode"],v2["buildExitCode"])

    def test_missing_bad_or_discontinuous_clock_and_bad_max_fall_back(self):
        for patch_data in (
            lambda o: o.pop("anchorUtcNs"),
            lambda o: o["anchorUtcNs"].reverse(),
            lambda o: o["anchorUtcNs"].__setitem__(1,o["anchorUtcNs"][0]+5_000_001),
            lambda o: o["rows"][3].__setitem__("sampleStartOffsetNs",o["rows"][2]["sampleStartOffsetNs"]),
            lambda o: o["rows"][0].__setitem__("readSpanNs",250_000_001),
            lambda o: o["maximaKiB"].__setitem__("pssKiB",121),
            lambda o: o["rows"].append({"elapsedMs": 14999, "status": "missing"}),
            lambda o: o.__setitem__("anchorElapsedNs", 14_500_000_000),
        ):
            with self.subTest(change=patch_data):
                obs=samples()
                patch_data(obs)
                self.assertEqual(through(obs)["schema"],"pnd-quality-build-telemetry-v1")

    def test_missing_rows_or_null_pss_are_not_inferred(self):
        o=samples()
        o["rows"][2]={"status":"missing","topology":"topology-changed","elapsedMs":749}
        o["rows"][4]["pssKiB"]=None
        r=through(o)
        self.assertEqual(r["observation"]["samplesTotal"],60)
        self.assertEqual(r["observation"]["samplesObserved"],59)
        self.assertEqual(len(r["sampleSeries"]["rows"]),58)

if __name__ == "__main__":
    unittest.main()
