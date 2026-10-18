import io
import json
import os
import tempfile
import unittest
from pathlib import Path
import urllib.error

import openverse


class Resp(io.BytesIO):
    def __init__(self, data, ctype="application/json"):
        super().__init__(data)
        self.headers = {"Content-Type": ctype}

    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()


ITEM = {"id": "abcd1234-0000", "title": "Heavy Rain!", "creator": "Jo", "license": "by",
        "license_version": "4.0", "url": "https://cdn.example/rain.mp3", "filetype": "mp3",
        "duration": 12000, "foreign_landing_url": "https://example/rain"}


class OpenverseTests(unittest.TestCase):
    def test_search_url(self):
        u = openverse.build_search_url("rain", "sound_effect", True, 50)
        self.assertTrue(u.startswith(openverse.API + "?"))
        self.assertIn("license_type=commercial", u)
        self.assertIn("page_size=20", u)

    def test_search_filters_duration(self):
        long_item = dict(ITEM, id="x" * 8, duration=90000)
        body = json.dumps({"results": [ITEM, long_item]}).encode()
        res = openverse.search("rain", max_seconds=30, opener=lambda url, t=30: Resp(body))
        self.assertEqual([r["id"] for r in res], [ITEM["id"]])

    def test_flags(self):
        self.assertEqual(openverse.flags(dict(ITEM, license="cc0")), [])
        self.assertIn("NON-COMMERCIAL", openverse.flags(dict(ITEM, license="by-nc")))
        self.assertIn("NO-DERIVATIVES", openverse.flags(dict(ITEM, license="by-nd")))

    def test_http_error_message(self):
        def boom(url, t=30):
            raise urllib.error.HTTPError(url, 429, "x", {}, None)
        with self.assertRaises(SystemExit) as c:
            openverse.fetch_json("https://api.openverse.org/v1/audio/", boom)
        self.assertIn("rate limit", str(c.exception))

    def test_get_saves_and_credits_without_overwrite(self):
        def opener(url, t=30):
            if url.endswith("/"):
                return Resp(json.dumps(ITEM).encode())
            return Resp(b"ID3data", "audio/mpeg")
        with tempfile.TemporaryDirectory() as d:
            _, path = openverse.get(ITEM["id"], d, opener)
            self.assertTrue(os.path.exists(path))
            self.assertIn("Heavy Rain", Path(d, "ATTRIBUTION.txt").read_text(encoding="utf-8"))
            with self.assertRaises(SystemExit):
                openverse.get(ITEM["id"], d, opener)

    def test_rejects_html_and_bad_id_and_http(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(SystemExit):
                openverse.download(ITEM, d, lambda u, t=30: Resp(b"<html>", "text/html"))
            self.assertEqual(os.listdir(d), [])
        with self.assertRaises(SystemExit):
            openverse.get("../etc/passwd", ".")
        with self.assertRaises(SystemExit):
            openverse._open("http://api.openverse.org/v1/audio/")


if __name__ == "__main__":
    unittest.main()
