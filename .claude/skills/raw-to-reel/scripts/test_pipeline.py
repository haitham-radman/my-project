import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pipeline  # noqa: E402


class PureHelpers(unittest.TestCase):
    def test_drop_bad_takes_keeps_last_retake(self):
        segs = [
            {"start": 0, "end": 3, "text": "Today I will show you how to"},
            {"start": 4, "end": 9, "text": "Today I will show you how to edit videos fast"},
            {"start": 10, "end": 14, "text": "It takes one click"},
        ]
        keep, dropped = pipeline.drop_bad_takes(segs)
        self.assertEqual(dropped, 1)
        self.assertEqual(keep, [(4, 9), (10, 14)])

    def test_drop_bad_takes_arabic(self):
        segs = [{"start": 0, "end": 2, "text": "اليوم بعلمكم كيف"},
                {"start": 3, "end": 7, "text": "اليوم بعلمكم كيف تعدلون الفيديو"}]
        self.assertEqual(pipeline.drop_bad_takes(segs)[1], 1)

    def test_join_times(self):
        self.assertEqual(pipeline.join_times([(0, 2), (5, 8), (9, 10)]), [2.0, 5.0])

    def test_ass_groups_words(self):
        words = [{"start": i, "end": i + 0.5, "word": f"w{i}"} for i in range(5)]
        ass = pipeline.words_to_ass(words, 576, 1024)
        self.assertEqual(ass.count("Dialogue:"), 2)
        self.assertIn("{\\k50}w0", ass)


class ModelPath(unittest.TestCase):
    def test_local_model_path_is_used_without_download(self):
        import types
        seen = {}

        class Fake:
            def __init__(self, model, local_files_only):
                seen.update(model=model, local_only=local_files_only)

            def transcribe(self, path, word_timestamps):
                return [], None

        sys.modules["faster_whisper"] = types.SimpleNamespace(WhisperModel=Fake)
        try:
            pipeline.transcribe("x.mp4", model="/models/small")
        finally:
            del sys.modules["faster_whisper"]
        self.assertEqual(seen, {"model": "/models/small", "local_only": True})


if __name__ == "__main__":
    unittest.main()
